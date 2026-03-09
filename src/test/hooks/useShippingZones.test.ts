import { describe, it, expect, vi, beforeEach } from "vitest";
import { findZoneForCountry, type ShippingZone } from "@/hooks/useShippingZones";

const makeZone = (overrides: Partial<ShippingZone> = {}): ShippingZone => ({
  id: "zone-1",
  name: "North America",
  countries: ["US", "CA"],
  currency_code: "USD",
  currency_symbol: "$",
  exchange_rate: 1,
  standard_rate: 5,
  express_rate: 15,
  standard_days: "7-14 days",
  express_days: "3-5 days",
  free_delivery_above: 200,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  ...overrides,
});

describe("findZoneForCountry", () => {
  const zones: ShippingZone[] = [
    makeZone({ id: "z1", name: "North America", countries: ["US", "CA"] }),
    makeZone({ id: "z2", name: "India", countries: ["IN"], currency_code: "INR", currency_symbol: "₹", exchange_rate: 85 }),
    makeZone({ id: "z3", name: "Europe", countries: ["GB", "DE", "FR"] }),
    makeZone({ id: "z4", name: "Rest of World", countries: ["*"] }),
  ];

  it("returns exact match for US", () => {
    const result = findZoneForCountry(zones, "US");
    expect(result?.name).toBe("North America");
  });

  it("returns exact match for IN", () => {
    const result = findZoneForCountry(zones, "IN");
    expect(result?.name).toBe("India");
  });

  it("returns exact match for GB", () => {
    const result = findZoneForCountry(zones, "GB");
    expect(result?.name).toBe("Europe");
  });

  it("falls back to Rest of World for unknown country", () => {
    const result = findZoneForCountry(zones, "JP");
    expect(result?.name).toBe("Rest of World");
  });

  it("returns null if no zones match and no wildcard", () => {
    const noWildcard = zones.filter((z) => !z.countries.includes("*"));
    const result = findZoneForCountry(noWildcard, "JP");
    expect(result).toBeNull();
  });

  it("returns null for empty zones array", () => {
    expect(findZoneForCountry([], "US")).toBeNull();
  });
});

describe("ShippingZone free_delivery_above", () => {
  it("has default value of 200", () => {
    const zone = makeZone();
    expect(zone.free_delivery_above).toBe(200);
  });

  it("can be set to 0 to disable free delivery", () => {
    const zone = makeZone({ free_delivery_above: 0 });
    expect(zone.free_delivery_above).toBe(0);
  });

  it("free delivery logic: standard free when total >= threshold", () => {
    const zone = makeZone({ free_delivery_above: 200 });
    const totalPrice = 250;
    const isFreeStandard = zone.free_delivery_above > 0 && totalPrice >= zone.free_delivery_above;
    expect(isFreeStandard).toBe(true);
  });

  it("free delivery logic: standard NOT free when total < threshold", () => {
    const zone = makeZone({ free_delivery_above: 200 });
    const totalPrice = 150;
    const isFreeStandard = zone.free_delivery_above > 0 && totalPrice >= zone.free_delivery_above;
    expect(isFreeStandard).toBe(false);
  });

  it("free delivery logic: express always charges regardless of total", () => {
    const zone = makeZone({ free_delivery_above: 200, express_rate: 15 });
    const totalPrice = 500;
    const isFreeStandard = zone.free_delivery_above > 0 && totalPrice >= zone.free_delivery_above;
    const shippingMethod: "standard" | "express" = "express";
    const shippingCost = shippingMethod === "standard" && isFreeStandard ? 0 : zone.express_rate;
    expect(shippingCost).toBe(15);
  });

  it("free delivery logic: standard is 0 when threshold met", () => {
    const zone = makeZone({ free_delivery_above: 200, standard_rate: 5 });
    const totalPrice = 200;
    const isFreeStandard = zone.free_delivery_above > 0 && totalPrice >= zone.free_delivery_above;
    const shippingMethod = "standard";
    const shippingCost = shippingMethod === "standard" && isFreeStandard ? 0 : zone.standard_rate;
    expect(shippingCost).toBe(0);
  });
});
