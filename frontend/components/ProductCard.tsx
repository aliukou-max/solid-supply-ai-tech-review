import { Link } from "react-router-dom";
import { Box, AlertTriangle, FileText } from "lucide-react";
import type { Product } from "~backend/product/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/tech-review/${product.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{product.ssCode}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.type}</Badge>
              {!product.hasDrawing && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Be brėžinio
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{product.name}</p>
            {product.dimensions && (
              <p className="text-sm text-muted-foreground">
                Matmenys: {product.dimensions}
              </p>
            )}
            {product.drawingReference && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-3 w-3" />
                {product.drawingReference}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
