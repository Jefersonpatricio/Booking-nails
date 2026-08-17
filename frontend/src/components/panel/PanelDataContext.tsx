"use client";

import { createContext, useCallback, useContext, useState } from "react";
import NewAppointmentModal from "./NewAppointmentModal";

type NewAppointmentPreset = { date?: Date; time?: string };

type PanelDataContextValue = {
  appointmentsRefreshToken: number;
  openNewAppointmentModal: (preset?: NewAppointmentPreset) => void;
};

const PanelDataContext = createContext<PanelDataContextValue | null>(null);

export function usePanelData(): PanelDataContextValue {
  const ctx = useContext(PanelDataContext);
  if (!ctx) throw new Error("usePanelData must be used within PanelDataProvider");
  return ctx;
}

export default function PanelDataProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [preset, setPreset] = useState<NewAppointmentPreset>({});
  const [appointmentsRefreshToken, setAppointmentsRefreshToken] = useState(0);

  const openNewAppointmentModal = useCallback((p?: NewAppointmentPreset) => {
    setPreset(p ?? {});
    setModalOpen(true);
  }, []);

  return (
    <PanelDataContext.Provider value={{ appointmentsRefreshToken, openNewAppointmentModal }}>
      {children}
      <NewAppointmentModal
        open={modalOpen}
        initialDate={preset.date}
        initialTime={preset.time}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          setAppointmentsRefreshToken((v) => v + 1);
        }}
      />
    </PanelDataContext.Provider>
  );
}
