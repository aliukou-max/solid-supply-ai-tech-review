import React from "react";
import { useForm } from "react-hook-form";
import { Upload } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  productCode: string;
  brandName: string;
  partName: string;
  description: string;
  productType: string;
}

const useState = (React as any).useState;

export function AddNodeDialog({ open, onOpenChange, onSuccess }: AddNodeDialogProps) {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (!pdfFile) {
      toast({ title: "Prašome pasirinkti PDF failą", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      await backend.nodes.create({
        productCode: data.productCode,
        brandName: data.brandName,
        partName: data.partName,
        description: data.description,
        pdfData: base64,
        pdfFilename: pdfFile.name,
        productType: data.productType || undefined,
      });

      toast({ title: "Mazgas sėkmingai pridėtas" });
      reset();
      setPdfFile(null);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida pridedant mazgą", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pridėti mazgą</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
          <div>
            <Label htmlFor="productCode">Gaminio kodas</Label>
            <Input
              id="productCode"
              {...register("productCode", { required: true })}
              placeholder="pvz. SS-2024-001"
            />
            {errors.productCode && (
              <p className="text-sm text-destructive mt-1">Privalomas laukas</p>
            )}
          </div>

          <div>
            <Label htmlFor="brandName">Brando pavadinimas</Label>
            <Input
              id="brandName"
              {...register("brandName", { required: true })}
              placeholder="pvz. IKEA"
            />
            {errors.brandName && (
              <p className="text-sm text-destructive mt-1">Privalomas laukas</p>
            )}
          </div>

          <div>
            <Label htmlFor="partName">Detalės pavadinimas</Label>
            <Input
              id="partName"
              {...register("partName", { required: true })}
              placeholder="pvz. Stalviršis"
            />
            {errors.partName && (
              <p className="text-sm text-destructive mt-1">Privalomas laukas</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Aprašymas (vienu žodžiu)</Label>
            <Input
              id="description"
              {...register("description", { required: true })}
              placeholder="pvz. Kampinis"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">Privalomas laukas</p>
            )}
          </div>

          <div>
            <Label htmlFor="productType">Gaminio tipas</Label>
            <Input
              id="productType"
              {...register("productType")}
              placeholder="pvz. Headboard, Table, Cabinet"
            />
          </div>

          <div>
            <Label htmlFor="pdf">PDF failas</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={(e: any) => setPdfFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {pdfFile && (
                <span className="text-sm text-muted-foreground">{pdfFile.name}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={uploading}>
              {/* @ts-ignore */}
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Keliama..." : "Pridėti"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
