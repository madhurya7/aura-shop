import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Order, OrderItem } from "@/hooks/useOrders";
import { useSubmitReview, useUserReviewForProduct } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import StarRating from "@/components/StarRating";
import { getProductImage } from "@/lib/productImages";
import { Loader2, Star, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function ReviewButton({ item, order, userId }: { item: OrderItem; order: Order; userId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const submitReview = useSubmitReview();
  const { data: existingReview, isLoading } = useUserReviewForProduct(userId, item.product_id, order.id);

  if (isLoading) return <Skeleton className="h-8 w-20" />;
  if (existingReview) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        Reviewed ({existingReview.rating}/5)
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    try {
      await submitReview.mutateAsync({
        product_id: item.product_id, user_id: userId, order_id: order.id,
        rating, review_text: reviewText.trim(),
      });
      toast.success("Review submitted!");
      setOpen(false); setRating(0); setReviewText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
        <Star className="h-3 w-3" /> Rate
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate & Review</DialogTitle>
            <DialogDescription>{item.product?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="mb-2 block">Your Rating</Label>
              <StarRating rating={rating} size="lg" interactive onRate={setRating} />
            </div>
            <div>
              <Label className="mb-2 block">Your Review (optional)</Label>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product..." maxLength={500} />
              <p className="text-xs text-muted-foreground mt-1">{reviewText.length}/500 characters</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitReview.isPending}>
                {submitReview.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OrderCard({ order, userId }: { order: Order; userId: string }) {
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const queryClient = useQueryClient();
  const isPending = order.order_status === "pending";

  const handleRetryPayment = async () => {
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("retry-payment", {
        body: { orderId: order.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to retry payment");
    } finally {
      setRetrying(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      // Delete order items first, then payments, then the order
      await supabase.from("order_items").delete().eq("order_id", order.id);
      await supabase.from("payments").delete().eq("order_id", order.id);
      const { error } = await supabase.from("orders").delete().eq("id", order.id);
      if (error) throw error;
      toast.success("Order cancelled and removed");
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="border rounded-xl p-5 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono">Order #{order.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[order.order_status] || "bg-secondary"} variant="secondary">
            {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
          </Badge>
          <span className="font-heading font-bold">${Number(order.total_price).toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2 border-t first:border-t-0">
            <img
              src={getProductImage(item.product?.image_url || "")}
              alt={item.product?.name || "Product"}
              className="h-14 w-14 rounded-lg object-cover bg-secondary"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.product?.name || "Unknown Product"}</p>
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity} × ${Number(item.price_at_purchase).toFixed(2)}
              </p>
            </div>
            {order.order_status === "delivered" && (
              <ReviewButton item={item} order={order} userId={userId} />
            )}
          </div>
        ))}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button size="sm" className="gap-1.5" onClick={handleRetryPayment} disabled={retrying}>
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pay Now
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1.5" disabled={cancelling}>
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Cancel Order
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the order from your history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelOrder}>Yes, Cancel Order</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
