"use client";

import { useEffect, useState } from "react";
import { fetchWeekAvailability, saveWeekAvailability, type WorkingHoursDay } from "@/lib/api";
import { WEEKDAY_SHORT } from "@/lib/date";
import common from "./panelCommon.module.css";
import styles from "./Horarios.module.css";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function WeekAvailability() {
  const [days, setDays] = useState<WorkingHoursDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchWeekAvailability()
      .then(setDays)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateDay(weekday: number, patch: Partial<WorkingHoursDay>) {
    setSaved(false);
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await saveWeekAvailability(days);
      setDays(result);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className={styles.tabActions}>
        <button type="button" className={common.primaryBtn} onClick={handleSave} disabled={saving || loading}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {saved && <p className={styles.success}>Horários salvos.</p>}

      {loading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : (
        <div className={`${common.panel} ${styles.list}`}>
          {days.map((day) => (
            <div key={day.weekday} className={styles.row}>
              <label className={styles.toggleWrap}>
                <input
                  type="checkbox"
                  checked={day.isOpen}
                  onChange={(e) => updateDay(day.weekday, { isOpen: e.target.checked })}
                />
                <span className={styles.weekdayLabel}>{WEEKDAY_SHORT[day.weekday]}</span>
              </label>

              <div className={styles.fields} style={{ opacity: day.isOpen ? 1 : 0.4 }}>
                <div className={styles.field}>
                  <label>Início</label>
                  <input
                    type="time"
                    value={day.startTime}
                    disabled={!day.isOpen}
                    onChange={(e) => updateDay(day.weekday, { startTime: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Fim</label>
                  <input
                    type="time"
                    value={day.endTime}
                    disabled={!day.isOpen}
                    onChange={(e) => updateDay(day.weekday, { endTime: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Duração do horário</label>
                  <select
                    value={day.intervalMin}
                    disabled={!day.isOpen}
                    onChange={(e) => updateDay(day.weekday, { intervalMin: Number(e.target.value) })}
                  >
                    {DURATION_OPTIONS.map((min) => (
                      <option key={min} value={min}>
                        {min} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
