export function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDuration(durationMin: number): string {
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h00`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}
