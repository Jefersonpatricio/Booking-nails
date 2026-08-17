"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/lib/useIsMobile";
import { usePanelData } from "./PanelDataContext";
import { useAuth } from "./AuthContext";
import styles from "./PanelShell.module.css";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const NAV_ITEMS = [
  { href: "/painel", icon: "dashboard", label: "Dashboard" },
  { href: "/painel/financeiro", icon: "payments", label: "Financeiro" },
  { href: "/painel/servicos", icon: "brush", label: "Serviços" },
  { href: "/painel/horarios", icon: "event_available", label: "Horários" },
];

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { openNewAppointmentModal } = usePanelData();
  const { user, salon, logout } = useAuth();

  const sidebarWidth = sidebarOpen ? 256 : 72;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        {!isMobile && (
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Alternar menu"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        {salon?.logoUrl ? (
          <Image src={salon.logoUrl} alt={salon.name} width={160} height={74} className={styles.logo} />
        ) : (
          <span className={styles.logoText}>{salon?.name}</span>
        )}
        <div className={styles.spacer} />
        <div className={styles.headerActions}>
          <span className="material-symbols-outlined">chat_bubble_outline</span>
          <span className="material-symbols-outlined">notifications_none</span>
          <Link href="/painel/perfil" className={styles.avatar} aria-label="Perfil">
            {user ? initials(user.name) : ""}
          </Link>
        </div>
      </header>

      <div className={styles.body} style={{ paddingTop: 64 }}>
        {!isMobile && (
          <nav className={styles.sidebar} style={{ width: sidebarWidth }}>
            <div className={styles.newBtnWrap}>
              {sidebarOpen ? (
                <button type="button" className={styles.newBtn} onClick={() => openNewAppointmentModal()}>
                  <span className="material-symbols-outlined">add</span>
                  Novo Agendamento
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.newBtnCollapsed}
                  aria-label="Novo Agendamento"
                  onClick={() => openNewAppointmentModal()}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}
            </div>
            <ul className={styles.navList}>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={active ? styles.navLinkActive : styles.navLink}
                      style={{ justifyContent: sidebarOpen ? "flex-start" : "center" }}
                    >
                      <span className="material-symbols-outlined">{item.icon}</span>
                      {sidebarOpen && item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ul className={styles.navList}>
              <li>
                <button
                  type="button"
                  onClick={() => logout()}
                  className={styles.navLinkMuted}
                  style={{
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                    border: "none",
                    background: "none",
                    width: "100%",
                    font: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span className="material-symbols-outlined">logout</span>
                  {sidebarOpen && "Sair"}
                </button>
              </li>
            </ul>
          </nav>
        )}

        <div
          className={styles.content}
          style={{
            marginLeft: isMobile ? 0 : sidebarWidth,
            width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
            paddingBottom: isMobile ? 72 : 0,
          }}
        >
          <main className={styles.main}>{children}</main>
        </div>
      </div>

      {isMobile && (
        <nav className={styles.mobileNav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileNavItem}
                style={{ color: active ? "var(--accent)" : "#a89ba0" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  {item.icon}
                </span>
                <span className={styles.mobileNavLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <button
        type="button"
        className={styles.fab}
        style={{ bottom: isMobile ? 84 : 32, right: isMobile ? 20 : 32 }}
        aria-label="Conversar"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
          chat
        </span>
      </button>
    </div>
  );
}
