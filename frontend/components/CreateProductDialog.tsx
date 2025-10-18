import React from "react";

const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
  productTypeId: string;
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

  const { data: productTypesData } = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => backend.product_types.list(),
    enabled: open,
  });

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
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
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
            <Select onValueChange={(value: any) => setValue("type", value as ProductType)}>
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
            <Label htmlFor="productTypeId">Gaminio tipas (iš bibliotekos)</Label>
            <Select onValueChange={(value: any) => setValue("productTypeId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pasirinkite gaminio tipą" />
              </SelectTrigger>
              <SelectContent>
                {productTypesData?.productTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.name}
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
              onCheckedChange={(checked: any) => setValue("hasDrawing", !!checked)}
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
