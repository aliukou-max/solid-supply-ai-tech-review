import { Link } from "react-router-dom";
import { Box, Edit2, Flag } from "lucide-react";
import type { Product } from "~backend/product/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

interface ProductCardProps {
  product: Product;
  onEdit?: () => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const { data: componentPartsData } = useQuery({
    queryKey: ["component-parts-check", product.id],
    queryFn: async () => {
      const review = await backend.techReview.get({ productId: product.id });
      return backend.techReview.listComponentParts({ techReviewId: review.review.id });
    },
    enabled: !!product.id,
  });

  const hasIncomplete = componentPartsData?.parts.some(
    part => !part.hasDone || !part.hasNode
  );

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
      {hasIncomplete && (
        <div className="absolute -top-2 -right-2 z-10">
          <Flag className="h-6 w-6 text-red-500 fill-red-500" />
        </div>
      )}
      <Link to={`/tech-review/${product.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-base mb-1">{product.ssCode}</h3>
              <Badge variant="secondary" className="text-xs mb-2">{product.type}</Badge>
              <p className="text-sm">{product.name}</p>
            </div>
          </div>
        </CardHeader>
      </Link>
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
          className="absolute top-3 right-3"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
}
