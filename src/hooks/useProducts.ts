import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category: string;
  created_at: string;
}

const PAGE_SIZE = 10;
const MAX_PRODUCTS = 100;

export function useProducts(search?: string, category?: string | null) {
  return useInfiniteQuery({
    queryKey: ["products", search || "", category || ""],
    queryFn: async ({ pageParam = 0 }): Promise<{ products: Product[]; nextPage: number | null }> => {
      const from = pageParam * PAGE_SIZE;
      if (from >= MAX_PRODUCTS) return { products: [], nextPage: null };

      const to = Math.min(from + PAGE_SIZE - 1, MAX_PRODUCTS - 1);

      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      const products = (data || []) as Product[];
      const nextPage = products.length === PAGE_SIZE && (from + PAGE_SIZE) < MAX_PRODUCTS
        ? pageParam + 1
        : null;

      return { products, nextPage };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}
