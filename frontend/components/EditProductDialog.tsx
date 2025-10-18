// @ts-nocheck
import React from "react";
const useState = (React as any).useState;
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import type { Product, ProductType } from "~backend/product/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSuccess: () => void;
}

interface FormData {
  ssCode: string;
  name: string;
  type: ProductType;
  dimensions?: string;
  drawingReference?: string;
}

const PRODUCT_TYPES: ProductType[] = ["Stalas", "Backwall", "Lightbox", "Lentyna", "Vitrina", "Kita"];

export function EditProductDialog({ open, onOpenChange, product, onSuccess }: EditProductDialogProps) {
  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      ssCode: product.ssCode,
      name: product.name,
      type: product.type,
      dimensions: product.dimensions || "",
      drawingReference: product.drawingReference || "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType>(product.type);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.product.update({
        id: product.id,
        name: data.name,
        type: selectedType,
        dimensions: data.dimensions || undefined,
        drawingReference: data.drawingReference || undefined,
      });

      toast({ title: "Gaminys atnaujintas" });
      onSuccess();
    } catch (error) {
      console.error("Failed to update product:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti gaminio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redaguoti gaminį</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ssCode">SS kodas</Label>
            <Input
              id="ssCode"
              {...register("ssCode")}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Pavadinimas</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipas</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => {
                setSelectedType(v as ProductType);
                setValue("type", v as ProductType);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dimensions">Matmenys (neprivaloma)</Label>
            <Input
              id="dimensions"
              {...register("dimensions")}
              placeholder="pvz. 1200x800x600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drawingReference">Brėžinio nuoroda (neprivaloma)</Label>
            <Input
              id="drawingReference"
              {...register("drawingReference")}
            />
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
