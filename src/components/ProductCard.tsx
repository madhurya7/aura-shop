import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImages";
import type { Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import type { ProductRating } from "@/hooks/useReviews";

interface ProductCardProps {
  product: Product;
  index?: number;
  rating?: ProductRating;
}

export default function ProductCard({ product, index = 0, rating }: ProductCardProps) {
  const { addItem, items } = useCart();
  const isOutOfStock = product.stock_quantity <= 0;
  const cartItem = items.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity || 0;
  const canAdd = !isOutOfStock && cartQty < product.stock_quantity;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    const added = addItem(product);
    if (added) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error(`Only ${product.stock_quantity} available in stock`);
    }
  };

  return (
    <div className="group animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary mb-3 relative">
          <img
            src={getProductImage(product.image_url)}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "opacity-50" : ""}`}
            loading="lazy"
          />
          {isOutOfStock && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out of Stock
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
          <h3 className="font-heading font-semibold leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="font-heading text-lg font-bold">${Number(product.price).toFixed(2)}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              className="gap-1.5"
              disabled={!canAdd}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {isOutOfStock ? "Sold Out" : "Add"}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}
