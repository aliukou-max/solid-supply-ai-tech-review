import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import { Badge } from "@/components/ui/badge";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => backend.project.get({ id: projectId! }),
    enabled: !!projectId,
  });

  const { data, isLoading: productsLoading, refetch } = useQuery({
    queryKey: ["products", projectId],
    queryFn: async () => backend.product.listByProject({ projectId: projectId! }),
    enabled: !!projectId,
  });

  const productsWithoutDrawing = data?.products.filter(p => !p.hasDrawing) || [];

  return (
    <MainLayout
      title={
        <div className="flex items-center gap-3">
          <Link to="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {project?.id} – {project?.client}
              {productsWithoutDrawing.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {productsWithoutDrawing.length} be brėžinių
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{project?.name}</p>
          </div>
        </div>
      }
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Naujas gaminys
        </Button>
      }
    >
      {projectLoading || productsLoading ? (
        <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
      ) : data?.products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nėra sukurtų gaminių</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Sukurti pirmą gaminį
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId!}
        onSuccess={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
    </MainLayout>
  );
}
