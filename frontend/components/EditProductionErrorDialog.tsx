import React from "react";

const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import type { ProductionError } from "~backend/production-errors/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditProductionErrorDialogProps {
  error: ProductionError;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  projectCode: string;
  productCode: string;
  errorDescription: string;
  isResolved: boolean;
}

export function EditProductionErrorDialog({ error, open, onOpenChange, onSuccess }: EditProductionErrorDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      projectCode: error.projectCode,
      productCode: error.productCode,
      errorDescription: error.errorDescription,
      isResolved: error.isResolved,
    },
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isResolved = watch("isResolved");

  useEffect(() => {
    if (open) {
      reset({
        projectCode: error.projectCode,
        productCode: error.productCode,
        errorDescription: error.errorDescription,
        isResolved: error.isResolved,
      });
    }
  }, [open, error, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await backend.production_errors.update({
        id: error.id,
        projectCode: data.projectCode,
        productCode: data.productCode,
        errorDescription: data.errorDescription,
        isResolved: data.isResolved,
      });
      toast({ title: "Klaida atnaujinta!" });
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida atnaujinant įrašą", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redaguoti klaidą</DialogTitle>
          <DialogDescription>
            Atnaujinkite klaidos informaciją
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
              <Label htmlFor="errorDescription">Klaidos aprašymas</Label>
              <Textarea
                id="errorDescription"
                {...register("errorDescription", { required: true })}
                placeholder="Aprašykite klaidą..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isResolved"
                checked={isResolved}
                onCheckedChange={(checked: any) => setValue("isResolved", checked as boolean)}
              />
              <Label htmlFor="isResolved" className="cursor-pointer">
                Klaida išspręsta
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saugoma..." : "Išsaugoti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
