import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: {
    id: string;
    name: string;
    image_url: string;
    category: string;
  };
}

export interface Order {
  id: string;
  email: string;
  total_price: number;
  order_status: string;
  shipping_address: any;
  stripe_payment_id: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export function useUserOrders() {
  return useQuery({
    queryKey: ["user-orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price_at_purchase,
            products:product_id (id, name, image_url, category)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((order: any) => ({
        ...order,
        order_items: (order.order_items || []).map((item: any) => ({
          ...item,
          product: item.products,
        })),
      })) as Order[];
    },
  });
}
