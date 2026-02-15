import { describe, expect, it } from "vitest";
import { toSafeNextPath } from "@/lib/auth/safe-next";

describe("toSafeNextPath", () => {
  it("returns internal path when value is valid", () => {
    expect(toSafeNextPath("/tasks?tab=done")).toBe("/tasks?tab=done");
  });

  it("falls back for external or invalid values", () => {
    expect(toSafeNextPath("https://example.com")).toBe("/tasks");
    expect(toSafeNextPath("//evil.com")).toBe("/tasks");
    expect(toSafeNextPath("javascript:alert(1)")).toBe("/tasks");
    expect(toSafeNextPath("/\\evil")).toBe("/tasks");
    expect(toSafeNextPath("")).toBe("/tasks");
  });
});
