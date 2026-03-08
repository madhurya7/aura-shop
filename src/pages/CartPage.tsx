import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getProductImage } from "@/lib/productImages";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40" />
        <h2 className="font-heading text-2xl font-bold mt-4">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">Add some products to get started</p>
        <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Continue Shopping
      </Button>

      <h1 className="font-heading text-2xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 rounded-xl border bg-card">
              <Link to={`/product/${item.productId}`} className="shrink-0">
                <img src={getProductImage(item.image_url)} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.productId}`}>
                  <h3 className="font-heading font-semibold truncate">{item.name}</h3>
                </Link>
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <p className="font-heading font-bold mt-1">${Number(item.price).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex items-center border rounded-lg">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 sticky top-24">
            <h2 className="font-heading text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-muted-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90" size="lg" asChild>
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">Taxes and shipping calculated at checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
