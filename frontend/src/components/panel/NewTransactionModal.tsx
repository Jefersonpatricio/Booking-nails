"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import { createTransaction, type TransactionType } from "@/lib/api";
import { toDateKey } from "@/lib/date";
import styles from "./NewAppointmentModal.module.css";
import txStyles from "./NewTransactionModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type FieldErrors = Partial<Record<"description" | "amount" | "date", string>>;

function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export default function NewTransactionModal({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType("EXPENSE");
    setDescription("");
    setAmount("");
    setDate(toDateKey(new Date()));
    setErrors({});
    setSubmitError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const amountCents = parseAmount(amount);
    const nextErrors: FieldErrors = {};
    if (!description.trim()) nextErrors.description = "Informe uma descrição.";
    if (!amountCents) nextErrors.amount = "Informe um valor válido.";
    if (!date) nextErrors.date = "Escolha a data.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !amountCents) return;

    setSubmitting(true);
    try {
      await createTransaction({
        type,
        description: description.trim(),
        amountCents,
        date: new Date(`${date}T00:00:00`).toISOString(),
      });
      onCreated();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao criar lançamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Lançamento">
      <form onSubmit={handleSubmit} noValidate>
        <div className={txStyles.typeToggle}>
          <button
            type="button"
            className={type === "EXPENSE" ? txStyles.typeBtnExpenseActive : txStyles.typeBtn}
            onClick={() => setType("EXPENSE")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>trending_down</span>
            Despesa
          </button>
          <button
            type="button"
            className={type === "INCOME" ? txStyles.typeBtnIncomeActive : txStyles.typeBtn}
            onClick={() => setType("INCOME")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>trending_up</span>
            Receita
          </button>
        </div>

        <div className={styles.field}>
          <label htmlFor="new-tx-description">Descrição</label>
          <input
            id="new-tx-description"
            placeholder="Ex: Aluguel, produtos, esmaltes..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
          />
          <span className={styles.error}>{errors.description}</span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="new-tx-amount">Valor (R$)</label>
            <input
              id="new-tx-amount"
              placeholder="0,00"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
            />
            <span className={styles.error}>{errors.amount}</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="new-tx-date">Data</label>
            <DatePicker
              id="new-tx-date"
              value={date}
              onChange={(v) => {
                setDate(v);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
            />
            <span className={styles.error}>{errors.date}</span>
          </div>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Salvando..." : "Criar Lançamento"}
        </button>
      </form>
    </Modal>
  );
}
