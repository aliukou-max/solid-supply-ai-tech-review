import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, AlertTriangle, Download } from "lucide-react";
import backend from "~backend/client";
import type { Product } from "~backend/product/types";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import { EditProductDialog } from "@/components/EditProductDialog";
import { ReanalyzeDialog } from "@/components/tech-review/ReanalyzeDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectPartsProduct, setSelectPartsProduct] = useState<Product | null>(null);
  const [productDescription, setProductDescription] = useState<string>("");
  const { toast } = useToast();

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

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Ar tikrai norite ištrinti gaminį ${product.ssCode}?`)) {
      return;
    }

    try {
      await backend.product.deleteProduct({ id: product.id });
      toast({ title: "Gaminys ištrintas" });
      refetch();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti gaminio",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!projectId) return;

    try {
      toast({
        title: "Ruošiama...",
        description: "Generuojamas Excel failas",
      });

      const result = await backend.project.exportProject({ projectId });

      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.fileData}`;
      link.download = result.filename;
      link.click();

      toast({
        title: "Sėkmingai eksportuota",
        description: `Failas: ${result.filename}`,
      });
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko eksportuoti į Excel",
        variant: "destructive",
      });
    }
  };

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
              <span className="font-bold">{project?.id}</span>
              <span>–</span>
              <span>{project?.name}</span>
              {productsWithoutDrawing.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {productsWithoutDrawing.length} be brėžinių
                </Badge>
              )}
            </div>
            {data?.products && data.products.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Gaminiai: {data.products.map(p => `${p.name} (${p.type})`).join(', ')}
              </div>
            )}
          </div>
        </div>
      }
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportExcel} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportuoti Excel
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Naujas gaminys
          </Button>
        </div>
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
            <ProductCard 
              key={product.id} 
              product={product}
              onEdit={() => setEditProduct(product)}
              onDelete={() => handleDeleteProduct(product)}
              onSelectParts={async () => {
                try {
                  const review = await backend.techReview.get({ productId: product.id });
                  setProductDescription(review.review.generalNotes || "");
                  setSelectPartsProduct(product);
                } catch (error) {
                  console.error("Failed to load tech review:", error);
                  setProductDescription("");
                  setSelectPartsProduct(product);
                }
              }}
            />
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

      {editProduct && (
        <EditProductDialog
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
          product={editProduct}
          onSuccess={() => {
            setEditProduct(null);
            refetch();
          }}
        />
      )}

      {selectPartsProduct && (
        <ReanalyzeDialog
          open={!!selectPartsProduct}
          onOpenChange={(open) => !open && setSelectPartsProduct(null)}
          productId={selectPartsProduct.id}
          productTypeId={selectPartsProduct.productTypeId || ""}
          productDescription={productDescription}
          onSuccess={() => {
            setSelectPartsProduct(null);
            setProductDescription("");
            refetch();
          }}
        />
      )}
    </MainLayout>
  );
}
