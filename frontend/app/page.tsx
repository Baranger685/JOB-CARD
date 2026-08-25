"use client";

import { useEffect, useState, type FormEvent } from "react";
import { labers, laborerData, type Employee, type LaborerLog } from "@/lib/api";

const initialForm = {
  output: "",
  smv: "12",
  manpower: "1",
  working_minutes: "60",
};

const initialPlan = {
  dailyTargetOutput: "",
  workingHours: "8",
};

function calculateEfficiency(form: Record<string, string>) {
  const output = Number(form.output);
  const smv = Number(form.smv);
  const manpower = Number(form.manpower);
  const workingMinutes = Number(form.working_minutes);

  if (!output || !smv || !manpower || !workingMinutes) return null;
  return (output * smv) / (workingMinutes * manpower) * 100;
}

function localDateIso(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState<string>("1");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [plan, setPlan] = useState(initialPlan);
  const [today, setToday] = useState("");
  const [todayIso, setTodayIso] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [logs, setLogs] = useState<LaborerLog[]>([]);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const efficiency = calculateEfficiency(form);
  const todayLogs = todayIso ? logs.filter((log) => log.date?.slice(0, 10) === todayIso) : [];
  const averageDayEfficiency = todayLogs.length
    ? todayLogs.reduce((total, log) => total + Number(log.efficiency), 0) / todayLogs.length
    : null;
  const todayOutput = todayLogs.reduce((total, log) => total + Number(log.output), 0);
  const targetOutput = Number(plan.dailyTargetOutput);
  const targetProgress = targetOutput > 0 ? Math.min((todayOutput / targetOutput) * 100, 100) : null;
  const status =
    efficiency === null
      ? "Waiting for values"
      : efficiency >= 85
        ? "HIGH"
        : efficiency >= 60
          ? "MEDIUM"
          : "LOW";


  useEffect(() => {
    function updateClock() {
      const currentDate = new Date();
      setTodayIso(localDateIso(currentDate));
      setToday(currentDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }));
      setCurrentTime(currentDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }));
    }

    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!employee) return;
    fetchLogs();
  }, [employee]);

  async function fetchLogs(showMessage = false) {
    if (!employee) return;
    if (showMessage) {
      setIsRefreshing(true);
      setRefreshMessage("");
    }
    try {
      const data = await laborerData.list();
      setLogs(data.filter((log) => log.laborers_id === employee.id));
      if (showMessage) setRefreshMessage("Log refreshed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      if (showMessage) setIsRefreshing(false);
    }
  }

  async function onEmployeeLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const data = await labers.employee(Number(employeeId));
      setEmployee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  useEffect(() => {
    if (countdown === 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (countdown > 0) return;

    const result = calculateEfficiency(form);
    if (result === null || !employee) return;

    setError("");
    try {
      await laborerData.create({
        laborers_id: employee.id,
        output: Number(form.output),
        smv: Number(form.smv),
        manpower: Number(form.manpower),
        working_minutes: Number(form.working_minutes),
        date: localDateIso(new Date()),
      });
      await fetchLogs();
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return;
    }
    setCountdown(20);
  }

  if (!employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1b2a4a,_#0b1220_55%)] p-6 text-slate-100">
        <form
          onSubmit={onEmployeeLogin}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10182b]/90 p-8 shadow-2xl"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
            Hourly workforce
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Employee sign in
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your employee ID to open the hourly job card.
          </p>
          {error && (
            <p className="mt-4 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
          <label className="mt-6 block text-sm text-slate-300">
            Employee ID
            <input
              required
              min="1"
              step="1"
              type="number"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-400"
            />
          </label>
          <button className="mt-6 w-full rounded-lg bg-amber-400 py-2.5 font-medium text-slate-900 hover:bg-amber-300">
            Open hourly card
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1b2a4a,_#0b1220_55%)] p-6 text-slate-100 md:p-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
          Hourly workforce
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Hourly job card</h1>
            <p className="mt-2 text-sm text-slate-400">
              {today || "Loading date..."} {currentTime && `at ${currentTime}`}
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-300">
            Live date
          </span>
        </div>
        <p className="mt-2 max-w-xl text-slate-400">
          Employee #{employee.id}: {employee.name}. Enter the output for the current 60-minute hour.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#10182b]/90 p-6 shadow-2xl md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">Daily plan</h2>
              <p className="mt-1 text-sm text-slate-400">Values supplied by the planning model.</p>
            </div>
            <p className="text-sm text-slate-400">
              {today || "Loading date..."} {currentTime && `at ${currentTime}`}
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Daily target output
              <input
                min="0"
                step="any"
                type="number"
                value={plan.dailyTargetOutput}
                placeholder="Enter model target"
                onChange={(e) => setPlan({ ...plan, dailyTargetOutput: e.target.value })}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none placeholder:text-slate-600 focus:border-amber-400"
              />
            </label>
            <label className="text-sm text-slate-300">
              Working hours
              <input
                min="0"
                step="0.5"
                type="number"
                value={plan.workingHours}
                onChange={(e) => setPlan({ ...plan, workingHours: e.target.value })}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-400"
              />
            </label>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Today output</p>
              <p className="mt-2 text-2xl font-semibold text-white">{todayOutput.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Target progress</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {targetProgress === null ? "--" : `${targetProgress.toFixed(1)}%`}
              </p>
            </div>
            <div className="rounded-lg bg-amber-400/10 p-4">
              <p className="text-xs uppercase tracking-wider text-amber-200">Average day efficiency</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {averageDayEfficiency === null ? "--" : `${averageDayEfficiency.toFixed(2)}%`}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/10 bg-[#10182b]/90 p-6 shadow-2xl md:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-4">
          {["output", "smv", "manpower", "working_minutes"].map((field) => (
            <label key={field} className="text-sm capitalize text-slate-300">
              {field.replaceAll("_", " ")}
              <input
                required
                min="0"
                step="any"
                type="number"
                value={form[field]}
                onChange={(e) =>
                  setForm({ ...form, [field]: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-400"
              />
            </label>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button className="rounded-lg bg-amber-400 px-5 py-2.5 font-medium text-slate-900 hover:bg-amber-300">
            {countdown > 0 ? `Next entry in ${countdown}s` : "Calculate"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
            }}
            className="rounded-lg bg-white/10 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/15"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setEmployee(null);
              setEmployeeId("");
              setLogs([]);
              setForm(initialForm);
            }}
            className="rounded-lg bg-white/10 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/15"
          >
            Sign out
          </button>
        </div>
      </form>

          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6">
            <p className="text-sm text-amber-200">Efficiency result</p>
            <p className="mt-4 text-5xl font-semibold text-white">
              {efficiency === null ? "--" : `${efficiency.toFixed(2)}%`}
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-amber-200">
              Status
            </p>
            <p className="mt-2 text-xl font-medium text-white">{status}</p>
            <p className="mt-6 text-sm leading-6 text-slate-300">
              (output x SMV) / (working minutes x manpower) x 100
            </p>
          </section>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#10182b]/90 p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-white">Calculation log</h2>
            <p className="mt-1 text-sm text-slate-400">
              Saved in the backend database.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchLogs(true)}
            disabled={isRefreshing}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing..." : "Refresh log"}
          </button>
        </div>
        {refreshMessage && <p className="mt-3 text-sm text-emerald-300">{refreshMessage}</p>}

        {logs.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No calculations saved yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Employee ID</th>
                  <th className="pb-3 pr-4">Output</th>
                  <th className="pb-3 pr-4">SMV</th>
                  <th className="pb-3 pr-4">Minutes</th>
                  <th className="pb-3 pr-4">Efficiency</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10">
                    <td className="py-3 pr-4">{log.laborers_id}</td>
                    <td className="py-3 pr-4">{log.output}</td>
                    <td className="py-3 pr-4">{log.smv}</td>
                    <td className="py-3 pr-4">{log.working_minutes}</td>
                    <td className="py-3 pr-4">{Number(log.efficiency).toFixed(2)}%</td>
                    <td className="py-3 font-medium text-amber-300">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
