import { useParams, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Lightbulb } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function TechReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => backend.product.get({ id: productId! }),
    enabled: !!productId,
  });

  const { data, isLoading: reviewLoading } = useQuery({
    queryKey: ["tech-review", productId],
    queryFn: async () => backend.techReview.get({ productId: productId! }),
    enabled: !!productId,
  });

  const { data: componentPartsData } = useQuery({
    queryKey: ["component-parts", data?.review.id],
    queryFn: async () => backend.techReview.listComponentParts({ techReviewId: data?.review.id! }),
    enabled: !!data?.review.id,
  });

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", product?.type],
    queryFn: async () => backend.lessonsLearnt.listByType({ productType: product?.type! }),
    enabled: !!product?.type,
  });

  const openErrors = data?.errors.filter(e => e.status === "open") || [];

  const currentTab = location.pathname.split('/').pop() || 'parts';

  const handleTabChange = (value: string) => {
    navigate(`/tech-review/${productId}/${value}`);
  };

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
        <div className="space-y-4">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="parts">
                Detalės ({componentPartsData?.parts.length || 0})
              </TabsTrigger>
              <TabsTrigger value="components">
                Mazgai ({data?.components.length || 0})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Klaidos {openErrors.length > 0 && `(${openErrors.length})`}
              </TabsTrigger>
              <TabsTrigger value="lessons">
                Lessons Learnt ({lessonsData?.lessons.length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Outlet />
        </div>
      )}
    </MainLayout>
  );
}
