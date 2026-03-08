import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_email?: string;
}

export interface ProductRating {
  avg_rating: number;
  review_count: number;
}

export function useProductReviews(productId: string, limit = 5, offset = 0) {
  return useQuery({
    queryKey: ["reviews", productId, limit, offset],
    queryFn: async (): Promise<{ reviews: Review[]; total: number }> => {
      const { count } = await supabase
        .from("product_reviews")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);

      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { reviews: (data || []) as Review[], total: count || 0 };
    },
    enabled: !!productId,
  });
}

export function useProductRating(productId: string) {
  return useQuery({
    queryKey: ["product-rating", productId],
    queryFn: async (): Promise<ProductRating> => {
      const { data, error } = await supabase.rpc("get_product_avg_rating", {
        p_product_id: productId,
      });
      if (error) throw error;
      const row = data?.[0];
      return {
        avg_rating: Number(row?.avg_rating) || 0,
        review_count: Number(row?.review_count) || 0,
      };
    },
    enabled: !!productId,
  });
}

export function useProductRatings(productIds: string[]) {
  return useQuery({
    queryKey: ["product-ratings-bulk", productIds.sort().join(",")],
    queryFn: async (): Promise<Record<string, ProductRating>> => {
      if (productIds.length === 0) return {};
      const { data, error } = await supabase
        .from("product_reviews")
        .select("product_id, rating")
        .in("product_id", productIds);
      if (error) throw error;

      const map: Record<string, { sum: number; count: number }> = {};
      for (const r of data || []) {
        if (!map[r.product_id]) map[r.product_id] = { sum: 0, count: 0 };
        map[r.product_id].sum += r.rating;
        map[r.product_id].count += 1;
      }

      const result: Record<string, ProductRating> = {};
      for (const [id, v] of Object.entries(map)) {
        result[id] = {
          avg_rating: Math.round((v.sum / v.count) * 10) / 10,
          review_count: v.count,
        };
      }
      return result;
    },
    enabled: productIds.length > 0,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      user_id: string;
      order_id: string;
      rating: number;
      review_text: string;
    }) => {
      const { data, error } = await supabase
        .from("product_reviews")
        .insert(review)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-rating", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-ratings-bulk"] });
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
    },
  });
}

export function useUserReviewForProduct(userId: string | undefined, productId: string, orderId: string) {
  return useQuery({
    queryKey: ["user-review", userId, productId, orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("user_id", userId!)
        .eq("product_id", productId)
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!userId && !!productId && !!orderId,
  });
}
