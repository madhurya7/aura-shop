import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Address {
  id: string;
  user_id: string;
  name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export function useAddresses() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async (): Promise<Address[]> => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });

  return query;
}

export function useAddressMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  const addAddress = useMutation({
    mutationFn: async (address: Omit<Address, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase.from("addresses").insert({
        ...address,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Address> & { id: string }) => {
      const { error } = await supabase.from("addresses").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addAddress, updateAddress, deleteAddress, setDefault };
}
