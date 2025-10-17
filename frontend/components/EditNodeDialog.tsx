import React from "react";

const useState = (React as any).useState;
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface EditNodeDialogProps {
  node: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  brandName: string;
  partName: string;
  description: string;
  productType: string;
}

export function EditNodeDialog({ node, open, onOpenChange, onSuccess }: EditNodeDialogProps) {
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      brandName: node.brandName || "",
      partName: node.partName || "",
      description: node.description || "",
      productType: node.productType || "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.nodes.update({ 
        id: node.id, 
        brandName: data.brandName,
        partName: data.partName,
        description: data.description,
        productCode: data.brandName,
        productType: data.productType || undefined,
      });
      toast({ title: "Mazgas atnaujintas sėkmingai" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to update node:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti mazgo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redaguoti mazgą</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brandas</Label>
            <Input id="brandName" {...register("brandName")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partName">Detalės pavadinimas</Label>
            <Input id="partName" {...register("partName")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Aprašymas</Label>
            <Textarea id="description" rows={3} {...register("description")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productType">Gaminio tipas</Label>
            <Input id="productType" {...register("productType")} placeholder="pvz. Headboard, Table, Cabinet" />
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
