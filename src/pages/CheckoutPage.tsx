import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: user?.email || "",
    name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40" />
        <h2 className="font-heading text-2xl font-bold mt-4">Nothing to checkout</h2>
        <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image_url: i.image_url,
          })),
          email: form.email,
          shippingAddress: {
            name: form.name,
            address_line1: form.address_line1,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country,
          },
        },
      });

      if (error) throw error;
      if (data?.url) {
        const newTab = window.open(data.url, "_blank");
        if (!newTab) {
          window.location.href = data.url;
        }
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 animate-fade-in max-w-2xl">
      <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <h1 className="font-heading text-2xl font-bold mb-8">Checkout</h1>

      {!user && (
        <div className="rounded-xl border bg-secondary/50 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Have an account? Sign in for a faster checkout.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Contact</h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="you@example.com" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Shipping Address</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">Postal Code</Label>
              <Input id="zip" value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} required />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-muted-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-heading font-bold text-lg">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </section>

        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          disabled={loading}
        >
          {loading ? "Redirecting to payment..." : `Pay $${totalPrice.toFixed(2)}`}
        </Button>
        <p className="text-xs text-center text-muted-foreground">You'll be redirected to Stripe for secure payment</p>
      </form>
    </div>
  );
}
