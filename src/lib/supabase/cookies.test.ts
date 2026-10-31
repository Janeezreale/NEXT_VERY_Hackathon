import { describe, expect, it } from "vitest";

import { toSessionCookie } from "./cookies";

describe("toSessionCookie", () => {
  it("drops the lifetime so the cookie ends with the browser", () => {
    expect(toSessionCookie({ path: "/", sameSite: "lax", maxAge: 34560000, expires: new Date(0) })).toEqual({ path: "/", sameSite: "lax" });
  });

  it("keeps maxAge 0 so sign-out still deletes the cookie", () => {
    expect(toSessionCookie({ path: "/", maxAge: 0 })).toEqual({ path: "/", maxAge: 0 });
  });
});
