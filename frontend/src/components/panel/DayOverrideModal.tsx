"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  deleteAvailabilityOverride,
  saveAvailabilityOverride,
  type MonthDayAvailability,
} from "@/lib/api";
import styles from "./DayOverrideModal.module.css";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

type Props = {
  day: MonthDayAvailability | null;
  onClose: () => void;
  onSaved: () => void;
};

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default function DayOverrideModal({ day, onClose, onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [intervalMin, setIntervalMin] = useState(60);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!day) return;
    setIsOpen(day.isOpen);
    setStartTime(day.startTime ?? "09:00");
    setEndTime(day.endTime ?? "18:00");
    setIntervalMin(day.intervalMin ?? 60);
    setError(null);
  }, [day]);

  if (!day) return null;

  async function handleSave() {
    if (!day) return;
    setSaving(true);
    setError(null);
    try {
      await saveAvailabilityOverride({
        date: day.date,
        isOpen,
        startTime: isOpen ? startTime : undefined,
        endTime: isOpen ? endTime : undefined,
        intervalMin: isOpen ? intervalMin : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar exceção.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveOverride() {
    if (!day) return;
    setRemoving(true);
    setError(null);
    try {
      await deleteAvailabilityOverride(day.date);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover exceção.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Modal open={!!day} onClose={onClose} title={formatDateLabel(day.date)}>
      {day.isOverride && (
        <p className={styles.overrideNote}>Este dia tem uma exceção definida, sobrepondo a regra semanal.</p>
      )}

      <label className={styles.toggleWrap}>
        <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
        <span>Aberto neste dia</span>
      </label>

      <div className={styles.fields} style={{ opacity: isOpen ? 1 : 0.4 }}>
        <div className={styles.field}>
          <label>Início</label>
          <input
            type="time"
            value={startTime}
            disabled={!isOpen}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Fim</label>
          <input type="time" value={endTime} disabled={!isOpen} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Duração do horário</label>
          <select
            value={intervalMin}
            disabled={!isOpen}
            onChange={(e) => setIntervalMin(Number(e.target.value))}
          >
            {DURATION_OPTIONS.map((min) => (
              <option key={min} value={min}>
                {min} min
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        {day.isOverride && (
          <button type="button" className={styles.removeBtn} onClick={handleRemoveOverride} disabled={removing || saving}>
            {removing ? "Removendo..." : "Voltar ao padrão da semana"}
          </button>
        )}
        <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving || removing}>
          {saving ? "Salvando..." : "Salvar exceção"}
        </button>
      </div>
    </Modal>
  );
}
