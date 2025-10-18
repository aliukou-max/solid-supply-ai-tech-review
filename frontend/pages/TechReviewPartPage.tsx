import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function TechReviewPartPage() {
  const { productId, partName } = useParams<{ productId: string; partName: string }>();
  const { toast } = useToast();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => backend.product.get({ id: productId! }),
    enabled: !!productId,
  });

  const { data: techReview, refetch: refetchReview } = useQuery({
    queryKey: ["tech-review", productId],
    queryFn: async () => backend.techReview.get({ productId: productId! }),
    enabled: !!productId,
  });

  const { data: componentPartsData, refetch: refetchParts } = useQuery({
    queryKey: ["component-parts", techReview?.review.id],
    queryFn: async () => backend.techReview.listComponentParts({ techReviewId: techReview?.review.id! }),
    enabled: !!techReview?.review.id,
  });

  const partComponentParts = componentPartsData?.parts.filter(
    cp => cp.partName === decodeURIComponent(partName || '')
  ) || [];

  const handlePhotoUpload = async (componentPartId: number, file: File) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/tech-review/component-parts/${componentPartId}/photo`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      toast({ title: "Nuotrauka įkelta" });
      refetchParts();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida įkeliant nuotrauką", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
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

  if (!techReview || !componentPartsData) {
    return <div className="text-center py-12 text-muted-foreground">Kraunama...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{decodeURIComponent(partName || '')}</h2>
      </div>

      {partComponentParts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Šiai detalei dar nėra sukurtų mazgų
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {partComponentParts.map((part) => (
            <Card key={part.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{part.partName}</span>
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(part.id, file);
                        }}
                        disabled={uploadingPhoto}
                      />
                      <Button variant="outline" size="sm" disabled={uploadingPhoto} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingPhoto ? "Keliama..." : "Įkelti nuotrauką"}
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {part.photoUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={part.photoUrl}
                      alt={part.partName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`material-${part.id}`}>Medžiaga</Label>
                    <Input
                      id={`material-${part.id}`}
                      value={part.material || ''}
                      onChange={(e) => handleUpdatePart(part.id, { material: e.target.value })}
                      placeholder="Pvz.: MDF, Fanera..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`finish-${part.id}`}>Apdaila</Label>
                    <Input
                      id={`finish-${part.id}`}
                      value={part.finish || ''}
                      onChange={(e) => handleUpdatePart(part.id, { finish: e.target.value })}
                      placeholder="Pvz.: Dažyta, Laminuota..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`drawing-${part.id}`}>Brėžinio kodas</Label>
                  <Input
                    id={`drawing-${part.id}`}
                    value={part.drawingCode || ''}
                    onChange={(e) => handleUpdatePart(part.id, { drawingCode: e.target.value })}
                    placeholder="Brėžinio kodas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tech-desc-${part.id}`}>Technologinis aprašymas</Label>
                  <Textarea
                    id={`tech-desc-${part.id}`}
                    value={part.technologicalDescription || ''}
                    onChange={(e) => handleUpdatePart(part.id, { technologicalDescription: e.target.value })}
                    placeholder="Technologinis aprašymas..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`assembly-${part.id}`}>Surinkimo technologija</Label>
                  <Textarea
                    id={`assembly-${part.id}`}
                    value={part.assemblyTechnology || ''}
                    onChange={(e) => handleUpdatePart(part.id, { assemblyTechnology: e.target.value })}
                    placeholder="Surinkimo technologija..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes-${part.id}`}>Pastabos</Label>
                  <Textarea
                    id={`notes-${part.id}`}
                    value={part.notes || ''}
                    onChange={(e) => handleUpdatePart(part.id, { notes: e.target.value })}
                    placeholder="Pastabos..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`done-${part.id}`}
                      checked={part.hasDone}
                      onCheckedChange={(checked) => handleUpdatePart(part.id, { hasDone: checked })}
                    />
                    <Label htmlFor={`done-${part.id}`}>Atlikta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`node-${part.id}`}
                      checked={part.hasNode}
                      onCheckedChange={(checked) => handleUpdatePart(part.id, { hasNode: checked })}
                    />
                    <Label htmlFor={`node-${part.id}`}>Turi mazgą</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`errors-${part.id}`}
                      checked={part.hadErrors}
                      onCheckedChange={(checked) => handleUpdatePart(part.id, { hadErrors: checked })}
                    />
                    <Label htmlFor={`errors-${part.id}`}>Turėjo klaidų</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
