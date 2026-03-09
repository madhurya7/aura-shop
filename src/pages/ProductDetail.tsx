import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useProductRating } from "@/hooks/useReviews";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImages";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);
  const { data: product, isLoading } = useProduct(id || "");
  const { data: ratingData } = useProductRating(id || "");

  const cartItem = items.find((i) => i.productId === id);
  const cartQty = cartItem?.quantity || 0;

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

  const isOutOfStock = product.stock_quantity <= 0;
  const maxCanAdd = product.stock_quantity - cartQty;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    if (qty > maxCanAdd) {
      toast.error(`Only ${maxCanAdd} more can be added (${cartQty} already in cart)`);
      return;
    }
    const added = addItem(product, qty);
    if (added) {
      toast.success(`${qty}x ${product.name} added to cart`);
    } else {
      toast.error(`Cannot exceed available stock (${product.stock_quantity} total)`);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    if (qty > maxCanAdd) {
      toast.error(`Only ${maxCanAdd} more can be added`);
      return;
    }
    addItem(product, qty);
    navigate("/cart");
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-10 animate-fade-in">
        <div className="aspect-square overflow-hidden rounded-xl bg-secondary relative">
          <img
            src={getProductImage(product.image_url)}
            alt={product.name}
            className={`h-full w-full object-cover ${isOutOfStock ? "opacity-50" : ""}`}
          />
          {isOutOfStock && (
            <Badge variant="destructive" className="absolute top-4 left-4 text-base px-4 py-1">
              Out of Stock
            </Badge>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{product.category}</p>
          <h1 className="font-heading text-3xl font-bold mt-1">{product.name}</h1>
          <p className="font-heading text-3xl font-bold text-accent mt-4">${Number(product.price).toFixed(2)}</p>
          {ratingData && ratingData.review_count > 0 && (
            <div className="mt-2">
              <StarRating rating={ratingData.avg_rating} showValue reviewCount={ratingData.review_count} size="md" />
            </div>
          )}
          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-3 mt-8">
            <span className="text-sm text-muted-foreground">Qty</span>
            <div className="flex items-center border rounded-lg">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(Math.max(1, qty - 1))} disabled={isOutOfStock}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(Math.min(maxCanAdd, qty + 1))} disabled={isOutOfStock || qty >= maxCanAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className={`text-xs ${isOutOfStock ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {isOutOfStock ? "Out of stock" : `${product.stock_quantity} in stock`}
              {cartQty > 0 && !isOutOfStock && ` (${cartQty} in cart)`}
            </span>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleAddToCart} variant="outline" className="flex-1 gap-2" disabled={isOutOfStock}>
              <ShoppingCart className="h-4 w-4" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button onClick={handleBuyNow} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isOutOfStock}>
              {isOutOfStock ? "Unavailable" : "Buy Now"}
            </Button>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  );
}
