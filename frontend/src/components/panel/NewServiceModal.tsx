"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { createService } from "@/lib/api";
import styles from "./NewAppointmentModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type FieldErrors = Partial<Record<"name" | "price" | "duration", string>>;

function parsePrice(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function parseDuration(raw: string): number | null {
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export default function NewServiceModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setPrice("");
    setDuration("");
    setErrors({});
    setSubmitError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const priceCents = parsePrice(price);
    const durationMin = parseDuration(duration);
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Informe o nome do serviço.";
    if (!priceCents) nextErrors.price = "Informe um valor válido.";
    if (!durationMin) nextErrors.duration = "Informe uma duração válida.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !priceCents || !durationMin) return;

    setSubmitting(true);
    try {
      await createService({ name: name.trim(), priceCents, durationMin });
      onCreated();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao criar serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Serviço">
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="new-service-name">Nome</label>
          <input
            id="new-service-name"
            placeholder="Ex: Manicure, Alongamento em gel..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
          <span className={styles.error}>{errors.name}</span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="new-service-price">Preço (R$)</label>
            <input
              id="new-service-price"
              placeholder="0,00"
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setErrors((prev) => ({ ...prev, price: undefined }));
              }}
            />
            <span className={styles.error}>{errors.price}</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="new-service-duration">Duração (min)</label>
            <input
              id="new-service-duration"
              placeholder="60"
              inputMode="numeric"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setErrors((prev) => ({ ...prev, duration: undefined }));
              }}
            />
            <span className={styles.error}>{errors.duration}</span>
          </div>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Salvando..." : "Criar Serviço"}
        </button>
      </form>
    </Modal>
  );
}
