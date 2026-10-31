import { describe, expect, it } from "vitest";

import type { Reservation } from "@/src/types/api";

import { reservationChanges, snapshotReservations } from "./reservation-changes";

const reservation = (change: Partial<Reservation> = {}) =>
  ({ id: "r1", productName: "사과", quantity: 2, unit: "개", status: "approved", cancelledBy: null, ...change }) as Reservation;

const approved = { r1: "approved" } as const;

describe("reservationChanges for a consumer", () => {
  it("raises a seller cancellation as an issue", () => {
    expect(reservationChanges(approved, [reservation({ status: "cancelled", cancelledBy: "seller" })], "consumer")).toEqual([
      { kind: "issue", message: "판매자가 사과 2개 예약을 취소했어요." },
    ]);
  });

  it("raises a cancellation that happened before the first check", () => {
    expect(reservationChanges({}, [reservation({ status: "cancelled", cancelledBy: "seller" })], "consumer")[0].kind).toBe("issue");
  });

  it("raises a no-show as an issue", () => {
    expect(reservationChanges(approved, [reservation({ status: "no_show" })], "consumer")[0].kind).toBe("issue");
  });

  it("reports a completed sale as a status change", () => {
    expect(reservationChanges(approved, [reservation({ status: "completed" })], "consumer")).toEqual([
      { kind: "status", message: "사과 2개 판매가 완료됐어요." },
    ]);
  });

  it("stays quiet about the consumer's own actions", () => {
    expect(reservationChanges(approved, [reservation({ status: "cancelled", cancelledBy: "consumer" })], "consumer")).toEqual([]);
    expect(reservationChanges({}, [reservation()], "consumer")).toEqual([]);
  });
});

describe("reservationChanges for a seller", () => {
  it("reports a new reservation", () => {
    expect(reservationChanges({}, [reservation()], "seller")).toEqual([{ kind: "status", message: "새 예약이 들어왔어요. 사과 2개" }]);
  });

  it("reports a consumer cancellation", () => {
    expect(reservationChanges(approved, [reservation({ status: "cancelled", cancelledBy: "consumer" })], "seller")).toEqual([
      { kind: "status", message: "고객이 사과 2개 예약을 취소했어요." },
    ]);
  });

  it("reports a cancellation that happened before the first check", () => {
    expect(reservationChanges({}, [reservation({ status: "cancelled", cancelledBy: "consumer" })], "seller")[0].message).toContain("고객이");
  });

  it("stays quiet about the seller's own actions", () => {
    expect(reservationChanges(approved, [reservation({ status: "cancelled", cancelledBy: "seller" })], "seller")).toEqual([]);
    expect(reservationChanges(approved, [reservation({ status: "completed" })], "seller")).toEqual([]);
    expect(reservationChanges(approved, [reservation({ status: "no_show" })], "seller")).toEqual([]);
  });

  it("does not repeat an old finished reservation it has not seen", () => {
    expect(reservationChanges({}, [reservation({ status: "completed" })], "seller")).toEqual([]);
  });
});

describe("reservationChanges", () => {
  it("reports nothing when nothing changed", () => {
    expect(reservationChanges(snapshotReservations([reservation()]), [reservation()], "consumer")).toEqual([]);
    expect(reservationChanges(snapshotReservations([reservation()]), [reservation()], "seller")).toEqual([]);
  });
});
