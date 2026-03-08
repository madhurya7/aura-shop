import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div
      className="group animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
          <h3 className="font-heading font-semibold leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{product.shortDescription}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="font-heading text-lg font-bold">${product.price.toFixed(2)}</span>
            <Button size="sm" variant="outline" onClick={handleAdd} className="gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}
