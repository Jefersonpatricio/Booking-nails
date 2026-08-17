"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMonthAvailability, type MonthDayAvailability } from "@/lib/api";
import { buildMonthGrid, formatMonthYear, isSameDay, WEEKDAY_SHORT } from "@/lib/date";
import common from "./panelCommon.module.css";
import styles from "./Horarios.module.css";
import DayOverrideModal from "./DayOverrideModal";

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MonthAvailability() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [days, setDays] = useState<Record<string, MonthDayAvailability>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const monthGrid = buildMonthGrid(viewDate);

  const load = useCallback(() => {
    setLoading(true);
    fetchMonthAvailability(viewDate.getFullYear(), viewDate.getMonth() + 1)
      .then((data) => {
        const map: Record<string, MonthDayAvailability> = {};
        for (const d of data) map[d.date] = d;
        setDays(map);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [viewDate]);

  useEffect(() => {
    load();
  }, [load]);

  function changeMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  const selectedDay = selectedDate ? (days[selectedDate] ?? null) : null;

  return (
    <div>
      <div className={styles.monthNav}>
        <button type="button" className={styles.navBtn} onClick={() => changeMonth(-1)} aria-label="Mês anterior">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h3 className={styles.monthNavTitle}>{formatMonthYear(viewDate)}</h3>
        <button type="button" className={styles.navBtn} onClick={() => changeMonth(1)} aria-label="Próximo mês">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={`${common.panel} ${styles.calendarPanel}`}>
        <div className={styles.calendarWeekdays}>
          {WEEKDAY_SHORT.map((w) => (
            <div key={w} className={styles.calendarWeekdayLabel}>{w}</div>
          ))}
        </div>
        <div className={styles.calendarGrid} style={{ opacity: loading ? 0.5 : 1 }}>
          {monthGrid.map((cell, i) => {
            if (!cell.date) return <div key={i} className={styles.calendarCellEmpty} />;
            const info = days[dateKey(cell.date)];
            const isToday = isSameDay(cell.date, today);
            const isOpen = info?.isOpen ?? false;
            const isOverride = info?.isOverride ?? false;
            const statusColor = isOverride ? "#8b7bd8" : isOpen ? "#1f9d6b" : "#d9534f";
            const statusLabel = isOverride ? "Exceção" : isOpen ? "Aberto" : "Fechado";
            return (
              <button
                key={i}
                type="button"
                className={styles.calendarCell}
                title={statusLabel}
                style={{
                  background: isOverride
                    ? "rgba(139,123,216,0.1)"
                    : isOpen
                      ? "rgba(31,157,107,0.08)"
                      : "rgba(217,83,79,0.08)",
                  border: isToday ? "2px solid var(--accent)" : "1px solid var(--panel-border)",
                }}
                onClick={() => setSelectedDate(dateKey(cell.date!))}
              >
                <span className={styles.calendarCellDate}>{cell.date.getDate()}</span>
                <span className={styles.calendarCellStatusDot} style={{ background: statusColor }} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#1f9d6b" }} />
          Aberto
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#d9534f" }} />
          Fechado
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#8b7bd8" }} />
          Exceção
        </span>
      </div>

      <DayOverrideModal
        day={selectedDay}
        onClose={() => setSelectedDate(null)}
        onSaved={() => {
          setSelectedDate(null);
          load();
        }}
      />
    </div>
  );
}
