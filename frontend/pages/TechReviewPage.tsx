import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Lightbulb } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentsTab } from "@/components/tech-review/ComponentsTab";
import { ErrorsTab } from "@/components/tech-review/ErrorsTab";
import { LessonsTab } from "@/components/tech-review/LessonsTab";
import { Badge } from "@/components/ui/badge";

export function TechReviewPage() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => backend.product.get({ id: productId! }),
    enabled: !!productId,
  });

  const { data, isLoading: reviewLoading, refetch } = useQuery({
    queryKey: ["tech-review", productId],
    queryFn: async () => backend.techReview.get({ productId: productId! }),
    enabled: !!productId,
  });

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", product?.type],
    queryFn: async () => backend.lessonsLearnt.listByType({ productType: product?.type! }),
    enabled: !!product?.type,
  });

  const openErrors = data?.errors.filter(e => e.status === "open") || [];

  return (
    <MainLayout
      title={
        <div className="flex items-center gap-3">
          <Link to={`/projects/${product?.projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              Tech Review – {product?.ssCode}
              <Badge variant="outline">{product?.type}</Badge>
              {!product?.hasDrawing && (
                <Badge variant="destructive">🚩 Be brėžinio</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{product?.name}</p>
          </div>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link to="/lessons-learnt">
            <Button variant="outline">
              <Lightbulb className="h-4 w-4 mr-2" />
              Lessons Learnt
            </Button>
          </Link>
          {product?.drawingReference && (
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              {product.drawingReference}
            </Button>
          )}
        </div>
      }
    >
      {productLoading || reviewLoading ? (
        <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
      ) : (
        <Tabs defaultValue="components" className="space-y-4">
          <TabsList>
            <TabsTrigger value="components">
              Mazgai ir detalės ({data?.components.length || 0})
            </TabsTrigger>
            <TabsTrigger value="errors">
              Klaidos {openErrors.length > 0 && `(${openErrors.length})`}
            </TabsTrigger>
            <TabsTrigger value="lessons">
              Lessons Learnt ({lessonsData?.lessons.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-4">
            <ComponentsTab
              components={data?.components || []}
              onUpdate={refetch}
            />
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <ErrorsTab
              techReviewId={data?.review.id!}
              errors={data?.errors || []}
              suggestions={data?.suggestions || []}
              productType={product?.type!}
              projectCode={product?.projectId!}
              productCode={product?.ssCode!}
              onUpdate={refetch}
            />
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <LessonsTab
              productType={product?.type!}
              lessons={lessonsData?.lessons || []}
            />
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  );
}
