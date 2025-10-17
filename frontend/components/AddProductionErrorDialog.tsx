import React from "react";

const useState = (React as any).useState;
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddProductionErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  projectCode: string;
  productCode: string;
  partName: string;
  errorDescription: string;
}

export function AddProductionErrorDialog({ open, onOpenChange, onSuccess }: AddProductionErrorDialogProps) {
  const { register, handleSubmit, reset, setValue } = useForm<FormData>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partName, setPartName] = useState("");

  const { data: partsData } = useQuery({
    queryKey: ["nodes-parts"],
    queryFn: async () => backend.nodes.listParts(),
  });

  const parts = partsData?.parts || [];

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await backend.production_errors.create({
        projectCode: data.projectCode,
        productCode: data.productCode,
        partName: partName || undefined,
        errorDescription: data.errorDescription,
      });
      toast({ title: "Klaida pridėta!" });
      reset();
      setPartName("");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida pridedant įrašą", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridėti klaidą</DialogTitle>
          <DialogDescription>
            Užregistruokite naują gamybos ar montavimo klaidą
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectCode">Projekto kodas</Label>
              <Input
                id="projectCode"
                {...register("projectCode", { required: true })}
                placeholder="pvz. P-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCode">Gaminio kodas</Label>
              <Input
                id="productCode"
                {...register("productCode", { required: true })}
                placeholder="pvz. SS-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partName">Detalė (neprivaloma)</Label>
              <Select value={partName || "_none"} onValueChange={(val) => setPartName(val === "_none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite detalę..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-</SelectItem>
                  {parts.map((part) => (
                    <SelectItem key={part.partName} value={part.partName}>
                      {part.partName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="errorDescription">Klaidos aprašymas</Label>
              <Textarea
                id="errorDescription"
                {...register("errorDescription", { required: true })}
                placeholder="Aprašykite klaidą..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Pridedama..." : "Pridėti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
