# Job Card Project

A job-card application with a Flask API backend and a Next.js frontend. Employees can enter hourly production values and view calculated efficiency and saved calculation history.

## Project Structure

```text
JOB-CARD/
├── backend/     Flask API and local data
└── frontend/    Next.js web application
```

## Requirements

Install these before running the project:

- Python 3.10 or newer
- Node.js 18.18 or newer
- npm

PostgreSQL is optional. The default development mode uses `backend/data.json`.

## First-Time Setup

Open PowerShell in the project root:

```powershell
cd "C:\Users\ME\Desktop\R26-IT-140-job-card-project\JOB-CARD"
```

### 1. Set up the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks script activation, allow scripts only for the current terminal session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
```

### 2. Set up the frontend

Open a second PowerShell terminal:

```powershell
cd "C:\Users\ME\Desktop\R26-IT-140-job-card-project\JOB-CARD\frontend"
npm install
```

## Run the Project

The backend and frontend must run at the same time in separate terminals.

### Terminal 1: Backend API

```powershell
cd "C:\Users\ME\Desktop\R26-IT-140-job-card-project\JOB-CARD\backend"
.\venv\Scripts\Activate.ps1
python app.py
```

The API runs at:

- http://localhost:5001
- Health check: http://localhost:5001/

### Terminal 2: Frontend

```powershell
cd "C:\Users\ME\Desktop\R26-IT-140-job-card-project\JOB-CARD\frontend"
npm run dev
```

Open the application at:

- http://localhost:3000

Sign in with employee ID `1`, which is included in the default local data.

Team members can open the daily review page at:

- http://localhost:3000/review

The review page shows each employee's end-of-day average efficiency for the selected date. Employees with an average below `60%` are marked `LOW - review`.

Press `Ctrl+C` in each terminal to stop the corresponding service.

## Default Local Data Mode

The backend uses local JSON storage when `DB_ENABLED=false` or when no backend `.env` file is present. New calculation records are written to:

```text
backend/data.json
```

This mode does not require PostgreSQL. Keep the backend process running while using the frontend.

## Optional PostgreSQL Mode

To use PostgreSQL instead of `data.json`, copy the example environment file:

```powershell
cd "C:\Users\ME\Desktop\R26-IT-140-job-card-project\JOB-CARD\backend"
Copy-Item .env.example .env
```

Edit `backend/.env` and set valid values for:

```dotenv
PORT=5001
DB_ENABLED=true
DB_USER=postgres
DB_HOST=localhost
DB_NAME=garment
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=replace_with_a_long_random_secret
```

Create the database schema before starting the backend:

```powershell
psql -U postgres -d garment -f schema.sql
```

Do not commit `.env`; it can contain database credentials and secrets.

## Useful Commands

Run these from `frontend`:

```powershell
npm run lint
npm run typecheck
npm run build
```

Run a backend syntax check from `backend`:

```powershell
.\venv\Scripts\python.exe -m py_compile app.py
```

## Troubleshooting

### `ModuleNotFoundError` when starting Flask

Make sure the backend virtual environment is active and install the requirements again:

```powershell
cd "C:\Users\ME\Desktop\R26-IT-140-job-card-project\JOB-CARD\backend"
.\venv\Scripts\Activate.ps1
python app.py

### Frontend cannot reach the API

Confirm that the backend is running at http://localhost:5001. The frontend defaults to that URL. To use a different API URL, create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5001
```

Restart the frontend after changing environment variables.

### Port already in use

Stop the process using port `3000` or `5001`, or change the backend `PORT` in `backend/.env`. If the frontend port changes, Next.js will print the new URL in the terminal.

## Production Build

Build and start the frontend with:

```powershell
cd frontend
npm run build
npm run start
```

The Flask development server is intended for local development. Use a production WSGI server and configure PostgreSQL separately for deployment.
