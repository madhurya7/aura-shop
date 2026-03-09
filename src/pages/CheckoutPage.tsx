import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAddresses, type Address } from "@/hooks/useAddresses";
import { useAddressMutations } from "@/hooks/useAddresses";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, Plus, MapPin, Star, Loader2, Truck } from "lucide-react";
import { countries } from "@/lib/countries";

const emptyAddress = {
  name: "",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  is_default: false,
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice } = useCart();
  const { zone, formatPrice, convertPrice, currencySymbol, currencyCode, countryCode, setCountryCode } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const { addAddress } = useAddressMutations();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);

  const [form, setForm] = useState({
    email: user?.email || "",
    name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: countryCode,
  });

  // Sync country to currency context
  useEffect(() => {
    setCountryCode(form.country);
  }, [form.country, setCountryCode]);

  // Free delivery check (standard only)
  const isFreeStandard = useMemo(() => {
    if (!zone || !zone.free_delivery_above || zone.free_delivery_above <= 0) return false;
    return totalPrice >= zone.free_delivery_above;
  }, [zone, totalPrice]);

  // Shipping cost calculation
  const shippingCostLocal = useMemo(() => {
    if (!zone) return 0;
    if (shippingMethod === "standard" && isFreeStandard) return 0;
    return shippingMethod === "express" ? zone.express_rate : zone.standard_rate;
  }, [zone, shippingMethod, isFreeStandard]);

  const shippingCostUsd = useMemo(() => {
    if (!zone) return 0;
    if (shippingMethod === "standard" && isFreeStandard) return 0;
    return shippingCostLocal / (zone.exchange_rate || 1);
  }, [shippingCostLocal, zone, isFreeStandard, shippingMethod]);

  const deliveryTime = useMemo(() => {
    if (!zone) return "";
    return shippingMethod === "express" ? zone.express_days : zone.standard_days;
  }, [zone, shippingMethod]);

  const totalWithShipping = totalPrice + shippingCostUsd;

  // Auto-select default address when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
      populateFromAddress(defaultAddr);
    }
  }, [addresses]);

  const populateFromAddress = (addr: Address) => {
    setForm((prev) => ({
      ...prev,
      name: addr.name,
      address_line1: addr.address_line1,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
    }));
  };

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    populateFromAddress(addr);
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.name || !newAddress.address_line1 || !newAddress.city || !newAddress.postal_code) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await addAddress.mutateAsync(newAddress);
      toast.success("Address saved");
      setShowAddDialog(false);
      setNewAddress(emptyAddress);
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    }
  };

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setSelectedAddressId(null);
  };

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
          shippingMethod,
          shippingCost: shippingCostUsd,
          shippingZone: zone?.name || "Unknown",
        },
      });
      if (error) throw error;
      if (data?.url) {
        const newTab = window.open(data.url, "_blank");
        if (!newTab) window.location.href = data.url;
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
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Contact</h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required placeholder="you@example.com" />
          </div>
        </section>

        {/* Shipping Address */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Shipping Address</h2>
            {user && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(true)} disabled={addresses && addresses.length >= 5}>
                <Plus className="h-4 w-4 mr-1" />
                {addresses && addresses.length >= 5 ? "Max 5 reached" : "Save New"}
              </Button>
            )}
          </div>

          {/* Saved addresses */}
          {user && !addressesLoading && addresses && addresses.length > 0 && (
            <div className="grid gap-2">
              {addresses.map((addr) => (
                <button key={addr.id} type="button" onClick={() => handleSelectAddress(addr)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedAddressId === addr.id ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-muted-foreground/30"}`}>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{addr.name}</span>
                        {addr.is_default && <span className="inline-flex items-center gap-1 text-xs text-accent"><Star className="h-3 w-3 fill-current" /> Default</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{addr.address_line1}, {addr.city}, {addr.state} {addr.postal_code}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {user && addressesLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading saved addresses...
            </div>
          )}

          {/* Manual address fields */}
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
              <Select value={form.country} onValueChange={(val) => { setForm((p) => ({ ...p, country: val })); setSelectedAddressId(null); }}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Shipping Method */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5" /> Shipping Method
          </h2>
          {zone && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Shipping zone: <span className="font-medium text-foreground">{zone.name}</span>
              </p>
              {isFreeStandard && (
                <p className="text-xs font-medium text-green-600">
                  🎉 Free standard delivery! Your order exceeds {formatPrice(zone.free_delivery_above)}.
                </p>
              )}
              {!isFreeStandard && zone.free_delivery_above > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatPrice(zone.free_delivery_above - totalPrice)} more for free standard delivery
                </p>
              )}
            </div>
          )}
          <div className="grid gap-2">
            <button type="button" onClick={() => setShippingMethod("standard")}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${shippingMethod === "standard" ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-muted-foreground/30"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">Standard Shipping</p>
                  <p className="text-xs text-muted-foreground">{zone?.standard_days || "7-14 days"}</p>
                </div>
                <span className="font-heading font-bold">
                  {isFreeStandard ? <span className="text-green-600">FREE</span> : zone ? `${zone.currency_symbol}${zone.standard_rate.toFixed(2)}` : "—"}
                </span>
              </div>
            </button>
            <button type="button" onClick={() => setShippingMethod("express")}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${shippingMethod === "express" ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-muted-foreground/30"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">Express Shipping</p>
                  <p className="text-xs text-muted-foreground">{zone?.express_days || "3-5 days"}</p>
                </div>
                <span className="font-heading font-bold">
                  {zone ? `${zone.currency_symbol}${zone.express_rate.toFixed(2)}` : "—"}
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Order Summary */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Order Summary</h2>
          <div className="text-xs text-muted-foreground mb-3">
            Prices shown in {currencyCode} ({currencySymbol})
          </div>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-muted-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping ({shippingMethod === "express" ? "Express" : "Standard"})</span>
              <span>{shippingMethod === "standard" && isFreeStandard ? <span className="text-green-600 font-medium">FREE</span> : zone ? `${zone.currency_symbol}${shippingCostLocal.toFixed(2)}` : "—"}</span>
            </div>
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-heading font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(totalWithShipping)}</span>
          </div>
          {deliveryTime && (
            <p className="text-xs text-muted-foreground mt-2">
              Estimated delivery: {deliveryTime}
            </p>
          )}
        </section>

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={loading}>
          {loading ? "Redirecting to payment..." : `Pay ${formatPrice(totalWithShipping)}`}
        </Button>
        <p className="text-xs text-center text-muted-foreground">You'll be redirected to Stripe for secure payment (charged in USD)</p>
      </form>

      {/* Add Address Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save New Address</DialogTitle>
            <DialogDescription>Add a shipping address to your account (max 5).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Full Name *</Label><Input value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} /></div>
            <div><Label>Address *</Label><Input value={newAddress.address_line1} onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>City *</Label><Input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Postal Code *</Label><Input value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} /></div>
              <div>
                <Label>Country</Label>
                <Select value={newAddress.country} onValueChange={(val) => setNewAddress({ ...newAddress, country: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (<SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="setDefault" checked={newAddress.is_default} onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })} className="rounded" />
              <Label htmlFor="setDefault" className="text-sm cursor-pointer">Set as default address</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="button" onClick={handleAddNewAddress} disabled={addAddress.isPending}>
                {addAddress.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
