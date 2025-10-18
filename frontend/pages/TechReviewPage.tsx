import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Lightbulb, Upload, X } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ErrorsTab } from "@/components/tech-review/ErrorsTab";
import { LessonsTab } from "@/components/tech-review/LessonsTab";

export function TechReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [componentPhotos, setComponentPhotos] = useState<Record<number, string[]>>({});

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
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = (reader.result as string).split(',')[1];
              const result = await backend.techReview.uploadComponentPartPhoto({
                partId: componentPartId,
                filename: file.name,
                contentType: file.type,
                fileData: base64,
              });
              uploadedUrls.push(result.url);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setComponentPhotos(prev => ({
        ...prev,
        [componentPartId]: [...(prev[componentPartId] || []), ...uploadedUrls]
      }));

      toast({ title: `${files.length} nuotrauka(-os) įkelta(-os)` });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida įkeliant nuotrauką", variant: "destructive" });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleRemovePhoto = (componentPartId: number, photoUrl: string) => {
    setComponentPhotos(prev => ({
      ...prev,
      [componentPartId]: (prev[componentPartId] || []).filter(url => url !== photoUrl)
    }));
  };

  const handleUpdatePart = async (componentPartId: number, updates: any) => {
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

                {partComponentParts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Šiai detalei dar nėra sukurtų mazgų
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {partComponentParts.map((componentPart) => (
                      <Card key={componentPart.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{componentPart.partName}</span>
                            <div className="flex gap-2">
                              <label className="cursor-pointer">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) handlePhotoUpload(componentPart.id, files);
                                  }}
                                  disabled={uploadingPhoto === componentPart.id}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={uploadingPhoto === componentPart.id} 
                                  asChild
                                >
                                  <span>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploadingPhoto === componentPart.id ? "Keliama..." : "Įkelti nuotrauką"}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {(componentPhotos[componentPart.id]?.length > 0 || componentPart.photoUrl) && (
                            <div className="grid grid-cols-3 gap-2">
                              {componentPhotos[componentPart.id]?.map((photoUrl, idx) => (
                                <div key={idx} className="relative h-32 rounded-lg overflow-hidden bg-muted group">
                                  <img src={photoUrl} alt={`${componentPart.partName} ${idx + 1}`} className="w-full h-full object-cover" />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemovePhoto(componentPart.id, photoUrl)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              {componentPart.photoUrl && !componentPhotos[componentPart.id]?.includes(componentPart.photoUrl) && (
                                <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
                                  <img src={componentPart.photoUrl} alt={componentPart.partName} className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`material-${componentPart.id}`}>Medžiaga</Label>
                              <Input
                                id={`material-${componentPart.id}`}
                                defaultValue={componentPart.material || ''}
                                onBlur={(e) => handleUpdatePart(componentPart.id, { material: e.target.value })}
                                placeholder="Pvz.: MDF, Fanera..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`finish-${componentPart.id}`}>Apdaila</Label>
                              <Input
                                id={`finish-${componentPart.id}`}
                                defaultValue={componentPart.finish || ''}
                                onBlur={(e) => handleUpdatePart(componentPart.id, { finish: e.target.value })}
                                placeholder="Pvz.: Dažyta, Laminuota..."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`drawing-${componentPart.id}`}>Brėžinio kodas</Label>
                              <Input
                                id={`drawing-${componentPart.id}`}
                                defaultValue={componentPart.drawingCode || ''}
                                onBlur={(e) => handleUpdatePart(componentPart.id, { drawingCode: e.target.value })}
                                placeholder="Brėžinio kodas"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`node-${componentPart.id}`}>Brėžinio mazgas</Label>
                              <Select
                                value={componentPart.selectedNodeId || 'none'}
                                onValueChange={(value) => handleUpdatePart(componentPart.id, { selectedNodeId: value === 'none' ? null : value })}
                              >
                                <SelectTrigger id={`node-${componentPart.id}`}>
                                  <SelectValue placeholder="Pasirinkite mazgą..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">-- Nepasirinkta --</SelectItem>
                                  {allNodesData?.nodes
                                    ?.filter(node => node.partName?.toLowerCase().includes(part.name?.toLowerCase() || ''))
                                    .map(node => (
                                      <SelectItem key={node.id} value={node.id}>
                                        {node.code} - {node.brand} ({node.productName})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`tech-desc-${componentPart.id}`}>Technologinis aprašymas</Label>
                            <Textarea
                              id={`tech-desc-${componentPart.id}`}
                              defaultValue={componentPart.technologicalDescription || ''}
                              onBlur={(e) => handleUpdatePart(componentPart.id, { technologicalDescription: e.target.value })}
                              placeholder="Technologinis aprašymas..."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`assembly-${componentPart.id}`}>Surinkimo technologija</Label>
                            <Textarea
                              id={`assembly-${componentPart.id}`}
                              defaultValue={componentPart.assemblyTechnology || ''}
                              onBlur={(e) => handleUpdatePart(componentPart.id, { assemblyTechnology: e.target.value })}
                              placeholder="Surinkimo technologija..."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`notes-${componentPart.id}`}>Pastabos</Label>
                            <Textarea
                              id={`notes-${componentPart.id}`}
                              defaultValue={componentPart.notes || ''}
                              onBlur={(e) => handleUpdatePart(componentPart.id, { notes: e.target.value })}
                              placeholder="Pastabos..."
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`done-${componentPart.id}`}
                                checked={componentPart.hasDone}
                                onCheckedChange={(checked) => handleUpdatePart(componentPart.id, { hasDone: checked })}
                              />
                              <Label htmlFor={`done-${componentPart.id}`}>Atlikta</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`has-node-${componentPart.id}`}
                                checked={componentPart.hasNode}
                                onCheckedChange={(checked) => handleUpdatePart(componentPart.id, { hasNode: checked })}
                              />
                              <Label htmlFor={`has-node-${componentPart.id}`}>Turi mazgą</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`errors-${componentPart.id}`}
                                checked={componentPart.hadErrors}
                                onCheckedChange={(checked) => handleUpdatePart(componentPart.id, { hadErrors: checked })}
                              />
                              <Label htmlFor={`errors-${componentPart.id}`}>Turėjo klaidų</Label>
                            </div>
                          </div>

                          {componentPart.hadErrors && (
                            <div className="space-y-2">
                              <Label>Susijusios klaidos</Label>
                              <Select
                                value="none"
                                onValueChange={(value) => {
                                  if (value === 'none') return;
                                  const currentErrors = componentPart.linkedErrors || [];
                                  handleUpdatePart(componentPart.id, { 
                                    linkedErrors: [...currentErrors, parseInt(value)] 
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pridėti klaidą..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {allErrorsData?.errors
                                    ?.filter(error => {
                                      const lowerDesc = error.description?.toLowerCase() || '';
                                      const productType = product?.type?.toLowerCase() || '';
                                      return lowerDesc.includes(productType) || 
                                             lowerDesc.includes('cabinet') || 
                                             lowerDesc.includes('spintele') ||
                                             lowerDesc.includes('counter');
                                    })
                                    .map(error => (
                                      <SelectItem key={error.id} value={error.id.toString()}>
                                        {error.description}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              {(componentPart.linkedErrors && componentPart.linkedErrors.length > 0) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {componentPart.linkedErrors.map(errorId => {
                                    const error = allErrorsData?.errors.find(e => e.id === errorId);
                                    return error ? (
                                      <Badge key={errorId} variant="secondary" className="gap-1">
                                        {error.description}
                                        <X 
                                          className="h-3 w-3 cursor-pointer" 
                                          onClick={() => {
                                            handleUpdatePart(componentPart.id, {
                                              linkedErrors: (componentPart.linkedErrors || []).filter(id => id !== errorId)
                                            });
                                          }}
                                        />
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
