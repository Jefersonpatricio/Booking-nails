"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import { usePanelData } from "./PanelDataContext";
import { useAuth } from "./AuthContext";
import { deleteAppointment, fetchAppointments, type Appointment } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  buildMonthGrid,
  endOfMonth,
  formatMonthYear,
  formatWeekdayDate,
  getWeekDays,
  isSameDay,
  startOfMonth,
  WEEKDAY_SHORT,
} from "@/lib/date";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AppointmentDetailsDrawer from "./AppointmentDetailsDrawer";
import common from "./panelCommon.module.css";
import styles from "./Dashboard.module.css";

type View = "dia" | "semana" | "mes";

type LaidOutAppointment = Omit<Appointment, "date"> & {
  date: Date;
  startHour: number;
  endHour: number;
  row: number;
  span: number;
  col: number | null;
  timeLabel: string;
  bg: string;
  border: string;
  dot: string;
};

const ROSE = { bg: "rgba(139,123,216,0.1)", border: "rgba(139,123,216,0.35)", dot: "var(--accent)" };
const GREEN = { bg: "rgba(31,157,107,0.1)", border: "rgba(31,157,107,0.35)", dot: "#1f9d6b" };

const TIME_HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8 AM .. 7 PM

function formatHourLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function isManutencao(serviceName: string): boolean {
  return serviceName.toLowerCase().includes("manuten");
}

function parseTimeToHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function dayTimePeriod(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatHourAsTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { appointmentsRefreshToken, openNewAppointmentModal } = usePanelData();
  const { user } = useAuth();
  const [view, setView] = useState<View>("semana");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<LaidOutAppointment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; clientName: string } | null>(null);

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const weekDays = useMemo(() => getWeekDays(today), [today]);
  const monthGrid = useMemo(() => buildMonthGrid(today), [today]);

  function selectDay(date: Date, nextView: View = "dia") {
    setSelectedDate(date);
    setView(nextView);
  }

  const loadAppointments = useCallback(() => {
    setLoading(true);
    return fetchAppointments(startOfMonth(today), endOfMonth(today))
      .then(setAppointments)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [today]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments, appointmentsRefreshToken]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteAppointment(pendingDelete.id);
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir agendamento.");
    } finally {
      setPendingDelete(null);
    }
  }

  const laidOutAppointments = useMemo(
    () =>
      appointments.map((a) => {
        const date = new Date(a.date);
        const startHour = parseTimeToHour(a.time);
        const endHour = startHour + a.service.durationMin / 60;
        const row = Math.round(startHour - 8) + 2;
        const span = Math.max(1, Math.ceil(endHour - startHour));
        const colors = isManutencao(a.service.name) ? GREEN : ROSE;
        const weekdayOffset = weekDays.findIndex((d) => isSameDay(d, date));
        return {
          ...a,
          date,
          startHour,
          endHour,
          row,
          span,
          col: weekdayOffset >= 0 ? weekdayOffset + 2 : null,
          timeLabel: `${a.time} - ${formatHourAsTime(endHour)}`,
          ...colors,
        };
      }),
    [appointments, weekDays],
  );

  const eventDays = useMemo(() => new Set(appointments.map((a) => new Date(a.date).getDate())), [appointments]);

  const dayAppointments = laidOutAppointments
    .filter((a) => isSameDay(a.date, selectedDate))
    .sort((a, b) => a.startHour - b.startHour);

  const startOfToday = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);

  const completedRevenue = appointments
    .filter((a) => new Date(a.date) < startOfToday)
    .reduce((sum, a) => sum + a.service.priceCents, 0);
  const upcomingRevenue = appointments
    .filter((a) => new Date(a.date) >= startOfToday)
    .reduce((sum, a) => sum + a.service.priceCents, 0);

  const isWeekGrid = view === "semana" && !isMobile;
  const isWeekList = view === "semana" && isMobile;
  const isDay = view === "dia";
  const isMonth = view === "mes";

  const mobileWeekGroups = weekDays
    .map((d) => ({ date: d, items: laidOutAppointments.filter((a) => isSameDay(a.date, d)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div className={common.pageHeader}>
        <div>
          <h2 className={common.pageTitle}>
            {dayTimePeriod()}, {user?.name}
          </h2>
          <p className={common.pageSubtitle}>Pronta para transformar mais unhas hoje?</p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <section className={common.kpiGrid}>
        <div className={common.kpiCard}>
          <div className={common.kpiHead}>
            <h3 className={common.kpiLabel}>Ganhos Concluídos (Mês)</h3>
            <span className="material-symbols-outlined" style={{ color: "#1f9d6b" }}>
              trending_up
            </span>
          </div>
          <p className={common.kpiValue} style={{ color: "#1f9d6b" }}>
            {formatPrice(completedRevenue)}
          </p>
        </div>
        <div className={common.kpiCard}>
          <div className={common.kpiHead}>
            <h3 className={common.kpiLabel}>Ganhos Futuros Agendados</h3>
            <span className="material-symbols-outlined" style={{ color: "#4c7ea8" }}>
              schedule
            </span>
          </div>
          <p className={common.kpiValue} style={{ color: "#4c7ea8" }}>
            {formatPrice(upcomingRevenue)}
          </p>
        </div>
        <div className={common.kpiCard}>
          <div className={common.kpiHead}>
            <h3 className={common.kpiLabel}>Total de Agendamentos</h3>
            <span className="material-symbols-outlined" style={{ color: "#a89ba0" }}>
              people
            </span>
          </div>
          <p className={common.kpiValue}>{loading ? "…" : appointments.length}</p>
          <p className={common.kpiSub}>atendimentos este mês</p>
        </div>
      </section>

      <section className={styles.dashSection}>
        <div className={`${common.panel} ${styles.sidePanel}`}>
          <div className={styles.sidePanelHead}>
            <h3 className={styles.sidePanelTitle}>{formatWeekdayDate(selectedDate)}</h3>
            <span className={styles.countBadge}>{dayAppointments.length}</span>
          </div>
          <div>
            {dayAppointments.length === 0 && !loading && (
              <p className={styles.emptyToday}>Nenhum agendamento neste dia.</p>
            )}
            {dayAppointments.map((a) => (
              <div
                key={a.id}
                className={styles.dayDetailRow}
                onClick={() => setSelectedAppointment(a)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.dayDetailAvatar} style={{ background: a.bg }} />
                <div className={styles.dayDetailInfo}>
                  <h4>{a.clientName}</h4>
                  <p>
                    {a.time} · {a.service.name}
                  </p>
                </div>
                <span className={styles.dayDetailPrice}>{formatPrice(a.service.priceCents)}</span>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete({ id: a.id, clientName: a.clientName });
                  }}
                  aria-label={`Excluir agendamento de ${a.clientName}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    delete
                  </span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => openNewAppointmentModal({ date: selectedDate })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
            Adicionar
          </button>
        </div>

        <div className={`${common.panel} ${styles.calendarPanel}`}>
          <div className={styles.calendarHead}>
            <div className={styles.calendarHeadLeft}>
              <h3 className={styles.calendarTitle}>{formatMonthYear(today)}</h3>
              <div className={styles.legend}>
                <span className={styles.legendItem} style={{ color: "var(--accent)" }}>
                  <span className={styles.legendDot} style={{ background: "var(--accent)" }} />
                  Aplicação
                </span>
                <span className={styles.legendItem} style={{ color: "#1f9d6b" }}>
                  <span className={styles.legendDot} style={{ background: "#1f9d6b" }} />
                  Manutenção
                </span>
              </div>
            </div>
            <div className={styles.viewToggle}>
              {(["dia", "semana", "mes"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={view === v ? styles.viewBtnActive : styles.viewBtn}
                >
                  {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </div>

          {isWeekList && (
            <div className={styles.weekListWrap}>
              {mobileWeekGroups.length === 0 && !loading && (
                <p className={styles.emptyToday}>Nenhum agendamento nesta semana.</p>
              )}
              {mobileWeekGroups.map((g) => (
                <div key={g.date.toISOString()}>
                  <h4 className={styles.weekListLabel}>{formatWeekdayDate(g.date)}</h4>
                  <div className={styles.weekListItems}>
                    {g.items.map((a) => (
                      <div
                        key={a.id}
                        className={styles.weekListItem}
                        style={{ background: a.bg, borderColor: a.border, cursor: "pointer" }}
                        onClick={() => setSelectedAppointment(a)}
                      >
                        <span className={styles.weekListDot} style={{ background: a.dot }} />
                        <span className={styles.weekListName}>{a.clientName}</span>
                        <span className={styles.weekListTime} style={{ color: a.dot }}>
                          {a.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isWeekGrid && (
            <div className={styles.gridScroll}>
              <div className={styles.weekGrid}>
                <div className={styles.gridCornerCell} style={{ gridColumn: 1, gridRow: 1 }} />
                {weekDays.map((d, i) => {
                  const active = isSameDay(d, selectedDate);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      className={styles.gridDayHead}
                      style={{
                        gridColumn: i + 2,
                        gridRow: 1,
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        fontWeight: active ? 700 : 400,
                        background: active ? "rgba(139,123,216,0.08)" : "#f8f6f6",
                        border: "none",
                        borderBottom: active ? "2px solid var(--accent)" : "1px solid var(--panel-border)",
                        cursor: "pointer",
                        font: "inherit",
                      }}
                      onClick={() => selectDay(d, "dia")}
                    >
                      {formatWeekdayDate(d)}
                    </button>
                  );
                })}
                {TIME_HOURS.map((hour, i) => (
                  <div key={hour} className={styles.gridTimeLabel} style={{ gridRow: i + 2, gridColumn: 1 }}>
                    {formatHourLabel(hour)}
                  </div>
                ))}
                {TIME_HOURS.map((hour, r) =>
                  weekDays.map((d, c) => (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={styles.gridCell}
                      style={{ gridRow: r + 2, gridColumn: c + 2 }}
                      aria-label={`Novo agendamento em ${formatWeekdayDate(d)} às ${formatHourAsTime(hour)}`}
                      onClick={() => openNewAppointmentModal({ date: d, time: formatHourAsTime(hour) })}
                    />
                  )),
                )}
                {laidOutAppointments
                  .filter((a) => a.col !== null)
                  .map((a) => (
                    <div
                      key={a.id}
                      className={styles.gridAppointment}
                      style={{
                        gridRow: `${a.row} / span ${a.span}`,
                        gridColumn: a.col!,
                        background: a.bg,
                        borderColor: a.border,
                      }}
                      onClick={() => setSelectedAppointment(a)}
                    >
                      <div className={styles.gridAppointmentTop}>
                        <span className={styles.gridAppointmentDot} style={{ background: a.dot }} />
                        <span className={styles.gridAppointmentName}>{a.clientName}</span>
                      </div>
                      <p className={styles.gridAppointmentTime} style={{ color: a.dot }}>
                        {a.timeLabel}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {isDay && (
            <div className={styles.gridScroll}>
              <div className={styles.dayGrid}>
                <div className={styles.gridCornerCell} style={{ gridColumn: 1, gridRow: 1 }} />
                <div
                  className={styles.gridDayHead}
                  style={{
                    gridColumn: 2,
                    gridRow: 1,
                    color: "var(--accent)",
                    fontWeight: 700,
                    background: "rgba(139,123,216,0.08)",
                    borderBottom: "2px solid var(--accent)",
                  }}
                >
                  {formatWeekdayDate(selectedDate)}
                </div>
                {TIME_HOURS.map((hour, i) => (
                  <div key={hour} className={styles.gridTimeLabel} style={{ gridRow: i + 2, gridColumn: 1 }}>
                    {formatHourLabel(hour)}
                  </div>
                ))}
                {TIME_HOURS.map((hour, r) => (
                  <button
                    key={r}
                    type="button"
                    className={styles.gridCell}
                    style={{ gridRow: r + 2, gridColumn: 2 }}
                    aria-label={`Novo agendamento às ${formatHourAsTime(hour)}`}
                    onClick={() => openNewAppointmentModal({ date: selectedDate, time: formatHourAsTime(hour) })}
                  />
                ))}
                {dayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className={styles.gridAppointment}
                    style={{
                      gridRow: `${a.row} / span ${a.span}`,
                      gridColumn: 2,
                      background: a.bg,
                      borderColor: a.border,
                    }}
                    onClick={() => setSelectedAppointment(a)}
                  >
                    <div className={styles.gridAppointmentTop}>
                      <span className={styles.gridAppointmentDot} style={{ background: a.dot }} />
                      <span className={styles.gridAppointmentName}>{a.clientName}</span>
                      <button
                        type="button"
                        className={styles.gridDeleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete({ id: a.id, clientName: a.clientName });
                        }}
                        aria-label={`Excluir agendamento de ${a.clientName}`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          close
                        </span>
                      </button>
                    </div>
                    <p className={styles.gridAppointmentTime} style={{ color: a.dot }}>
                      {a.timeLabel}
                    </p>
                  </div>
                ))}
                {dayAppointments.length === 0 && !loading && (
                  <p className={styles.emptyDay} style={{ gridColumn: 2, gridRow: `2 / span ${TIME_HOURS.length}` }}>
                    {isSameDay(selectedDate, today) ? "Nenhum agendamento hoje." : "Nenhum agendamento neste dia."}
                  </p>
                )}
              </div>
            </div>
          )}

          {isMonth && (
            <div className={styles.monthWrap}>
              <div className={styles.monthWeekdays}>
                {WEEKDAY_SHORT.map((w) => (
                  <div key={w} className={styles.monthWeekdayLabel}>
                    {w}
                  </div>
                ))}
              </div>
              <div className={styles.monthGrid}>
                {monthGrid.map((cell, i) => {
                  if (!cell.date) return <div key={i} className={styles.monthCellEmpty} />;
                  const selected = isSameDay(cell.date, selectedDate);
                  const isToday = isSameDay(cell.date, today);
                  const hasEvents = eventDays.has(cell.date.getDate());
                  return (
                    <button
                      key={i}
                      type="button"
                      className={styles.monthCell}
                      style={{
                        background: selected ? "rgba(139,123,216,0.1)" : "#ffffff",
                        border: selected
                          ? "2px solid var(--accent)"
                          : isToday
                            ? "1px solid var(--accent)"
                            : "1px solid var(--panel-border)",
                      }}
                      onClick={() => selectDay(cell.date!, "dia")}
                    >
                      <span
                        className={styles.monthCellDate}
                        style={{ fontWeight: selected ? 700 : 500, color: selected ? "var(--accent)" : "var(--text)" }}
                      >
                        {cell.date.getDate()}
                      </span>
                      {hasEvents && <span className={styles.monthCellDot} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onDelete={(id, clientName) => setPendingDelete({ id, clientName })}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Excluir agendamento"
        message={`Tem certeza que deseja excluir o agendamento de ${pendingDelete?.clientName}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
