"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { laborerData, type DayEndSummary } from "@/lib/api";

function localDateIso(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function ReviewPage() {
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState<DayEndSummary | null>(null);
  const [error, setError] = useState("");

  async function loadSummary(reportDate = date) {
    if (!reportDate) return;
    setError("");
    try {
      setSummary(await laborerData.dayEnd(reportDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  useEffect(() => {
    const currentDate = localDateIso(new Date());
    setDate(currentDate);
    loadSummary(currentDate);
  }, []);

  const flaggedEmployees = summary?.employees.filter((employee) => employee.low_efficiency) ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1b2a4a,_#0b1220_55%)] p-6 text-slate-100 md:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">Team review</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">End-of-day efficiency</h1>
            <p className="mt-2 text-sm text-slate-400">Review each employee&apos;s daily average and low-efficiency flags.</p>
          </div>
          <Link href="/" className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/15">
            Sign out
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#10182b]/90 p-6 shadow-2xl md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <label className="text-sm text-slate-300">
              Report date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-400"
              />
            </label>
            <button
              type="button"
              onClick={() => loadSummary()}
              className="rounded-lg bg-amber-400 px-4 py-2.5 font-medium text-slate-900 hover:bg-amber-300"
            >
              Refresh report
            </button>
          </div>

          {error && <p className="mt-5 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300">{error}</p>}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Employees</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary?.employees.length ?? "--"}</p>
            </div>
            <div className="rounded-lg bg-rose-400/10 p-4">
              <p className="text-xs uppercase tracking-wider text-rose-200">Low efficiency flags</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary ? flaggedEmployees.length : "--"}</p>
            </div>
            <div className="rounded-lg bg-amber-400/10 p-4">
              <p className="text-xs uppercase tracking-wider text-amber-200">Flag threshold</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary ? `Below ${summary.low_threshold}%` : "--"}</p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Entries</th>
                  <th className="pb-3 pr-4">Total output</th>
                  <th className="pb-3 pr-4">Average efficiency</th>
                  <th className="pb-3">Review status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.employees.map((employee) => (
                  <tr key={employee.employee_id} className="border-t border-white/10">
                    <td className="py-4 pr-4 font-medium text-white">#{employee.employee_id} {employee.employee_name}</td>
                    <td className="py-4 pr-4">{employee.entries}</td>
                    <td className="py-4 pr-4">{employee.total_output.toFixed(2)}</td>
                    <td className="py-4 pr-4 font-medium">
                      {employee.average_efficiency === null ? "No data" : `${employee.average_efficiency.toFixed(2)}%`}
                    </td>
                    <td className={`py-4 font-medium ${employee.low_efficiency ? "text-rose-300" : "text-emerald-300"}`}>
                      {employee.low_efficiency ? "LOW - review" : employee.average_efficiency === null ? "No entry" : "On track"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!summary?.employees.length && <p className="py-8 text-center text-sm text-slate-500">No employee data available.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}