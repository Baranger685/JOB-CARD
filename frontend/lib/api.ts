export type Employee = {
  id: number;
  name: string;
  age?: number;
  role?: string;
};

export type LaborerLog = {
  id: number;
  laborers_id: number;
  output: number;
  smv: number;
  manpower: number;
  working_minutes: number;
  efficiency: number;
  status: string;
  date: string;
};

export type DayEndEmployee = {
  employee_id: number;
  employee_name: string;
  entries: number;
  total_output: number;
  average_efficiency: number | null;
  low_efficiency: boolean;
};

export type DayEndSummary = {
  date: string;
  low_threshold: number;
  employees: DayEndEmployee[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function api<T>(path: string, { method = "GET", body, auth = false }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data as T;
}

export const labers = {
  employee: (id: number) => api<Employee>(`/api/labers/employee/${id}`),
};

export const laborerData = {
  create: (body: Record<string, unknown>) => api<LaborerLog>("/api/labers/laborers", { method: "POST", body }),
  list: () => api<LaborerLog[]>("/api/labers/laborers"),
  dayEnd: (date: string) => api<DayEndSummary>(`/api/labers/day-end?date=${encodeURIComponent(date)}`),
};