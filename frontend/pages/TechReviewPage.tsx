import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Lightbulb, Sparkles } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ErrorsTab } from "@/components/tech-review/ErrorsTab";
import { LessonsTab } from "@/components/tech-review/LessonsTab";
import { ComponentPartsTabContent } from "@/components/tech-review/ComponentPartsTabContent";
import { ReanalyzeDialog } from "@/components/tech-review/ReanalyzeDialog";
import { NodeAssignmentSummary } from "@/components/tech-review/NodeAssignmentSummary";

export function TechReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

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
    queryFn: async () => backend.nodes.listAll(),
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
          <Button variant="outline" onClick={() => setReanalyzeOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI analizė
          </Button>
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
      ) : !productTypeParts?.parts || productTypeParts.parts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Šis gaminio tipas neturi apibrėžtų dalių.</p>
          <p className="text-sm text-muted-foreground">Pridėkite dalis gaminio tipo nustatymuose.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {product?.name && (
            <div className="bg-muted/50 rounded-lg p-4">
              <Label className="text-sm font-medium mb-2 block">Gaminio aprašymas</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.name}
              </p>
            </div>
          )}

          <Tabs 
            key={productTypeParts?.parts[0]?.name} 
            value={activeTab || productTypeParts?.parts[0]?.name || "errors"}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="w-full justify-start h-auto flex-wrap">
              {productTypeParts?.parts.map((part) => {
                return (
                  <TabsTrigger key={part.id} value={part.name}>
                    {part.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div>
            {productTypeParts?.parts.map((part) => {
              const partComponentParts = componentPartsData?.parts.filter(
                cp => cp.productTypePartId === part.id
              ) || [];

              return (
                <TabsContent key={part.id} value={part.name} className="space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{part.name}</h2>
                  </div>

                  <ComponentPartsTabContent
                    partComponentParts={partComponentParts}
                    allNodesData={allNodesData}
                    allErrorsData={allErrorsData}
                    productType={product?.type || ""}
                    onPhotoUpload={handlePhotoUpload}
                    onRemovePhoto={handleRemovePhoto}
                    onSavePart={handleSavePart}
                    onDeletePart={handleDeletePart}
                    uploadingPhoto={uploadingPhoto}
                  />
                </TabsContent>
              );
            })}
            </div>
          </Tabs>
        </div>
      )}

      {productId && (
        <ReanalyzeDialog
          open={reanalyzeOpen}
          onOpenChange={setReanalyzeOpen}
          productId={productId}
          onSuccess={() => {
            refetchParts();
            setReanalyzeOpen(false);
          }}
        />
      )}
    </MainLayout>
  );
}
