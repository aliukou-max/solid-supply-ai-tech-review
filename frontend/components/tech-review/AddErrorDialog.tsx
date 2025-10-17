import { useState } from "react";
import { useForm } from "react-hook-form";
import { Sparkles } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface AddErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  techReviewId: number;
  productType: string;
  onSuccess: () => void;
}

interface FormData {
  description: string;
  solution: string;
}

export function AddErrorDialog({ open, onOpenChange, techReviewId, productType, onSuccess }: AddErrorDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.techReview.addError({
        techReviewId,
        description: data.description,
        solution: data.solution || undefined,
      });

      toast({ title: "Problema užregistruota sėkmingai" });

      // Trigger AI analysis
      setIsAnalyzing(true);
      try {
        await backend.aiAnalysis.analyze({
          techReviewId,
          errorDescription: data.description,
          productType,
        });
      } catch (error) {
        console.error("AI analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }

      reset();
      onSuccess();
    } catch (error) {
      console.error("Failed to add error:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko užregistruoti problemos",
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
          <DialogTitle>Naujos problemos registracija</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Problemos aprašymas</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Aprašykite pastebėtą problemą ar klaidą..."
              {...register("description", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solution">Sprendimas (neprivaloma)</Label>
            <Textarea
              id="solution"
              rows={3}
              placeholder="Jei žinote sprendimą, aprašykite jį čia..."
              {...register("solution")}
            />
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Po problemos išsaugojimo, AI automatiškai analizuos ją ir pasiūlys sprendimus pagal Lessons Learnt bazę
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={isLoading || isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  AI analizuoja...
                </>
              ) : isLoading ? (
                "Saugoma..."
              ) : (
                "Išsaugoti"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
