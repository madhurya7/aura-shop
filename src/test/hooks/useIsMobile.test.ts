import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useIsMobile", () => {
  it("returns false for desktop width", async () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });

    // Re-import to get fresh module
    const { useIsMobile } = await import("@/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true for mobile width", async () => {
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });

    const { useIsMobile } = await import("@/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false when width equals breakpoint", async () => {
    Object.defineProperty(window, "innerWidth", { value: 768, writable: true });

    const { useIsMobile } = await import("@/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
