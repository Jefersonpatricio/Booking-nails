import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";
import { getSalonBySlug } from "@/lib/api";

type Params = { salaoSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { salaoSlug } = await params;
  const salon = await getSalonBySlug(salaoSlug).catch(() => null);
  if (!salon) return {};
  return {
    title: `${salon.name} — Agendamento`,
    description: `Agende seu horário na ${salon.name} em poucos segundos.`,
  };
}

export default async function AgendarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { salaoSlug } = await params;
  return <BookingForm salonSlug={salaoSlug} />;
}
