"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { addMinutesToTime, formatDateLong } from "@/lib/date";
import { formatDuration, formatPrice } from "@/lib/format";
import styles from "./AppointmentDetailsDrawer.module.css";

type AppointmentLike = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string | Date;
  time: string;
  service: { name: string; priceCents: number; durationMin: number };
};

type Props = {
  appointment: AppointmentLike | null;
  onClose: () => void;
  onDelete: (id: string, clientName: string) => void;
};

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function AppointmentDetailsDrawer({ appointment, onClose, onDelete }: Props) {
  return (
    <Drawer
      open={!!appointment}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      swipeDirection="right"
    >
      <DrawerContent className={styles.content}>
        {appointment && (
          <>
            <DrawerHeader className={styles.header}>
              <DrawerTitle className={styles.title}>{appointment.clientName}</DrawerTitle>
              <DrawerDescription className={styles.subtitle}>
                {formatDateLong(new Date(appointment.date))}
              </DrawerDescription>
            </DrawerHeader>

            <div className={styles.body}>
              <div className={styles.infoRow}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>schedule</span>
                <span>
                  {appointment.time} – {addMinutesToTime(appointment.time, appointment.service.durationMin)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>brush</span>
                <span>{appointment.service.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
                <span>
                  {formatPrice(appointment.service.priceCents)} · {formatDuration(appointment.service.durationMin)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                <span>{appointment.clientPhone}</span>
              </div>

              <a
                href={`https://wa.me/${digitsOnly(appointment.clientPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
                Chamar no WhatsApp
              </a>

              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => onDelete(appointment.id, appointment.clientName)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                Excluir agendamento
              </button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
