import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Lightbulb, Sparkles, Download, FileSpreadsheet } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TechReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [creatingParts, setCreatingParts] = useState(false);

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

  const handleCreatePartsFromDescription = async () => {
    if (!productId) return;
    
    try {
      setCreatingParts(true);
      const result = await backend.techReview.createPartsFromDescription({ productId });
      toast({ 
        title: "Dalys sukurtos", 
        description: `Sukurta ${result.partsCreated} dalių iš aprašymo` 
      });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Klaida kuriant dalis", 
        description: error instanceof Error ? error.message : "Nežinoma klaida",
        variant: "destructive" 
      });
    } finally {
      setCreatingParts(false);
    }
  };

  const handleExportPDF = async () => {
    if (!productId) return;
    
    try {
      const result = await backend.techReview.exportPDF({ productId });
      
      const bytes = atob(result.data);
      const byteNumbers = new Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        byteNumbers[i] = bytes.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "PDF atsisiųstas" });
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida atsisiunčiant PDF", variant: "destructive" });
    }
  };

  const handleExportExcel = async () => {
    if (!productId) return;
    
    try {
      const result = await backend.techReview.exportExcel({ productId });
      
      const bytes = atob(result.data);
      const byteNumbers = new Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        byteNumbers[i] = bytes.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Excel atsisiųstas" });
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida atsisiunčiant Excel", variant: "destructive" });
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
          {product?.drawingReference && (
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              {product.drawingReference}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Eksportuoti
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF ataskaita
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel failas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Aprašymas:</Label>
              <div className="flex gap-2">
                {data?.review.generalNotes && (!productTypeParts?.parts || productTypeParts.parts.length === 0) && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleCreatePartsFromDescription}
                    disabled={creatingParts}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {creatingParts ? "Kuriama..." : "Sukurti dalis iš aprašymo"}
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => setReanalyzeOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {data?.review.generalNotes ? "Redaguoti aprašymą" : "Pridėti aprašymą"}
                </Button>
              </div>
            </div>
            {data?.review.generalNotes ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.review.generalNotes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Aprašymas neįvestas. Paspauskite mygtuką viršuje norint pridėti aprašymą.
              </p>
            )}
          </div>

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

      {productId && product?.productTypeId && (
        <ReanalyzeDialog
          open={reanalyzeOpen}
          onOpenChange={setReanalyzeOpen}
          productId={productId}
          productTypeId={product.productTypeId}
          productDescription={data?.review.generalNotes}
          onSuccess={() => {
            refetchParts();
            refetch();
            setReanalyzeOpen(false);
          }}
        />
      )}
    </MainLayout>
  );
}
