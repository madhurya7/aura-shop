import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrderCard from "@/components/OrderCard";
import {
  ArrowLeft,
  Package,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
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
            <OrderCard key={order.id} order={order} userId={user.id} />
          ))}
        </div>
      )}

      <TrackingQuerySection />
    </div>
  );
}
