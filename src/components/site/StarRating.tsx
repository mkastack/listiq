import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ value, count, size = "sm", showCount = true }: { value: number; count?: number; size?: "sm" | "md" | "lg"; showCount?: boolean }) {
  const px = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const text = size === "lg" ? "text-base" : "text-xs";
  return (
    <div className={cn("inline-flex items-center gap-1.5", text)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(px, i <= Math.round(value) ? "fill-warning text-warning" : "fill-muted text-muted")}
          />
        ))}
      </div>
      <span className="font-medium text-foreground">{value > 0 ? value.toFixed(1) : "New"}</span>
      {showCount && typeof count === "number" && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </div>
  );
}