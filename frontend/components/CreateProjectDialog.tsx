import React from "react";

const useState = (React as any).useState;
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  id: string;
  name: string;
  client: string;
  projectType: string;
}

interface ProductInput {
  tempId: string;
  ssCode: string;
  type: string;
  name: string;
}

const PRODUCT_TYPES = ["Stalas", "Backwall", "Lightbox", "Lentyna", "Vitrina", "Kita"];

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projectType, setProjectType] = useState<string>("new_development");
  const [products, setProducts] = useState<ProductInput[]>([
    { tempId: self.crypto.randomUUID(), ssCode: "", type: "Stalas", name: "" }
  ]);
  const { toast } = useToast();

  const addProduct = () => {
    setProducts([...products, { tempId: self.crypto.randomUUID(), ssCode: "", type: "Stalas", name: "" }]);
  };

  const removeProduct = (tempId: string) => {
    if (products.length === 1) {
      toast({
        title: "Klaida",
        description: "Projektas turi turėti bent vieną gaminį",
        variant: "destructive",
      });
      return;
    }
    setProducts(products.filter((p: ProductInput) => p.tempId !== tempId));
  };

  const updateProduct = (tempId: string, field: keyof ProductInput, value: string) => {
    setProducts(products.map((p: ProductInput) => 
      p.tempId === tempId ? { ...p, [field]: value } : p
    ));
  };

  const onSubmit = async (data: FormData) => {
    const invalidProducts = products.filter((p: ProductInput) => !p.ssCode.trim() || !p.name.trim());
    if (invalidProducts.length > 0) {
      toast({
        title: "Klaida",
        description: "Visi gaminiai turi turėti kodą ir pavadinimą",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await backend.project.create({ ...data, projectType });

      for (const product of products) {
        await backend.product.create({
          projectId: data.id,
          ssCode: product.ssCode,
          name: product.name,
          type: product.type as any,
          hasDrawing: false,
        });
      }

      toast({ title: "Projektas ir gaminiai sukurti sėkmingai" });
      reset();
      setProjectType("new_development");
      setProducts([{ tempId: self.crypto.randomUUID(), ssCode: "", type: "Stalas", name: "" }]);
      onSuccess();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti projekto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setProjectType("new_development");
    setProducts([{ tempId: self.crypto.randomUUID(), ssCode: "", type: "Stalas", name: "" }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Naujas projektas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Projekto kodas</Label>
              <Input
                id="id"
                placeholder="pvz. AB109999"
                {...register("id", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Projekto pavadinimas</Label>
              <Input
                id="name"
                placeholder="pvz. Parduotuvės interjeras"
                {...register("name", { required: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Klientas</Label>
              <Input
                id="client"
                placeholder="pvz. Dior"
                {...register("client", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectType">Projekto tipas</Label>
              {/* @ts-ignore */}
              <Select value={projectType} onValueChange={setProjectType}>
                {/* @ts-ignore */}
                <SelectTrigger>
                  {/* @ts-ignore */}
                  <SelectValue />
                </SelectTrigger>
                {/* @ts-ignore */}
                <SelectContent>
                  {/* @ts-ignore */}
                  <SelectItem value="new_development">New Development</SelectItem>
                  {/* @ts-ignore */}
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Gaminiai</Label>
              <Button type="button" size="sm" onClick={addProduct}>
                {/* @ts-ignore */}
                <Plus className="h-4 w-4 mr-1" />
                Pridėti gaminį
              </Button>
            </div>

            <div className="space-y-2">
              {products.map((product: ProductInput) => (
                <Card key={product.tempId} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Gaminio kodas</Label>
                        <Input
                          placeholder="pvz. SS001"
                          value={product.ssCode}
                          onChange={(e: any) => updateProduct(product.tempId, "ssCode", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Gaminio tipas</Label>
                        {/* @ts-ignore */}
                        <Select 
                          value={product.type} 
                          onValueChange={(value: string) => updateProduct(product.tempId, "type", value)}
                        >
                          {/* @ts-ignore */}
                          <SelectTrigger>
                            {/* @ts-ignore */}
                            <SelectValue />
                          </SelectTrigger>
                          {/* @ts-ignore */}
                          <SelectContent>
                            {PRODUCT_TYPES.map(type => (
                              // @ts-ignore
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Pavadinimas</Label>
                        <Input
                          placeholder="pvz. Vitrina A"
                          value={product.name}
                          onChange={(e: any) => updateProduct(product.tempId, "name", e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 shrink-0"
                      onClick={() => removeProduct(product.tempId)}
                    >
                      {/* @ts-ignore */}
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Kuriama..." : "Sukurti projektą"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
