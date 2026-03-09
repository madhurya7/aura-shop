import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  currency_code: string;
  currency_symbol: string;
  exchange_rate: number;
  standard_rate: number;
  express_rate: number;
  standard_days: string;
  express_days: string;
  free_delivery_above: number;
  created_at: string;
  updated_at: string;
}

export function useShippingZones() {
  return useQuery({
    queryKey: ["shipping-zones"],
    queryFn: async (): Promise<ShippingZone[]> => {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []).map((z: any) => ({
        ...z,
        countries: Array.isArray(z.countries) ? z.countries : JSON.parse(z.countries),
      }));
    },
  });
}

export function useShippingZoneMutations() {
  const queryClient = useQueryClient();

  const addZone = useMutation({
    mutationFn: async (zone: Omit<ShippingZone, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("shipping_zones").insert(zone as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipping-zones"] }),
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, ...zone }: Partial<ShippingZone> & { id: string }) => {
      const { error } = await supabase.from("shipping_zones").update(zone as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipping-zones"] }),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipping-zones"] }),
  });

  return { addZone, updateZone, deleteZone };
}

// Helper: find shipping zone for a country code
export function findZoneForCountry(zones: ShippingZone[], countryCode: string): ShippingZone | null {
  // First try exact match
  const exact = zones.find((z) => z.countries.includes(countryCode));
  if (exact) return exact;
  // Fallback to "Rest of World" (wildcard)
  return zones.find((z) => z.countries.includes("*")) || null;
}
