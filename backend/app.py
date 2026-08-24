import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
import json
from typing import Any, Callable

import bcrypt
import jwt
import psycopg
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg.rows import dict_row
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).parent
DATA_FILE = BACKEND_DIR / "data.json"
load_dotenv(BACKEND_DIR / ".env")

app = Flask(__name__)
CORS(app)


def database_configured() -> bool:
    return os.getenv("DB_ENABLED", "false").lower() == "true" and all(
        os.getenv(name) for name in ["DB_USER", "DB_NAME", "DB_PASSWORD"]
    )


def read_data() -> dict[str, list[dict[str, Any]]]:
    with DATA_FILE.open(encoding="utf-8") as file:
        return json.load(file)


def write_data(data: dict[str, list[dict[str, Any]]]) -> None:
    temporary_file = DATA_FILE.with_suffix(".tmp")
    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)
    temporary_file.replace(DATA_FILE)


def local_employee(user_id: int) -> dict[str, Any] | None:
    return next((user for user in read_data()["labers"] if user["id"] == user_id), None)


def calculate_efficiency(output: float, smv: float, manpower: float, working_minutes: float) -> float:
    return output * smv / (working_minutes * manpower) * 100


def query(sql: str, params: tuple[Any, ...] = (), *, fetchone: bool = False) -> Any:
    required_settings = ["DB_USER", "DB_NAME", "DB_PASSWORD"]
    missing_settings = [name for name in required_settings if not os.getenv(name)]
    if missing_settings:
        raise RuntimeError(
            "Missing database configuration: " + ", ".join(missing_settings) + ". "
            "Create backend/.env from backend/.env.example."
        )

    connection = psycopg.connect(
        user=os.getenv("DB_USER"),
        host=os.getenv("DB_HOST", "localhost"),
        dbname=os.getenv("DB_NAME"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT", "5432"),
    )
    try:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql, params)
            if fetchone:
                rows = cursor.fetchone()
            elif cursor.description:
                rows = cursor.fetchall()
            else:
                rows = []
            connection.commit()
            return rows
    finally:
        connection.close()


def error_message(error: Exception) -> tuple[Any, int]:
    return jsonify(error=str(error)), 500


