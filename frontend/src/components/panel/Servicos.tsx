"use client";

import { useEffect, useState } from "react";
import { fetchServices, type Service } from "@/lib/api";
import { formatDuration, formatPrice } from "@/lib/format";
import { useAuth } from "./AuthContext";
import NewServiceModal from "./NewServiceModal";
import common from "./panelCommon.module.css";
import styles from "./Servicos.module.css";

export default function Servicos() {
  const { salon } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function loadServices() {
    if (!salon) return Promise.resolve();
    return fetchServices(salon.slug)
      .then(setServices)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon]);

  return (
    <div>
      <div className={common.pageHeader}>
        <div>
          <h2 className={common.pageTitle}>Serviços</h2>
          <p className={common.pageSubtitle}>Gerencie o catálogo de serviços.</p>
        </div>
        <button type="button" className={common.primaryBtn} onClick={() => setModalOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Novo Serviço
        </button>
      </div>

      <NewServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          loadServices();
        }}
      />

      {loading && <p className={styles.status}>Carregando serviços...</p>}
      {error && <p className={styles.statusError}>{error}</p>}

      <section className={styles.grid}>
        {services.map((s) => (
          <div key={s.id} className={styles.card}>
            <div className={styles.cardHead}>
              <h4>{s.name}</h4>
              <span className="material-symbols-outlined" style={{ color: "#a89ba0", cursor: "pointer", fontSize: 18 }}>
                delete
              </span>
            </div>
            <p className={styles.cardMeta}>
              {formatPrice(s.priceCents)} · {formatDuration(s.durationMin)} de duração
            </p>
            <a href="#" className={styles.cardLink}>
              Editar serviço <span aria-hidden="true">→</span>
            </a>
          </div>
        ))}
      </section>
    </div>
  );
}
