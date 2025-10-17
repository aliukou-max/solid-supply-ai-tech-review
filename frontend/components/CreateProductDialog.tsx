import { useState } from "react";
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import type { ProductType } from "~backend/product/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

interface FormData {
  ssCode: string;
  name: string;
  type: ProductType;
  dimensions: string;
  hasDrawing: boolean;
  drawingReference: string;
}

const PRODUCT_TYPES: ProductType[] = ["Stalas", "Backwall", "Lightbox", "Lentyna", "Vitrina", "Kita"];

export function CreateProductDialog({ open, onOpenChange, projectId, onSuccess }: CreateProductDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: { hasDrawing: false },
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const hasDrawing = watch("hasDrawing");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.product.create({ ...data, projectId });
      toast({ title: "Gaminys sukurtas sėkmingai" });
      reset();
      onSuccess();
    } catch (error) {
      console.error("Failed to create product:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti gaminio",
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
          <DialogTitle>Naujas gaminys</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ssCode">SS kodas</Label>
            <Input
              id="ssCode"
              placeholder="pvz. F54798"
              {...register("ssCode", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Pavadinimas</Label>
            <Input
              id="name"
              placeholder="pvz. Stalas"
              {...register("name", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipas</Label>
            <Select onValueChange={(value) => setValue("type", value as ProductType)}>
              <SelectTrigger>
                <SelectValue placeholder="Pasirinkite tipą" />
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
              placeholder="pvz. 1200x800x750mm"
              {...register("dimensions")}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDrawing"
              checked={hasDrawing}
              onCheckedChange={(checked) => setValue("hasDrawing", !!checked)}
            />
            <Label htmlFor="hasDrawing" className="text-sm font-normal cursor-pointer">
              Turi brėžinį
            </Label>
          </div>
          {hasDrawing && (
            <div className="space-y-2">
              <Label htmlFor="drawingReference">Brėžinio nuoroda</Label>
              <Input
                id="drawingReference"
                placeholder="pvz. DWG-12345"
                {...register("drawingReference")}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Kuriama..." : "Sukurti"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
