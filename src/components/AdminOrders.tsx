import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface AdminOrder {
  id: string;
  email: string;
  total_price: number;
  order_status: OrderStatus;
  created_at: string;
  shipping_address: any;
  order_items: {
    id: string;
    quantity: number;
    price_at_purchase: number;
    product_id: string;
    products: { name: string } | null;
  }[];
}

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async (): Promise<AdminOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, email, total_price, order_status, created_at, shipping_address,
          order_items (
            id, quantity, price_at_purchase, product_id,
            products:product_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as AdminOrder[];
    },
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ order_status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Order status updated to ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    }
    setUpdatingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">
                {order.id.slice(0, 8)}…
              </TableCell>
              <TableCell className="text-sm">{order.email}</TableCell>
              <TableCell className="text-sm max-w-[200px]">
                {order.order_items.map((item) => (
                  <div key={item.id} className="truncate text-xs text-muted-foreground">
                    {item.products?.name || "Unknown"} × {item.quantity}
                  </div>
                ))}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${order.total_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(order.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Select
                  value={order.order_status}
                  onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                  disabled={updatingId === order.id}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue>
                      <Badge variant="secondary" className={`${statusColors[order.order_status]} border-0 text-xs`}>
                        {STATUS_OPTIONS.find((s) => s.value === order.order_status)?.label}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <Badge variant="secondary" className={`${statusColors[s.value]} border-0 text-xs`}>
                          {s.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {orders?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No orders yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
