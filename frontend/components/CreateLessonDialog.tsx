import React from "react";

const useState = (React as any).useState;
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import type { ProductType } from "~backend/product/types";
import type { Severity } from "~backend/lessons-learnt/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: ProductType;
  onSuccess: () => void;
}

interface FormData {
  productType: ProductType;
  errorDescription: string;
  solution: string;
  severity: Severity;
}

const PRODUCT_TYPES: ProductType[] = ["Stalas", "Backwall", "Lightbox", "Lentyna", "Vitrina", "Kita"];
const SEVERITY_LEVELS: Severity[] = ["low", "medium", "high", "critical"];

export function CreateLessonDialog({ open, onOpenChange, defaultType, onSuccess }: CreateLessonDialogProps) {
  const { register, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: { productType: defaultType, severity: "medium" },
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.lessonsLearnt.create(data);
      toast({ title: "Pamoka išsaugota sėkmingai" });
      reset({ productType: defaultType, severity: "medium" });
      onSuccess();
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti pamokos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nauja Lesson Learnt pamoka</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Produkto tipas</Label>
              <Select
                defaultValue={defaultType}
                onValueChange={(value: any) => setValue("productType", value as ProductType)}
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
              <Label htmlFor="severity">Rimtumas</Label>
              <Select
                defaultValue="medium"
                onValueChange={(value: any) => setValue("severity", value as Severity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="errorDescription">Klaidos aprašymas</Label>
            <Textarea
              id="errorDescription"
              rows={3}
              placeholder="Aprašykite pastebėtą problemą..."
              {...register("errorDescription", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solution">Sprendimas</Label>
            <Textarea
              id="solution"
              rows={3}
              placeholder="Aprašykite kaip išspręsti problemą..."
              {...register("solution", { required: true })}
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