def auth_required(handler: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(handler)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        if not token:
            return jsonify(message="Unauthorized: No token provided"), 401
        try:
            request.user = jwt.decode(token, os.getenv("JWT_SECRET", ""), algorithms=["HS256"])
        except jwt.InvalidTokenError:
            return jsonify(message="Invalid token"), 401
        return handler(*args, **kwargs)

    return wrapper


def admin_required(handler: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(handler)
    @auth_required
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        if getattr(request, "user", {}).get("role") != "admin":
            return jsonify(message="Access denied: Admins only"), 403
        return handler(*args, **kwargs)

    return wrapper


@app.get("/")
def health() -> Any:
    return "API Running..."


@app.post("/api/labers/register")
def register() -> Any:
    try:
        data = request.get_json() or {}
        if data.get("role") not in {"admin", "labor"}:
            return jsonify(message="Invalid role. Must be 'admin' or 'labor'."), 400
        if query("SELECT id FROM labers WHERE name = %s", (data.get("name"),), fetchone=True):
            return jsonify(message="User already exists"), 400
        password = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
        user = query(
            """INSERT INTO labers (name, age, role, password)
               VALUES (%s, %s, %s, %s) RETURNING id, name, age, role""",
            (data["name"], data.get("age"), data["role"], password),
            fetchone=True,
        )
        return jsonify(message="User registered successfully", user=user), 201
    except Exception as error:
        return error_message(error)


@app.post("/api/labers/login")
def login() -> Any:
    try:
        data = request.get_json() or {}
        user = query("SELECT * FROM labers WHERE name = %s", (data.get("name"),), fetchone=True)
        if not user:
            return jsonify(message="User not found"), 404
        if not bcrypt.checkpw(data.get("password", "").encode(), user["password"].encode()):
            return jsonify(message="Invalid password"), 401
        token = jwt.encode(
            {"id": user["id"], "name": user["name"], "role": user["role"], "exp": datetime.now(timezone.utc) + timedelta(days=7)},
            os.getenv("JWT_SECRET", ""),
            algorithm="HS256",
        )
        return jsonify(message="Login successful", token=token, user={"id": user["id"], "name": user["name"], "role": user["role"]})
    except Exception as error:
        return error_message(error)


@app.get("/api/labers/employee/<int:user_id>")
def get_employee(user_id: int) -> Any:
    try:
        if not database_configured():
            user = local_employee(user_id)
            return (jsonify({key: value for key, value in user.items() if key != "password"}), 200) if user else (jsonify(message="Not found"), 404)
        user = query("SELECT id, name, age, role FROM labers WHERE id = %s", (user_id,), fetchone=True)
        return (jsonify(user), 200) if user else (jsonify(message="Not found"), 404)
    except Exception as error:
        return error_message(error)


@app.get("/api/labers/")
@auth_required
def get_labers() -> Any:
    return jsonify(query("SELECT id, name, age, role FROM labers ORDER BY id ASC"))


@app.get("/api/labers/<int:user_id>")
@auth_required
def get_laber(user_id: int) -> Any:
    user = query("SELECT id, name, age, role FROM labers WHERE id = %s", (user_id,), fetchone=True)
    return (jsonify(user), 200) if user else (jsonify(message="Not found"), 404)


@app.put("/api/labers/<int:user_id>")
@admin_required
def update_laber(user_id: int) -> Any:
    data = request.get_json() or {}
    fields = ["name = %s", "age = %s", "role = %s"]
    values: list[Any] = [data.get("name"), data.get("age"), data.get("role")]
    if data.get("password"):
        fields.append("password = %s")
        values.append(bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode())
    values.append(user_id)
    return jsonify(query(f"UPDATE labers SET {', '.join(fields)} WHERE id = %s RETURNING id, name, age, role", tuple(values), fetchone=True))


@app.delete("/api/labers/<int:user_id>")
@admin_required
def delete_laber(user_id: int) -> Any:
    query("DELETE FROM labers WHERE id = %s", (user_id,))
    return jsonify(message="Deleted successfully")


@app.post("/api/labers/laborers")
def create_laborer_log() -> Any:
    try:
        data = request.get_json() or {}
        output = float(data["output"])
        smv = float(data["smv"])
        manpower = float(data.get("manpower", 1))
        working_minutes = float(data.get("working_minutes", 60))
        efficiency = calculate_efficiency(output, smv, manpower, working_minutes)
        status = "HIGH" if efficiency >= 85 else "MEDIUM" if efficiency >= 60 else "LOW"
        if not database_configured():
            local_data = read_data()
            next_id = max((row["id"] for row in local_data["laborers_data"]), default=0) + 1
            row = {"id": next_id, "laborers_id": int(data["laborers_id"]), "output": output, "efficiency": efficiency, "smv": smv, "manpower": manpower, "working_minutes": working_minutes, "date": data.get("date"), "status": status}
            local_data["laborers_data"].append(row)
            write_data(local_data)
            return jsonify(row), 201
        row = query(
            """INSERT INTO laborers_data (laborers_id, output, smv, manpower, working_minutes, efficiency, status, date)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (data["laborers_id"], output, smv, manpower, working_minutes, efficiency, status, data.get("date")),
            fetchone=True,
        )
        return jsonify(row), 201
    except Exception as error:
        return error_message(error)


@app.get("/api/labers/laborers")
def get_laborer_logs() -> Any:
    if not database_configured():
        return jsonify(sorted(read_data()["laborers_data"], key=lambda row: (row.get("date") or "", row["id"]), reverse=True))
    return jsonify(query("SELECT * FROM laborers_data ORDER BY date DESC, time DESC"))


@app.get("/api/labers/analysis/<int:laborers_id>")
@auth_required
def get_analysis(laborers_id: int) -> Any:
    if not database_configured():
        history = [row for row in read_data()["laborers_data"] if row["laborers_id"] == laborers_id]
        efficiencies = [float(row["efficiency"]) for row in history]
        average = sum(efficiencies) / len(efficiencies) if efficiencies else None
        total_minutes = sum(float(row["working_minutes"]) for row in history)
        weighted = sum(float(row["efficiency"]) * float(row["working_minutes"]) for row in history) / total_minutes if total_minutes else None
        recent = list(reversed(sorted(history, key=lambda row: (row.get("date") or "", row["id"]))))[:6]
        values = [float(row["efficiency"]) for row in recent]
        trend = "NOT_ENOUGH_DATA"
        if len(values) == 6:
            last_three, previous_three = sum(values[:3]) / 3, sum(values[3:]) / 3
            trend = "IMPROVING" if last_three > previous_three else "DECLINING" if last_three < previous_three else "STABLE"
        return jsonify(laborers_id=str(laborers_id), average_efficiency=average, weighted_average=weighted, trend=trend, history=history)
    history = query("SELECT * FROM laborers_data WHERE laborers_id = %s ORDER BY date", (laborers_id,))
    average = query(
        """SELECT AVG(efficiency) AS avg_efficiency,
                  SUM(efficiency * working_minutes) / SUM(working_minutes) AS weighted_avg
           FROM laborers_data WHERE laborers_id = %s""",
        (laborers_id,), fetchone=True,
    )
    trend_rows = query("SELECT efficiency FROM laborers_data WHERE laborers_id = %s ORDER BY date DESC LIMIT 6", (laborers_id,))
    values = [float(row["efficiency"]) for row in trend_rows]
    trend = "NOT_ENOUGH_DATA"
    if len(values) == 6:
        recent, previous = sum(values[:3]) / 3, sum(values[3:]) / 3
        trend = "IMPROVING" if recent > previous else "DECLINING" if recent < previous else "STABLE"
    return jsonify(laborers_id=laborers_id, average_efficiency=average["avg_efficiency"], weighted_average=average["weighted_avg"], trend=trend, history=history)


def supervisor_query(sql: str, params: tuple[Any, ...] = (), *, fetchone: bool = False) -> Any:
    return query(sql, params, fetchone=fetchone)


@app.route("/api/supervisor/supervisor", methods=["GET", "POST"])
@auth_required
def supervisors() -> Any:
    if request.method == "GET":
        return jsonify(supervisor_query("SELECT * FROM supervisor_data ORDER BY id DESC"))
    data = request.get_json() or {}
    return jsonify(supervisor_query("""INSERT INTO supervisor_data (supervisor_id, efficiency, smv, manpower, working_minutes, date, time, mark) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""", tuple(data.get(key) for key in ["supervisor_id", "efficiency", "smv", "manpower", "working_minutes", "date", "time", "mark"]), fetchone=True)), 201


@app.route("/api/supervisor/supervisor/<int:record_id>", methods=["GET", "PUT", "DELETE"])
@auth_required
def supervisor(record_id: int) -> Any:
    if request.method == "GET":
        row = supervisor_query("SELECT * FROM supervisor_data WHERE id = %s", (record_id,), fetchone=True)
        return (jsonify(row), 200) if row else (jsonify(message="Not found"), 404)
    if request.method == "DELETE":
        supervisor_query("DELETE FROM supervisor_data WHERE id = %s", (record_id,))
        return jsonify(message="Deleted successfully")
    data = request.get_json() or {}
    keys = ["supervisor_id", "efficiency", "smv", "manpower", "working_minutes", "date", "time", "mark"]
    values = [data.get(key) for key in keys] + [record_id]
    return jsonify(supervisor_query("""UPDATE supervisor_data SET supervisor_id=%s, efficiency=%s, smv=%s, manpower=%s, working_minutes=%s, date=%s, time=%s, mark=%s WHERE id=%s RETURNING *""", tuple(values), fetchone=True))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")), debug=True)