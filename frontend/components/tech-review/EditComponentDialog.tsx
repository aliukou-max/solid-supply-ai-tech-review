import { useState } from "react";
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import type { Component } from "~backend/tech-review/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X } from "lucide-react";

interface EditComponentDialogProps {
  component: Component;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  material: string;
  finish: string;
  color: string;
  grainDirection: string;
  technicalNotes: string;
  assemblyNotes: string;
  nodeId: string;
  photoUrl: string;
}

export function EditComponentDialog({ component, open, onOpenChange, onSuccess }: EditComponentDialogProps) {
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      material: component.material || "",
      finish: component.finish || "",
      color: component.color || "",
      grainDirection: component.grainDirection || "",
      technicalNotes: component.technicalNotes || "",
      assemblyNotes: component.assemblyNotes || "",
      nodeId: component.nodeId || "",
      photoUrl: component.photoUrl || "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(component.photoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Klaida",
        description: "Pasirinkite nuotraukos failą",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Klaida",
        description: "Failo dydis negali viršyti 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(",")[1];
        const response = await backend.techReview.uploadPhoto({
          fileName: file.name,
          fileData: base64Data,
          contentType: file.type,
        });
        setPhotoUrl(response.url);
        toast({ title: "Nuotrauka įkelta sėkmingai" });
      } catch (error) {
        console.error("Failed to upload photo:", error);
        toast({
          title: "Klaida",
          description: "Nepavyko įkelti nuotraukos",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      console.error("Failed to read file:", reader.error);
      toast({
        title: "Klaida",
        description: "Nepavyko nuskaityti failo",
        variant: "destructive",
      });
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.techReview.updateComponent({ id: component.id, ...data, photoUrl });
      toast({ title: "Komponentas atnaujintas sėkmingai" });
      onSuccess();
    } catch (error) {
      console.error("Failed to update component:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti komponento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redaguoti: {component.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Medžiaga</Label>
              <Input id="material" {...register("material")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finish">Apdaila</Label>
              <Input id="finish" {...register("finish")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Spalva</Label>
              <Input id="color" {...register("color")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grainDirection">Kryptis</Label>
              <Input id="grainDirection" {...register("grainDirection")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="technicalNotes">Techninis vertinimas</Label>
            <Textarea id="technicalNotes" rows={3} {...register("technicalNotes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assemblyNotes">Montavimo pastabos</Label>
            <Textarea id="assemblyNotes" rows={3} {...register("assemblyNotes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nodeId">Mazgo ID</Label>
            <Input id="nodeId" {...register("nodeId")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Komponento nuotrauka</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Maksimalus dydis: 10MB. Palaikomi formatai: JPG, PNG, WebP
                </p>
              </div>
              {photoUrl && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setPhotoUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4 animate-pulse" />
                <span>Įkeliama...</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saugoma..." : "Išsaugoti"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
