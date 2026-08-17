"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  createAppointment,
  fetchServices,
  fetchSlotsForDate,
  getSalonBySlug,
  type DaySlot,
  type Salon,
  type Service,
} from "@/lib/api";
import { formatDuration, formatPrice } from "@/lib/format";
import styles from "./BookingForm.module.css";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Day = {
  id: string;
  label: string;
  date: string;
  fullDate: Date;
};

function buildUpcomingDays(count: number): Day[] {
  const days: Day[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      id: d.toISOString().slice(0, 10),
      label: WEEKDAY_LABELS[d.getDay()],
      date: String(d.getDate()).padStart(2, "0"),
      fullDate: d,
    });
  }
  return days;
}

type FieldErrors = Partial<Record<"clientName" | "clientPhone" | "service" | "slot", string>>;

type Props = {
  salonSlug: string;
};

export default function BookingForm({ salonSlug }: Props) {
  const days = useMemo(() => buildUpcomingDays(5), []);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState(days[0].id);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsByDay, setSlotsByDay] = useState<Record<string, DaySlot[]>>({});
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  useEffect(() => {
    getSalonBySlug(salonSlug)
      .then(setSalon)
      .catch(() => setSalon(null));
  }, [salonSlug]);

  useEffect(() => {
    fetchServices(salonSlug)
      .then((data) => {
        setServices(data);
        if (data.length > 0) setSelectedServiceId(data[0].id);
      })
      .catch((err: Error) => setServicesError(err.message));
  }, [salonSlug]);

  useEffect(() => {
    setSlotsLoading(true);
    Promise.all(days.map((d) => fetchSlotsForDate(d.id, salonSlug).then((s) => [d.id, s] as const)))
      .then((entries) => {
        const map: Record<string, DaySlot[]> = {};
        for (const [id, s] of entries) map[id] = s;
        setSlotsByDay(map);

        const hasAvailable = (id: string) => (map[id] ?? []).some((s) => s.available);
        if (!hasAvailable(selectedDayId)) {
          const firstAvailable = days.find((d) => hasAvailable(d.id));
          if (firstAvailable) setSelectedDayId(firstAvailable.id);
        }
      })
      .catch((err: Error) => setSlotsError(err.message))
      .finally(() => setSlotsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDayId]);

  const slots = slotsByDay[selectedDayId] ?? [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setConfirmationMessage(null);

    const nextErrors: FieldErrors = {};
    if (!clientName.trim()) nextErrors.clientName = "Informe seu nome.";
    if (!clientPhone.trim()) nextErrors.clientPhone = "Informe seu WhatsApp.";
    if (!selectedServiceId) nextErrors.service = "Escolha um serviço.";
    if (!selectedSlot) nextErrors.slot = "Escolha um horário.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const service = services.find((s) => s.id === selectedServiceId);
    const day = days.find((d) => d.id === selectedDayId);
    if (!service || !day || !selectedSlot) return;

    setSubmitting(true);
    try {
      await createAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId: service.id,
        date: day.fullDate.toISOString(),
        time: selectedSlot,
        salonSlug,
      });

      const dateLabel = day.fullDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (salon?.whatsappNumber) {
        const message =
          `Olá! Gostaria de agendar um horário na ${salon.name}.\n` +
          `Nome: ${clientName.trim()}\n` +
          `WhatsApp: ${clientPhone.trim()}\n` +
          `Serviço: ${service.name} (${formatPrice(service.priceCents)})\n` +
          `Data: ${dateLabel}\n` +
          `Horário: ${selectedSlot}`;
        const url = `https://wa.me/${salon.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener");
      } else {
        setConfirmationMessage(
          "Agendamento confirmado! Esse salão ainda não cadastrou um WhatsApp para contato.",
        );
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao confirmar agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          {salon?.logoUrl ? (
            <Image
              src={salon.logoUrl}
              alt={salon.name}
              width={204}
              height={94}
              className={styles.logo}
              priority
            />
          ) : (
            salon && <h1 className={styles.logoText}>{salon.name}</h1>
          )}
        </header>

        <section className={styles.greeting}>
          <h2>
            Olá!{" "}
            <span className={styles.greetingSub}>
              Agende seu horário em poucos segundos.
            </span>
          </h2>
        </section>

        <form onSubmit={handleSubmit} noValidate>
          <section className={styles.blockPadded}>
            <h3 className={styles.blockTitle}>1. Seus Dados</h3>
            <div className={styles.card}>
              <div className={styles.field}>
                <label htmlFor="client-name">Seu Nome</label>
                <input
                  id="client-name"
                  placeholder="Ex: Maria Silva"
                  autoComplete="name"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setErrors((prev) => ({ ...prev, clientName: undefined }));
                  }}
                />
                <span className={styles.fieldError}>{errors.clientName}</span>
              </div>
              <div className={styles.field}>
                <label htmlFor="client-phone">Seu WhatsApp</label>
                <input
                  id="client-phone"
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    setErrors((prev) => ({ ...prev, clientPhone: undefined }));
                  }}
                />
                <span className={styles.fieldError}>{errors.clientPhone}</span>
              </div>
            </div>
          </section>

          <section className={styles.block}>
            <h3 className={styles.blockTitlePad}>2. Escolha o Serviço</h3>
            <div className={`${styles.hscroll} hide-scroll`} role="radiogroup" aria-label="Escolha o serviço">
              {services.map((svc) => {
                const selected = svc.id === selectedServiceId;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={selected ? styles.serviceCardSelected : styles.serviceCard}
                    onClick={() => {
                      setSelectedServiceId(svc.id);
                      setErrors((prev) => ({ ...prev, service: undefined }));
                    }}
                  >
                    <h4>{svc.name}</h4>
                    <span className={styles.cardFooter}>
                      <span className={styles.priceRow}>
                        <span className={styles.price}>{formatPrice(svc.priceCents)}</span>
                        <span className={styles.duration}>
                          <span className="material-symbols-outlined">schedule</span>
                          {formatDuration(svc.durationMin)}
                        </span>
                      </span>
                      <span className={styles.check}>
                        <span className="material-symbols-outlined">check</span>
                      </span>
                    </span>
                  </button>
                );
              })}
              {servicesError && <p className={styles.formError}>{servicesError}</p>}
            </div>
            {errors.service && <span className={styles.fieldErrorPad}>{errors.service}</span>}
          </section>

          <section className={styles.block}>
            <h3 className={styles.blockTitlePad}>3. Data e Horário</h3>
            <div className={`${styles.hscroll} hide-scroll`} role="radiogroup" aria-label="Escolha o dia">
              {days.map((day) => {
                const selected = day.id === selectedDayId;
                const dayHasAvailability = (slotsByDay[day.id] ?? []).some((s) => s.available);
                const disabled = !slotsLoading && !dayHasAvailability;
                const className = disabled
                  ? styles.dayDisabled
                  : selected
                    ? styles.daySelected
                    : styles.dayBtn;
                return (
                  <button
                    key={day.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    className={className}
                    onClick={() => setSelectedDayId(day.id)}
                  >
                    <span className={styles.dayLabel}>{day.label}</span>
                    <span className={styles.dayDate}>{day.date}</span>
                  </button>
                );
              })}
            </div>
            <div className={styles.slotGrid} role="radiogroup" aria-label="Escolha o horário">
              {slots.map((s) => {
                const disabled = !s.available;
                const selected = s.time === selectedSlot;
                const className = disabled
                  ? styles.slotDisabled
                  : selected
                    ? styles.slotSelected
                    : styles.slotBtn;
                return (
                  <button
                    key={s.time}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    className={className}
                    onClick={() => {
                      setSelectedSlot(s.time);
                      setErrors((prev) => ({ ...prev, slot: undefined }));
                    }}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
            {slotsError && <p className={styles.fieldErrorPad}>{slotsError}</p>}
            {errors.slot && <span className={styles.fieldErrorPad}>{errors.slot}</span>}
          </section>

          {confirmationMessage && <p className={styles.formSuccess}>{confirmationMessage}</p>}
          {submitError && <p className={styles.formError}>{submitError}</p>}

          <div className={styles.submitWrap}>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Confirmando..." : "Confirmar via WhatsApp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
