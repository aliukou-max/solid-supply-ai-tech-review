import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Lightbulb } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ErrorsTab } from "@/components/tech-review/ErrorsTab";
import { LessonsTab } from "@/components/tech-review/LessonsTab";
import { ComponentPartsTabContent } from "@/components/tech-review/ComponentPartsTabContent";

export function TechReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      return backend.product.get({ id: productId });
    },
    enabled: !!productId,
  });

  const { data, isLoading: reviewLoading, refetch } = useQuery({
    queryKey: ["tech-review", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      return backend.techReview.get({ productId });
    },
    enabled: !!productId,
  });

  const { data: productTypeParts } = useQuery({
    queryKey: ["product-type-parts", product?.productTypeId],
    queryFn: async () => backend.product_types.listParts({ productTypeId: product?.productTypeId! }),
    enabled: !!product?.productTypeId,
  });

  const { data: componentPartsData, refetch: refetchParts } = useQuery({
    queryKey: ["component-parts", data?.review.id],
    queryFn: async () => backend.techReview.listComponentParts({ techReviewId: data?.review.id! }),
    enabled: !!data?.review.id,
  });

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", product?.type],
    queryFn: async () => backend.lessonsLearnt.listByType({ productType: product?.type! }),
    enabled: !!product?.type,
  });

  const { data: allNodesData } = useQuery({
    queryKey: ["all-nodes"],
    queryFn: async () => backend.nodes.listParts(),
  });

  const { data: allErrorsData } = useQuery({
    queryKey: ["production-errors-all"],
    queryFn: async () => backend.production_errors.list(),
  });

  const openErrors = data?.errors.filter(e => e.status === "open") || [];

  const handlePhotoUpload = async (componentPartId: number, files: FileList) => {
    try {
      setUploadingPhoto(componentPartId);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = (reader.result as string).split(',')[1];
              await backend.techReview.uploadComponentPartPhoto({
                partId: componentPartId,
                filename: file.name,
                contentType: file.type,
                fileData: base64,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      toast({ title: `${files.length} nuotrauka(-os) įkelta(-os)` });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida įkeliant nuotrauką", variant: "destructive" });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleRemovePhoto = async (componentPartId: number, photoUrl: string) => {
    try {
      await backend.techReview.deleteComponentPartPhoto({
        partId: componentPartId,
        photoUrl: photoUrl,
      });
      toast({ title: "Nuotrauka ištrinta" });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida trinant nuotrauką", variant: "destructive" });
    }
  };

  const handleSavePart = async (componentPartId: number, updates: any) => {
    try {
      await backend.techReview.updateComponentPart({
        id: componentPartId,
        ...updates,
      });
      toast({ title: "Išsaugota" });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida išsaugant", variant: "destructive" });
    }
  };

  const handleDeletePart = async (componentPartId: number) => {
    if (!confirm("Ar tikrai norite ištrinti šį įrašą?")) return;
    try {
      await backend.techReview.updateComponentPart({
        id: componentPartId,
        hasDone: false,
        hasNode: false,
        hadErrors: false,
        material: null,
        finish: null,
        drawingCode: null,
        selectedNodeId: null,
        technologicalDescription: null,
        assemblyTechnology: null,
        notes: null,
        linkedErrors: [],
      });
      toast({ title: "Ištrinta" });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida ištrinant", variant: "destructive" });
    }
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
              <Badge variant="outline">{product?.productTypeName || product?.type}</Badge>
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
        <Tabs key={productTypeParts?.parts[0]?.name} defaultValue={productTypeParts?.parts[0]?.name || "errors"} className="space-y-4">
          <TabsList>
            {productTypeParts?.parts.map((part) => {
              const partCount = componentPartsData?.parts.filter(
                cp => cp.productTypePartId === part.id
              ).length || 0;
              return (
                <TabsTrigger key={part.id} value={part.name}>
                  {part.name} ({partCount})
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="errors">
              Klaidos {openErrors.length > 0 && `(${openErrors.length})`}
            </TabsTrigger>
            <TabsTrigger value="lessons">
              Lessons Learnt ({lessonsData?.lessons.length || 0})
            </TabsTrigger>
          </TabsList>

          {productTypeParts?.parts.map((part) => {
            const partComponentParts = componentPartsData?.parts.filter(
              cp => cp.productTypePartId === part.id
            ) || [];

            return (
              <TabsContent key={part.id} value={part.name} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{part.name}</h2>
                </div>

                <ComponentPartsTabContent
                  partComponentParts={partComponentParts}
                  allNodesData={allNodesData}
                  allErrorsData={allErrorsData}
                  onPhotoUpload={handlePhotoUpload}
                  onRemovePhoto={handleRemovePhoto}
                  onSavePart={handleSavePart}
                  onDeletePart={handleDeletePart}
                  uploadingPhoto={uploadingPhoto}
                />
              </TabsContent>
            );
          })}

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
