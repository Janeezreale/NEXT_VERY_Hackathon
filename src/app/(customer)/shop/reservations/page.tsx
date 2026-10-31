import ReservationsPreview from "../../../../components/customer/reservations-preview";
import { previewReservations } from "../../../../components/customer/preview-data";
import { firstValue, loadState, type SearchValues } from "../../../../components/customer/preview-state";

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const scenario = firstValue((await searchParams)._preview);
  const reservations = scenario === "empty" ? [] : scenario === "active-only" ? previewReservations.filter(row => row.status === "승인 대기" || row.status === "예약 승인") : previewReservations;
  return <ReservationsPreview reservations={reservations} state={loadState(scenario)} />;
}
