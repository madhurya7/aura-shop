import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImages";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const { data: product, isLoading } = useProduct(id || "");

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-20 mb-6" />
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground text-lg">Product not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Back to Shop</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success(`${qty}x ${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, qty);
    navigate("/cart");
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-10 animate-fade-in">
        <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
          <img src={getProductImage(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{product.category}</p>
          <h1 className="font-heading text-3xl font-bold mt-1">{product.name}</h1>
          <p className="font-heading text-3xl font-bold text-accent mt-4">${Number(product.price).toFixed(2)}</p>
          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-3 mt-8">
            <span className="text-sm text-muted-foreground">Qty</span>
            <div className="flex items-center border rounded-lg">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(Math.max(1, qty - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(qty + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">{product.stock_quantity} in stock</span>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleAddToCart} variant="outline" className="flex-1 gap-2">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button onClick={handleBuyNow} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
