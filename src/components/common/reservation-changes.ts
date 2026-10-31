import type { Reservation, ReservationStatus, UserRole } from "@/src/types/api";

/** 예약 ID별 마지막으로 본 상태 */
export type ReservationSnapshot = Record<string, ReservationStatus>;

export type ReservationChange = { kind: "issue" | "status"; message: string };

export function snapshotReservations(items: Reservation[]): ReservationSnapshot {
  return Object.fromEntries(items.map((item) => [item.id, item.status]));
}

const describe = (item: Reservation) => `${item.productName} ${item.quantity}${item.unit}`;

function consumerChange(item: Reservation): ReservationChange | null {
  if (item.status === "cancelled" && item.cancelledBy === "seller") return { kind: "issue", message: `판매자가 ${describe(item)} 예약을 취소했어요.` };
  if (item.status === "no_show") return { kind: "issue", message: `${describe(item)} 예약이 미방문으로 처리됐어요.` };
  if (item.status === "completed") return { kind: "status", message: `${describe(item)} 판매가 완료됐어요.` };
  return null;
}

function sellerChange(item: Reservation): ReservationChange | null {
  if (item.status === "cancelled" && item.cancelledBy === "consumer") return { kind: "status", message: `고객이 ${describe(item)} 예약을 취소했어요.` };
  return null;
}

/** 상대방이 만든 변화만 고른다. 내가 한 일은 처리한 화면에서 이미 알린다. */
export function reservationChanges(previous: ReservationSnapshot, items: Reservation[], role: UserRole): ReservationChange[] {
  const changes: ReservationChange[] = [];
  for (const item of items) {
    const before = previous[item.id];
    if (before === item.status) continue;
    // 다음 확인 전에 끝난 예약은 처음 보는 순간 이미 취소 상태일 수 있다.
    if (before === undefined && role === "seller" && item.status === "approved") {
      changes.push({ kind: "status", message: `새 예약이 들어왔어요. ${describe(item)}` });
      continue;
    }
    const change = role === "seller" ? sellerChange(item) : consumerChange(item);
    if (change) changes.push(change);
  }
  return changes;
}
