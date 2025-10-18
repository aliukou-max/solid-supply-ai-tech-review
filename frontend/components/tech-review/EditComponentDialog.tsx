import React from "react";

const useState = (React as any).useState;
const useRef = (React as any).useRef;
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import type { Component, ComponentPhoto } from "~backend/tech-review/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, FolderUp } from "lucide-react";

interface EditComponentDialogProps {
  component: Component;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onOptimisticUpdate?: (updatedData: Partial<Component>) => void;
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

export function EditComponentDialog({ component, open, onOpenChange, onSuccess, onOptimisticUpdate }: EditComponentDialogProps) {
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
  const [photoGallery, setPhotoGallery] = useState<ComponentPhoto[]>(component.photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadPhotos = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Klaida",
        description: "Pasirinkite nuotraukos failus",
        variant: "destructive",
      });
      return;
    }

    const oversizedFiles = imageFiles.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Klaida",
        description: `${oversizedFiles.length} failų viršija 10MB limitą`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of imageFiles) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const response = await backend.techReview.uploadPhoto({
          fileName: file.name,
          fileData: base64Data,
          contentType: file.type,
        });
        uploadedUrls.push(response.url);
      }

      await backend.techReview.addPhotos({
        componentId: component.id,
        photoUrls: uploadedUrls,
      });

      toast({ 
        title: `${imageFiles.length} ${imageFiles.length === 1 ? 'nuotrauka įkelta' : 'nuotraukos įkeltos'} sėkmingai` 
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to upload photos:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti nuotraukų",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadPhotos(Array.from(files));
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files: File[] = [];
    
    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items as any);
      for (const item of items) {
        if ((item as any).kind === "file") {
          const file = (item as any).getAsFile();
          if (file) files.push(file as File);
        }
      }
    } else {
      files.push(...Array.from(e.dataTransfer.files as any));
    }

    if (files.length > 0) {
      await uploadPhotos(files);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await backend.techReview.deletePhoto({ photoId });
      toast({ title: "Nuotrauka ištrinta" });
      onSuccess();
    } catch (error) {
      console.error("Failed to delete photo:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti nuotraukos",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    const updateData = { ...data, photoUrl };
    
    setIsLoading(true);
    
    try {
      await backend.techReview.updateComponent({ id: component.id, ...updateData });
      toast({ title: "Komponentas atnaujintas sėkmingai" });
      onSuccess();
      onOpenChange(false);
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
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
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
            <Label>Nuotraukų galerija</Label>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3">
                <FolderUp className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Vilkite ir paleiskite nuotraukas čia
                  </p>
                  <p className="text-xs text-muted-foreground">
                    arba
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Pasirinkti failus
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Maksimalus dydis vienai nuotraukai: 10MB
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center p-4">
                <Upload className="h-4 w-4 animate-pulse" />
                <span>Įkeliama...</span>
              </div>
            )}

            {photoGallery.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {photoGallery.map((photo: any) => (
                  <div key={photo.id} className="relative aspect-square border rounded-lg overflow-hidden group">
                    <img 
                      src={photo.photoUrl} 
                      alt={`Photo ${photo.displayOrder + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
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
