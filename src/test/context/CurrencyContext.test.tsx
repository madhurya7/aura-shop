import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock shipping zones data
const mockZones = [
  {
    id: "z1", name: "India", countries: ["IN"],
    currency_code: "INR", currency_symbol: "₹", exchange_rate: 83,
    standard_rate: 5, express_rate: 15, standard_days: "5-7", express_days: "2-3",
    free_delivery_above: 200, created_at: "", updated_at: "",
  },
  {
    id: "z2", name: "US", countries: ["US"],
    currency_code: "USD", currency_symbol: "$", exchange_rate: 1,
    standard_rate: 5, express_rate: 15, standard_days: "3-5", express_days: "1-2",
    free_delivery_above: 200, created_at: "", updated_at: "",
  },
  {
    id: "z3", name: "Rest of World", countries: ["*"],
    currency_code: "USD", currency_symbol: "$", exchange_rate: 1,
    standard_rate: 10, express_rate: 25, standard_days: "7-14", express_days: "3-5",
    free_delivery_above: 0, created_at: "", updated_at: "",
  },
];

vi.mock("@/hooks/useShippingZones", () => ({
  useShippingZones: () => ({ data: mockZones, isLoading: false }),
  findZoneForCountry: (zones: any[], code: string) => {
    const exact = zones.find((z: any) => z.countries.includes(code));
    if (exact) return exact;
    return zones.find((z: any) => z.countries.includes("*")) || null;
  },
}));

import { CurrencyProvider, useCurrency } from "@/context/CurrencyContext";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>{children}</CurrencyProvider>
  </QueryClientProvider>
);

describe("CurrencyContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default currency values", () => {
    localStorage.setItem("user_country", "US");
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currencySymbol).toBe("$");
    expect(result.current.currencyCode).toBe("USD");
    expect(result.current.exchangeRate).toBe(1);
  });

  it("formats price in USD", () => {
    localStorage.setItem("user_country", "US");
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.formatPrice(29.99)).toBe("$29.99");
  });

  it("converts and formats price in INR", () => {
    localStorage.setItem("user_country", "IN");
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currencySymbol).toBe("₹");
    expect(result.current.currencyCode).toBe("INR");
    expect(result.current.convertPrice(10)).toBe(830);
    expect(result.current.formatPrice(10)).toBe("₹830.00");
  });

  it("allows changing country code", () => {
    localStorage.setItem("user_country", "US");
    const { result } = renderHook(() => useCurrency(), { wrapper });
    act(() => {
      result.current.setCountryCode("IN");
    });
    expect(result.current.countryCode).toBe("IN");
    expect(localStorage.getItem("user_country")).toBe("IN");
  });

  it("falls back to Rest of World zone for unknown country", () => {
    localStorage.setItem("user_country", "ZZ");
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.zone?.name).toBe("Rest of World");
  });

  it("provides zones array", () => {
    localStorage.setItem("user_country", "US");
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.zones).toHaveLength(3);
  });

  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useCurrency());
    }).toThrow("useCurrency must be used within CurrencyProvider");
  });
});
