import { useFavoriteProducts } from "@/hooks/useFavorites";
import { useProductRatings } from "@/hooks/useReviews";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { data: products, isLoading } = useFavoriteProducts();
  const productIds = useMemo(() => (products || []).map((p: any) => p.id), [products]);
  const { data: ratingsMap } = useProductRatings(productIds);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg mb-4">Sign in to view your favorites</p>
        <Button asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="font-heading text-2xl font-bold mb-2">My Favorites</h1>
      <p className="text-muted-foreground mb-8">
        {products?.length || 0} saved item{(products?.length || 0) !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : !products?.length ? (
        <div className="text-center py-20">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No favorites yet. Browse products and tap the heart icon to save them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any, i: number) => (
            <ProductCard key={product.id} product={product} index={i} rating={ratingsMap?.[product.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
