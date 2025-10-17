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
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.techReview.updateComponent({ id: component.id, ...data });
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nodeId">Mazgo ID</Label>
              <Input id="nodeId" {...register("nodeId")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Nuotraukos URL</Label>
              <Input id="photoUrl" {...register("photoUrl")} />
            </div>
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
