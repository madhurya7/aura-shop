import { useState } from "react";
import { useProductReviews } from "@/hooks/useReviews";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, User } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const { data, isLoading } = useProductReviews(productId, visibleCount);

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.total === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-heading text-xl font-bold mb-4">
        Customer Reviews ({data.total})
      </h2>
      <div className="space-y-4">
        {data.reviews.map((review) => (
          <div
            key={review.id}
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">Verified Buyer</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <StarRating rating={review.rating} size="sm" />
            {review.review_text && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        ))}
      </div>

      {data.total > visibleCount && (
        <Button
          variant="outline"
          className="mt-4 w-full gap-2"
          onClick={() => setVisibleCount((c) => c + 5)}
        >
          <ChevronDown className="h-4 w-4" />
          Show More Reviews ({data.total - visibleCount} remaining)
        </Button>
      )}
    </div>
  );
}
