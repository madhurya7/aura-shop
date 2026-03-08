import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useProductRatings } from "@/hooks/useReviews";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [category, setCategory] = useState<string | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts(searchQuery, category);

  const allProducts = useMemo(
    () => data?.pages.flatMap((p) => p.products) || [],
    [data]
  );

  const productIds = useMemo(() => allProducts.map((p) => p.id), [allProducts]);
  const { data: ratingsMap } = useProductRatings(productIds);

  // Fetch categories from first page (all unique)
  const categories = useMemo(() => {
    return [...new Set(allProducts.map((p) => p.category))];
  }, [allProducts]);

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="min-h-screen">
      <HeroSection />

      <main id="products" className="container py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold">
              {searchQuery ? `Results for "${searchQuery}"` : "Featured Products"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {allProducts.length} product{allProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CategoryFilter selected={category} onSelect={setCategory} categories={categories} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} rating={ratingsMap?.[product.id]} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="flex justify-center py-8">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
