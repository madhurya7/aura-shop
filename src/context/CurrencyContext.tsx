import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useShippingZones, findZoneForCountry, type ShippingZone } from "@/hooks/useShippingZones";

interface CurrencyContextType {
  countryCode: string;
  setCountryCode: (code: string) => void;
  zone: ShippingZone | null;
  currencySymbol: string;
  currencyCode: string;
  exchangeRate: number;
  formatPrice: (usdPrice: number) => string;
  convertPrice: (usdPrice: number) => number;
  zones: ShippingZone[];
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: zones, isLoading } = useShippingZones();
  const [countryCode, setCountryCode] = useState<string>(() => {
    return localStorage.getItem("user_country") || "US";
  });

  useEffect(() => {
    localStorage.setItem("user_country", countryCode);
  }, [countryCode]);

  const zone = zones ? findZoneForCountry(zones, countryCode) : null;
  const currencySymbol = zone?.currency_symbol || "$";
  const currencyCode = zone?.currency_code || "USD";
  const exchangeRate = zone?.exchange_rate || 1;

  const convertPrice = (usdPrice: number) => {
    return Math.round(usdPrice * exchangeRate * 100) / 100;
  };

  const formatPrice = (usdPrice: number) => {
    const converted = convertPrice(usdPrice);
    return `${currencySymbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        countryCode,
        setCountryCode,
        zone,
        currencySymbol,
        currencyCode: currencyCode,
        exchangeRate,
        formatPrice,
        convertPrice,
        zones: zones || [],
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
