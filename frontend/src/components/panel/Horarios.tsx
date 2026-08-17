"use client";

import { useState } from "react";
import common from "./panelCommon.module.css";
import styles from "./Horarios.module.css";
import WeekAvailability from "./WeekAvailability";
import MonthAvailability from "./MonthAvailability";

type Tab = "semana" | "mes";

export default function Horarios() {
  const [tab, setTab] = useState<Tab>("semana");

  return (
    <div>
      <div className={common.pageHeader}>
        <div>
          <h2 className={common.pageTitle}>Horários</h2>
          <p className={common.pageSubtitle}>
            {tab === "semana"
              ? "Defina o intervalo de atendimento e a duração de cada horário por dia da semana."
              : "Feche ou ajuste um dia específico (feriado, folga) sem mudar a regra semanal."}
          </p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === "semana" ? styles.tabActive : styles.tab}
          onClick={() => setTab("semana")}
        >
          Semana
        </button>
        <button
          type="button"
          className={tab === "mes" ? styles.tabActive : styles.tab}
          onClick={() => setTab("mes")}
        >
          Mês
        </button>
      </div>

      {tab === "semana" ? <WeekAvailability /> : <MonthAvailability />}
    </div>
  );
}
