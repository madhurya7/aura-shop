import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useShippingZones, findZoneForCountry, type ShippingZone } from "@/hooks/useShippingZones";

// Map common timezones to country codes
const timezoneToCountry: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Mumbai": "IN",
  "Asia/Dhaka": "BD",
  "Asia/Kathmandu": "NP",
  "Asia/Colombo": "LK",
  "Asia/Singapore": "SG",
  "Asia/Bangkok": "TH",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Europe/Kiev": "UA",
  "Europe/Lisbon": "PT",
  "Europe/Dublin": "IE",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Jerusalem": "IL",
  "Asia/Karachi": "PK",
};

function detectCountryFromTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezoneToCountry[timezone] || "US";
  } catch {
    return "US";
  }
}

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
    const saved = localStorage.getItem("user_country");
    if (saved) return saved;
    // Auto-detect on first visit
    return detectCountryFromTimezone();
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
