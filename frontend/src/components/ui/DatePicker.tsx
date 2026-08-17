"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { formatDateShort, fromDateKey, toDateKey } from "@/lib/date";
import styles from "./DatePicker.module.css";

type Props = {
  id?: string;
  value: string;
  onChange: (dateKey: string) => void;
  placeholder?: string;
};

export default function DatePicker({ id, value, onChange, placeholder = "Selecione a data" }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = value ? fromDateKey(value) : undefined;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const panelRect = panelRef.current?.getBoundingClientRect();
      const panelHeight = panelRect?.height ?? 360;
      const panelWidth = panelRect?.width ?? 280;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < panelHeight + 12 && spaceAbove > spaceBelow;

      let top = openUpward ? rect.top - panelHeight - 5 : rect.bottom + 6;
      top = Math.min(Math.max(8, top), window.innerHeight - panelHeight - 8);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelWidth - 8);

      setPosition({ top, left });
    }
    updatePosition();

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={selected ? styles.triggerValue : styles.triggerPlaceholder}>
          {selected ? formatDateShort(selected) : placeholder}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          calendar_month
        </span>
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panelRef}
            className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
            style={position ? { top: position.top, left: position.left } : undefined}
            role="dialog"
          >
            <Calendar
              mode="single"
              locale={ptBR}
              className="p-2"
              selected={selected}
              onSelect={(d) => {
                if (!d) return;
                onChange(toDateKey(d));
                setOpen(false);
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
