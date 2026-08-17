"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import { createAppointment, fetchServices, type Service } from "@/lib/api";
import { formatDuration, formatPrice } from "@/lib/format";
import { useAuth } from "./AuthContext";
import styles from "./NewAppointmentModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialDate?: Date;
  initialTime?: string;
};

type FieldErrors = Partial<Record<"clientName" | "clientPhone" | "serviceId" | "date" | "time", string>>;

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function NewAppointmentModal({ open, onClose, onCreated, initialDate, initialTime }: Props) {
  const { salon } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setClientName("");
    setClientPhone("");
    setServiceId("");
    setDate(toDateInputValue(initialDate ?? new Date()));
    setTime(initialTime ?? "");
    setErrors({});
    setSubmitError(null);

    if (!salon) return;

    fetchServices(salon.slug)
      .then((data) => {
        setServices(data);
        if (data.length > 0) setServiceId(data[0].id);
      })
      .catch((err: Error) => setServicesError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, salon]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: FieldErrors = {};
    if (!clientName.trim()) nextErrors.clientName = "Informe o nome da cliente.";
    if (!clientPhone.trim()) nextErrors.clientPhone = "Informe o WhatsApp.";
    if (!serviceId) nextErrors.serviceId = "Escolha um serviço.";
    if (!date) nextErrors.date = "Escolha a data.";
    if (!time) nextErrors.time = "Escolha o horário.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!salon) return;

    setSubmitting(true);
    try {
      await createAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId,
        date: new Date(`${date}T00:00:00`).toISOString(),
        time,
        salonSlug: salon.slug,
      });
      onCreated();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao criar agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Agendamento">
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="new-appt-name">Nome da Cliente</label>
          <input
            id="new-appt-name"
            placeholder="Ex: Maria Silva"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setErrors((prev) => ({ ...prev, clientName: undefined }));
            }}
          />
          <span className={styles.error}>{errors.clientName}</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="new-appt-phone">WhatsApp</label>
          <input
            id="new-appt-phone"
            placeholder="(00) 00000-0000"
            inputMode="tel"
            value={clientPhone}
            onChange={(e) => {
              setClientPhone(e.target.value);
              setErrors((prev) => ({ ...prev, clientPhone: undefined }));
            }}
          />
          <span className={styles.error}>{errors.clientPhone}</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="new-appt-service">Serviço</label>
          <div className={styles.selectWrap}>
            <select
              id="new-appt-service"
              className={styles.select}
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setErrors((prev) => ({ ...prev, serviceId: undefined }));
              }}
            >
              {services.length === 0 && <option value="">Carregando...</option>}
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatPrice(s.priceCents)} · {formatDuration(s.durationMin)}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
          </div>
          <span className={styles.error}>{errors.serviceId || servicesError}</span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="new-appt-date">Data</label>
            <DatePicker
              id="new-appt-date"
              value={date}
              onChange={(v) => {
                setDate(v);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
            />
            <span className={styles.error}>{errors.date}</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="new-appt-time">Horário</label>
            <input
              id="new-appt-time"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setErrors((prev) => ({ ...prev, time: undefined }));
              }}
            />
            <span className={styles.error}>{errors.time}</span>
          </div>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Salvando..." : "Criar Agendamento"}
        </button>
      </form>
    </Modal>
  );
}
