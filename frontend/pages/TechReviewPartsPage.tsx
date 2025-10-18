import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { ComponentPartsTab } from "@/components/tech-review/ComponentPartsTab";

export function TechReviewPartsPage() {
  const { productId } = useParams<{ productId: string }>();

  const { data, refetch } = useQuery({
    queryKey: ["tech-review", productId],
    queryFn: async () => backend.techReview.get({ productId: productId! }),
    enabled: !!productId,
  });

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Kraunama...</div>;
  }

  return (
    <ComponentPartsTab
      techReviewId={data.review.id}
      productId={productId!}
      onUpdate={refetch}
    />
  );
}
