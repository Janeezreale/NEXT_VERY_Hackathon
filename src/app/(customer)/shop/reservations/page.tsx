import ReservationsPreview from "../../../../components/customer/reservations-preview";
import { PreviewUnavailable } from "../../../../components/customer/preview-ui";

export default function ReservationsPage() {
  if (process.env.NODE_ENV !== "development") return <PreviewUnavailable />;
  return <ReservationsPreview />;
}
