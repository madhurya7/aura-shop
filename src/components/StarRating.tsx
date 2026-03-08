import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  reviewCount?: number;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onRate,
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              className={cn(
                sizeMap[size],
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30",
                interactive && "cursor-pointer hover:text-amber-400 transition-colors"
              )}
              onClick={() => interactive && onRate?.(i + 1)}
            />
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="text-xs text-muted-foreground ml-0.5">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}
