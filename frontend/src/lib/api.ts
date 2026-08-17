export type Service = {
  id: string;
  name: string;
  priceCents: number;
  durationMin: number;
};

export type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  service: Service;
  date: string;
  time: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? fallback;
}

export type AuthUser = { id: string; name: string; email: string };
export type Salon = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
};

export async function login(email: string, password: string): Promise<{ user: AuthUser; salon: Salon }> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Email ou senha inválidos."));
  return res.json();
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<{ user: AuthUser; salon: Salon }> {
  const res = await apiFetch("/auth/me", { cache: "no-store" });
  if (!res.ok) throw new Error("Não autenticado.");
  return res.json();
}

export async function updateProfile(input: { name: string; email: string }): Promise<{ user: AuthUser; salon: Salon }> {
  const res = await apiFetch("/auth/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível salvar o perfil."));
  return res.json();
}

export async function updateSalon(input: { name: string; whatsappNumber?: string }): Promise<Salon> {
  const res = await apiFetch("/salons/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível salvar os dados do salão."));
  return res.json();
}

export async function uploadSalonLogo(file: File): Promise<Salon> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch("/salons/me/logo", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível enviar a imagem."));
  return res.json();
}

export async function getSalonBySlug(slug: string): Promise<Salon> {
  const res = await apiFetch(`/salons/${slug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Salão não encontrado.");
  return res.json();
}

export async function fetchServices(salonSlug: string): Promise<Service[]> {
  const res = await apiFetch(`/services?salonSlug=${encodeURIComponent(salonSlug)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar os serviços.");
  return res.json();
}

export type CreateServiceInput = {
  name: string;
  priceCents: number;
  durationMin: number;
};

export async function createService(input: CreateServiceInput): Promise<Service> {
  const res = await apiFetch("/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível criar o serviço."));
  return res.json();
}

export async function fetchAppointments(from?: Date, to?: Date): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  const qs = params.toString();
  const res = await apiFetch(`/appointments${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar os agendamentos.");
  return res.json();
}

export type CreateAppointmentInput = {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  date: string;
  time: string;
  salonSlug: string;
};

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const res = await apiFetch("/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível confirmar o agendamento."));
  return res.json();
}

export async function deleteAppointment(id: string): Promise<void> {
  const res = await apiFetch(`/appointments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível excluir o agendamento."));
}

export type WorkingHoursDay = {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  intervalMin: number;
};

export async function fetchWeekAvailability(): Promise<WorkingHoursDay[]> {
  const res = await apiFetch("/availability/week", { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar a disponibilidade.");
  return res.json();
}

export async function saveWeekAvailability(days: WorkingHoursDay[]): Promise<WorkingHoursDay[]> {
  const res = await apiFetch("/availability/week", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível salvar a disponibilidade."));
  return res.json();
}

export type DaySlot = { time: string; available: boolean };

export async function fetchSlotsForDate(dateStr: string, salonSlug: string): Promise<DaySlot[]> {
  const res = await apiFetch(
    `/availability/slots?date=${dateStr}&salonSlug=${encodeURIComponent(salonSlug)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Não foi possível carregar os horários do dia.");
  return res.json();
}

export type MonthDayAvailability = {
  date: string;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
  intervalMin: number | null;
  isOverride: boolean;
};

export async function fetchMonthAvailability(year: number, month: number): Promise<MonthDayAvailability[]> {
  const res = await apiFetch(`/availability/month?year=${year}&month=${month}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o calendário.");
  return res.json();
}

export type SaveOverrideInput = {
  date: string;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  intervalMin?: number;
};

export async function saveAvailabilityOverride(input: SaveOverrideInput): Promise<void> {
  const res = await apiFetch("/availability/override", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível salvar a exceção."));
}

export async function deleteAvailabilityOverride(dateStr: string): Promise<void> {
  const res = await apiFetch(`/availability/override/${dateStr}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível remover a exceção."));
}

export type TransactionType = "INCOME" | "EXPENSE";

export type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amountCents: number;
  date: string;
  createdAt: string;
};

export async function fetchTransactions(from?: Date, to?: Date, type?: TransactionType): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  if (type) params.set("type", type);
  const qs = params.toString();
  const res = await apiFetch(`/transactions${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar os lançamentos.");
  return res.json();
}

export type CreateTransactionInput = {
  type: TransactionType;
  description: string;
  amountCents: number;
  date: string;
};

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const res = await apiFetch("/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível criar o lançamento."));
  return res.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await apiFetch(`/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Não foi possível excluir o lançamento."));
}
