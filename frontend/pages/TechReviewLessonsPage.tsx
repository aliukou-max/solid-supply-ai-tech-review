import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { LessonsTab } from "@/components/tech-review/LessonsTab";

export function TechReviewLessonsPage() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => backend.product.get({ id: productId! }),
    enabled: !!productId,
  });

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", product?.type],
    queryFn: async () => backend.lessonsLearnt.listByType({ productType: product?.type! }),
    enabled: !!product?.type,
  });

  if (!product || !lessonsData) {
    return <div className="text-center py-12 text-muted-foreground">Kraunama...</div>;
  }

  return (
    <LessonsTab
      productType={product.type}
      lessons={lessonsData.lessons || []}
    />
  );
}
