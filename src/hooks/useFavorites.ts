import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map((f: { product_id: string }) => f.product_id));
    },
    enabled: !!user,
  });
}

export function useFavoriteProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorite-products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id, products(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((f: any) => f.products).filter(Boolean);
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorited }: { productId: string; isFavorited: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-products"] });
    },
  });
}
