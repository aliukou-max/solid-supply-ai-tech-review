import React from "react";
const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import type { ComponentPart } from "~backend/tech-review/component-part-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Image as ImageIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface EditComponentPartDialogProps {
  part: ComponentPart;
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditComponentPartDialog({
  part,
  productId,
  open,
  onOpenChange,
  onSuccess,
}: EditComponentPartDialogProps) {
  const [photoUrl, setPhotoUrl] = useState(part.photoUrl || "");
  const [hasDone, setHasDone] = useState(part.hasDone);
  const [hasNode, setHasNode] = useState(part.hasNode);
  const [hadErrors, setHadErrors] = useState(part.hadErrors);
  const [material, setMaterial] = useState(part.material || "");
  const [finish, setFinish] = useState(part.finish || "");
  const [notes, setNotes] = useState(part.notes || "");
  const [selectedNodeId, setSelectedNodeId] = useState(part.selectedNodeId || "");
  const [drawingCode, setDrawingCode] = useState(part.drawingCode || "");
  const [technologicalDescription, setTechnologicalDescription] = useState(part.technologicalDescription || "");
  const [assemblyTechnology, setAssemblyTechnology] = useState(part.assemblyTechnology || "");
  const [selectedErrorIds, setSelectedErrorIds] = useState<number[]>(part.linkedErrors || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: errorsData } = useQuery({
    queryKey: ["production-errors-by-product", productId],
    queryFn: async () => backend.productionErrors.listByProduct({ productId }),
    enabled: open,
  });

  const { data: nodesData } = useQuery({
    queryKey: ["nodes-by-part", part.partName],
    queryFn: async () => backend.nodes.listByPartName({ partName: part.partName }),
    enabled: open,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { url } = await backend.techReview.uploadComponentPartPhoto({
          partId: part.id,
          filename: file.name,
          contentType: file.type,
          fileData: base64,
        });

        setPhotoUrl(url);
        toast({ title: "Nuotrauka įkelta" });
        setIsUploading(false);
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        toast({
          title: "Klaida",
          description: "Nepavyko nuskaityti failo",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload photo:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti nuotraukos",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await backend.techReview.updateComponentPart({
        id: part.id,
        photoUrl: photoUrl || undefined,
        hasDone,
        hasNode,
        hadErrors,
        material: material || undefined,
        finish: finish || undefined,
        notes: notes || undefined,
        selectedNodeId: selectedNodeId || undefined,
        drawingCode: drawingCode || undefined,
        technologicalDescription: technologicalDescription || undefined,
        assemblyTechnology: assemblyTechnology || undefined,
        linkedErrorIds: selectedErrorIds,
      });

      toast({ title: "Detalė atnaujinta" });
      onSuccess();
    } catch (error) {
      console.error("Failed to update component part:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti detalės",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleError = (errorId: number) => {
    setSelectedErrorIds(prev =>
      prev.includes(errorId)
        ? prev.filter(id => id !== errorId)
        : [...prev, errorId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part.partName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Nuotrauka</Label>
            {photoUrl && (
              <div className="mb-2">
                <img src={photoUrl} alt={part.partName} className="w-full h-48 object-cover rounded" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Keliama..." : "Pridėti nuotrauką"}
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ar esame darę?</Label>
                <RadioGroup
                  value={hasDone ? "yes" : "no"}
                  onValueChange={(v) => setHasDone(v === "yes")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="done-yes" />
                    <Label htmlFor="done-yes" className="text-sm font-normal cursor-pointer">Taip</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="done-no" />
                    <Label htmlFor="done-no" className="text-sm font-normal cursor-pointer">Ne</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Ar turime mazgą?</Label>
                <RadioGroup
                  value={hasNode ? "yes" : "no"}
                  onValueChange={(v) => setHasNode(v === "yes")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="node-yes" />
                    <Label htmlFor="node-yes" className="text-sm font-normal cursor-pointer">Taip</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="node-no" />
                    <Label htmlFor="node-no" className="text-sm font-normal cursor-pointer">Ne</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Ar buvo klaidų?</Label>
                <RadioGroup
                  value={hadErrors ? "yes" : "no"}
                  onValueChange={(v) => setHadErrors(v === "yes")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="errors-yes" />
                    <Label htmlFor="errors-yes" className="text-sm font-normal cursor-pointer">Taip</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="errors-no" />
                    <Label htmlFor="errors-no" className="text-sm font-normal cursor-pointer">Ne</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Medžiaga</Label>
              <Input
                id="material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="pvz. MDF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finish">Apdaila</Label>
              <Input
                id="finish"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                placeholder="pvz. Laminuota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Pastaba</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pastabos"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mazgas</Label>
            {nodesData && nodesData.nodes.length > 0 && (
              <div className="text-sm text-muted-foreground mb-2">
                Siūlomi mazgai pagal detalę "{part.partName}":
              </div>
            )}
            <Input
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              placeholder="Mazgo ID"
            />
            {nodesData?.nodes.slice(0, 5).map((node) => (
              <Button
                key={node.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedNodeId(node.id)}
                className="mr-2 mb-2"
              >
                {node.id} - {node.brand}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="drawingCode">Mazgo kodas iš brėžinio</Label>
            <Input
              id="drawingCode"
              value={drawingCode}
              onChange={(e) => setDrawingCode(e.target.value)}
              placeholder="Kodas iš brėžinio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technologicalDescription">Technologinis aprašymas</Label>
            <Textarea
              id="technologicalDescription"
              value={technologicalDescription}
              onChange={(e) => setTechnologicalDescription(e.target.value)}
              placeholder="Technologinis aprašymas"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assemblyTechnology">Surinkimo technologija</Label>
            <Textarea
              id="assemblyTechnology"
              value={assemblyTechnology}
              onChange={(e) => setAssemblyTechnology(e.target.value)}
              placeholder="Surinkimo technologija"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Klaidų registras</Label>
            {errorsData && errorsData.errors.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                {errorsData.errors.map((error) => (
                  <div key={error.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`error-${error.id}`}
                      checked={selectedErrorIds.includes(error.id)}
                      onCheckedChange={() => toggleError(error.id)}
                    />
                    <Label
                      htmlFor={`error-${error.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {error.partName && <span className="font-medium">[{error.partName}]</span>} {error.description}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nėra klaidų šiam gaminiui</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Išsaugoma..." : "Išsaugoti"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
