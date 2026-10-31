import { describe, expect, it } from "vitest";

import { sellerActions } from "./seller-reservation-view";

describe("sellerActions", () => {
  it("offers no-show only after the pickup time", () => {
    expect(sellerActions("approved", false)).toEqual(["complete", "cancel"]);
    expect(sellerActions("approved", true)).toEqual(["complete", "no-show", "cancel"]);
  });

  it.each(["rejected", "cancelled", "completed", "expired", "no_show"] as const)("offers nothing for %s", (status) => {
    expect(sellerActions(status, true)).toEqual([]);
  });
});
