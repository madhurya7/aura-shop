import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserOrders, type Order, type OrderItem } from "@/hooks/useOrders";
import { useSubmitReview, useUserReviewForProduct } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StarRating from "@/components/StarRating";
import { getProductImage } from "@/lib/productImages";
import {
  ArrowLeft,
  Package,
  Loader2,
  Star,
  MessageSquare,
  Send,
} from "lucide-react";
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

function ReviewButton({
  item,
  order,
  userId,
}: {
  item: OrderItem;
  order: Order;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const submitReview = useSubmitReview();
  const { data: existingReview, isLoading } = useUserReviewForProduct(
    userId,
    item.product_id,
    order.id
  );

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
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await submitReview.mutateAsync({
        product_id: item.product_id,
        user_id: userId,
        order_id: order.id,
        rating,
        review_text: reviewText.trim(),
      });
      toast.success("Review submitted!");
      setOpen(false);
      setRating(0);
      setReviewText("");
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
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reviewText.length}/500 characters
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitReview.isPending}>
                {submitReview.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TrackingQuerySection() {
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!orderId.trim() || !message.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("contact-admin", {
        body: { orderId: orderId.trim(), message: message.trim() },
      });
      if (error) throw error;
      toast.success("Your query has been sent to our team!");
      setOrderId("");
      setMessage("");
    } catch {
      toast.error("Failed to send query. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border rounded-xl p-6 bg-card mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-lg font-bold">
          Order Tracking & Support
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Have a question about tracking your order? Write to us and we'll get back to you via email.
      </p>
      <div className="space-y-3">
        <div>
          <Label>Order ID</Label>
          <Input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Paste your order ID here"
          />
        </div>
        <div>
          <Label>Your Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your query..."
            maxLength={1000}
          />
        </div>
        <Button onClick={handleSend} disabled={sending} className="gap-2">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Query
        </Button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useUserOrders();

  if (authLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-40 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full mb-4" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/40" />
        <h2 className="font-heading text-2xl font-bold mt-4">
          Sign in to view orders
        </h2>
        <Button
          className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate("/auth")}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in max-w-3xl">
      <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <h1 className="font-heading text-2xl font-bold mb-8">Order History</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground mt-3">No orders yet</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-xl p-5 bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      statusColors[order.order_status] || "bg-secondary"
                    }
                    variant="secondary"
                  >
                    {order.order_status.charAt(0).toUpperCase() +
                      order.order_status.slice(1)}
                  </Badge>
                  <span className="font-heading font-bold">
                    ${Number(order.total_price).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-t first:border-t-0"
                  >
                    <img
                      src={getProductImage(item.product?.image_url || "")}
                      alt={item.product?.name || "Product"}
                      className="h-14 w-14 rounded-lg object-cover bg-secondary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.name || "Unknown Product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × $
                        {Number(item.price_at_purchase).toFixed(2)}
                      </p>
                    </div>
                    {order.order_status === "delivered" && (
                      <ReviewButton
                        item={item}
                        order={order}
                        userId={user.id}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TrackingQuerySection />
    </div>
  );
}
