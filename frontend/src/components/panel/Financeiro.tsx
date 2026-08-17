"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  deleteTransaction,
  fetchAppointments,
  fetchTransactions,
  type Appointment,
  type Transaction,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { endOfMonth } from "@/lib/date";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import common from "./panelCommon.module.css";
import styles from "./Financeiro.module.css";
import NewTransactionModal from "./NewTransactionModal";

const chartConfig = {
  receita: { label: "Receita", color: "#1f9d6b" },
  despesa: { label: "Despesa", color: "#d9534f" },
} satisfies ChartConfig;

const PERIODS = [
  { value: "1m", label: "Último mês", months: 1, chartLabel: "este mês" },
  { value: "3m", label: "Últimos 3 meses", months: 3, chartLabel: "últimos 3 meses" },
  { value: "6m", label: "6 meses", months: 6, chartLabel: "últimos 6 meses" },
  { value: "1y", label: "Ano", months: 12, chartLabel: "últimos 12 meses" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  const s = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Financeiro() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("6m");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; description: string } | null>(null);

  const today = useMemo(() => new Date(), []);
  const periodConfig = PERIODS.find((p) => p.value === period)!;
  const monthsCount = periodConfig.months;
  const rangeStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - (monthsCount - 1), 1),
    [today, monthsCount],
  );
  const startOfToday = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchAppointments(rangeStart, endOfMonth(today)),
      fetchTransactions(rangeStart, endOfMonth(today)),
    ])
      .then(([appts, txs]) => {
        setAppointments(appts);
        setTransactions(txs);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [rangeStart, today]);

  useEffect(() => {
    load();
  }, [load]);

  const months = useMemo(
    () =>
      Array.from(
        { length: monthsCount },
        (_, i) => new Date(today.getFullYear(), today.getMonth() - (monthsCount - 1) + i, 1),
      ),
    [today, monthsCount],
  );

  const chartData = useMemo(
    () =>
      months.map((m) => {
        const key = monthKey(m);
        const receita =
          appointments
            .filter((a) => monthKey(new Date(a.date)) === key && new Date(a.date) < startOfToday)
            .reduce((sum, a) => sum + a.service.priceCents, 0) +
          transactions
            .filter((t) => t.type === "INCOME" && monthKey(new Date(t.date)) === key)
            .reduce((sum, t) => sum + t.amountCents, 0);
        const despesa = transactions
          .filter((t) => t.type === "EXPENSE" && monthKey(new Date(t.date)) === key)
          .reduce((sum, t) => sum + t.amountCents, 0);
        return { month: monthLabel(m), receita: receita / 100, despesa: despesa / 100 };
      }),
    [months, appointments, transactions, startOfToday],
  );

  const currentMonthKey = monthKey(today);
  const faturamentoMes =
    appointments
      .filter((a) => monthKey(new Date(a.date)) === currentMonthKey && new Date(a.date) < startOfToday)
      .reduce((sum, a) => sum + a.service.priceCents, 0) +
    transactions
      .filter((t) => t.type === "INCOME" && monthKey(new Date(t.date)) === currentMonthKey)
      .reduce((sum, t) => sum + t.amountCents, 0);
  const aReceber = appointments
    .filter((a) => monthKey(new Date(a.date)) === currentMonthKey && new Date(a.date) >= startOfToday)
    .reduce((sum, a) => sum + a.service.priceCents, 0);
  const despesasMes = transactions
    .filter((t) => t.type === "EXPENSE" && monthKey(new Date(t.date)) === currentMonthKey)
    .reduce((sum, t) => sum + t.amountCents, 0);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteTransaction(pendingDelete.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir lançamento.");
    } finally {
      setPendingDelete(null);
    }
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div>
      <div className={common.pageHeader}>
        <div>
          <h2 className={common.pageTitle}>Financeiro</h2>
          <p className={common.pageSubtitle}>Acompanhe seus ganhos e despesas.</p>
        </div>
        <button type="button" className={common.primaryBtn} onClick={() => setModalOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Novo Lançamento
        </button>
      </div>

      <div className={styles.periodGroup}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={period === p.value ? styles.periodBtnActive : styles.periodBtn}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <section className={common.kpiGrid}>
        <div className={common.kpiCard}>
          <div className={common.kpiHead}>
            <h3 className={common.kpiLabel}>Faturamento do Mês</h3>
            <span className="material-symbols-outlined" style={{ color: "#1f9d6b" }}>trending_up</span>
          </div>
          <p className={common.kpiValue} style={{ color: "#1f9d6b" }}>
            {loading ? "…" : formatPrice(faturamentoMes)}
          </p>
        </div>
        <div className={common.kpiCard}>
          <div className={common.kpiHead}>
            <h3 className={common.kpiLabel}>A Receber</h3>
            <span className="material-symbols-outlined" style={{ color: "#4c7ea8" }}>schedule</span>
          </div>
          <p className={common.kpiValue} style={{ color: "#4c7ea8" }}>
            {loading ? "…" : formatPrice(aReceber)}
          </p>
        </div>
        <div className={common.kpiCard}>
          <div className={common.kpiHead}>
            <h3 className={common.kpiLabel}>Despesas do Mês</h3>
            <span className="material-symbols-outlined" style={{ color: "#d9534f" }}>trending_down</span>
          </div>
          <p className={common.kpiValue} style={{ color: "#d9534f" }}>
            {loading ? "…" : formatPrice(despesasMes)}
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${common.panel} ${styles.chartPanel}`}>
          <h3 className={styles.panelTitle}>Receita x Despesa — {periodConfig.chartLabel}</h3>
          <ChartContainer config={chartConfig} className={styles.chart}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dashed"
                    formatter={(value, name) => (
                      <>
                        <span
                          className="h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ background: name === "receita" ? "#1f9d6b" : "#d9534f" }}
                        />
                        {name === "receita" ? "Receita" : "Despesa"}
                        <span className="text-foreground ml-auto font-mono font-medium">
                          {formatPrice(Number(value) * 100)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="receita" fill="var(--color-receita)" radius={4} />
              <Bar dataKey="despesa" fill="var(--color-despesa)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className={`${common.panel} ${styles.txPanel}`}>
          <h3 className={styles.panelTitle}>Lançamentos</h3>
          {sortedTransactions.length === 0 && !loading && (
            <p className={styles.empty}>Nenhum lançamento neste período.</p>
          )}
          <div>
            {sortedTransactions.map((tx) => (
              <div key={tx.id} className={styles.txRow}>
                <div className={styles.txInfo}>
                  <p className={styles.txName}>{tx.description}</p>
                  <p className={styles.txDate}>
                    {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className={styles.txRight}>
                  <p
                    className={styles.txValue}
                    style={{ color: tx.type === "INCOME" ? "#1f9d6b" : "#d9534f" }}
                  >
                    {tx.type === "INCOME" ? "+" : "−"} {formatPrice(tx.amountCents)}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => setPendingDelete({ id: tx.id, description: tx.description })}
                  aria-label={`Excluir lançamento ${tx.description}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Excluir lançamento"
        message={`Tem certeza que deseja excluir o lançamento "${pendingDelete?.description}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
