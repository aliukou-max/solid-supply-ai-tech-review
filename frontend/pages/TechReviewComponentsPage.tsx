import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { ComponentsTab } from "@/components/tech-review/ComponentsTab";
import { NodeRecommendations } from "@/components/NodeRecommendations";

export function TechReviewComponentsPage() {
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
    <div className="space-y-4">
      <NodeRecommendations productId={productId!} />
      <ComponentsTab
        components={data.components || []}
        onUpdate={refetch}
      />
    </div>
  );
}
