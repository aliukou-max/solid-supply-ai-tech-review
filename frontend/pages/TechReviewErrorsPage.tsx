import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { ErrorsTab } from "@/components/tech-review/ErrorsTab";

export function TechReviewErrorsPage() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => backend.product.get({ id: productId! }),
    enabled: !!productId,
  });

  const { data, refetch } = useQuery({
    queryKey: ["tech-review", productId],
    queryFn: async () => backend.techReview.get({ productId: productId! }),
    enabled: !!productId,
  });

  if (!data || !product) {
    return <div className="text-center py-12 text-muted-foreground">Kraunama...</div>;
  }

  return (
    <ErrorsTab
      techReviewId={data.review.id}
      errors={data.errors || []}
      suggestions={data.suggestions || []}
      productType={product.type}
      projectCode={product.projectId}
      productCode={product.ssCode}
      onUpdate={refetch}
    />
  );
}
