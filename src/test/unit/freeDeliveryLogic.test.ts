import { describe, it, expect } from "vitest";

// Pure logic tests for free delivery threshold behavior

interface ShippingZone {
  standard_rate: number;
  express_rate: number;
  free_delivery_above: number;
  exchange_rate: number;
}

function calculateShippingCost(
  zone: ShippingZone,
  shippingMethod: "standard" | "express",
  cartTotalUsd: number
): { localCost: number; usdCost: number; isFreeStandard: boolean } {
  const isFreeStandard =
    zone.free_delivery_above > 0 && cartTotalUsd >= zone.free_delivery_above;

  let localCost: number;
  if (shippingMethod === "standard" && isFreeStandard) {
    localCost = 0;
  } else {
    localCost = shippingMethod === "express" ? zone.express_rate : zone.standard_rate;
  }

  const usdCost =
    shippingMethod === "standard" && isFreeStandard
      ? 0
      : localCost / (zone.exchange_rate || 1);

  return { localCost, usdCost, isFreeStandard };
}

describe("Free Delivery Logic", () => {
  const usdZone: ShippingZone = {
    standard_rate: 5,
    express_rate: 15,
    free_delivery_above: 200,
    exchange_rate: 1,
  };

  const inrZone: ShippingZone = {
    standard_rate: 200,
    express_rate: 500,
    free_delivery_above: 200,
    exchange_rate: 85,
  };

  describe("Standard shipping", () => {
    it("charges normally when below threshold", () => {
      const result = calculateShippingCost(usdZone, "standard", 100);
      expect(result.localCost).toBe(5);
      expect(result.isFreeStandard).toBe(false);
    });

    it("is free when at threshold exactly", () => {
      const result = calculateShippingCost(usdZone, "standard", 200);
      expect(result.localCost).toBe(0);
      expect(result.usdCost).toBe(0);
      expect(result.isFreeStandard).toBe(true);
    });

    it("is free when above threshold", () => {
      const result = calculateShippingCost(usdZone, "standard", 500);
      expect(result.localCost).toBe(0);
      expect(result.isFreeStandard).toBe(true);
    });
  });

  describe("Express shipping", () => {
    it("always charges regardless of cart total", () => {
      const result = calculateShippingCost(usdZone, "express", 500);
      expect(result.localCost).toBe(15);
      expect(result.isFreeStandard).toBe(true); // standard would be free, but express isn't
    });

    it("charges when below threshold", () => {
      const result = calculateShippingCost(usdZone, "express", 50);
      expect(result.localCost).toBe(15);
    });
  });

  describe("Disabled free delivery (threshold = 0)", () => {
    const noFreeZone = { ...usdZone, free_delivery_above: 0 };

    it("standard always charges when threshold is 0", () => {
      const result = calculateShippingCost(noFreeZone, "standard", 1000);
      expect(result.localCost).toBe(5);
      expect(result.isFreeStandard).toBe(false);
    });
  });

  describe("Multi-currency (INR zone)", () => {
    it("returns local cost in INR and USD equivalent", () => {
      const result = calculateShippingCost(inrZone, "standard", 100);
      expect(result.localCost).toBe(200);
      expect(result.usdCost).toBeCloseTo(200 / 85, 2);
    });

    it("free standard delivery in INR zone", () => {
      const result = calculateShippingCost(inrZone, "standard", 300);
      expect(result.localCost).toBe(0);
      expect(result.usdCost).toBe(0);
    });

    it("express still charges in INR zone even above threshold", () => {
      const result = calculateShippingCost(inrZone, "express", 300);
      expect(result.localCost).toBe(500);
      expect(result.usdCost).toBeCloseTo(500 / 85, 2);
    });
  });
});
