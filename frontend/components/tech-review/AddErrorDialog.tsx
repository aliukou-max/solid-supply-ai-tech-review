// @ts-nocheck
import React from "react";

const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { useForm } from "react-hook-form";
import { Sparkles, History } from "lucide-react";
import backend from "~backend/client";
import type { LessonLearnt } from "~backend/lessons-learnt/types";
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
  const { register, handleSubmit, reset, watch } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarLessons, setSimilarLessons] = useState<LessonLearnt[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  const description = watch("description");

  useEffect(() => {
    const searchSimilarLessons = async () => {
      if (!description || description.trim().length < 3 || !productType) {
        setSimilarLessons([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await backend.lessonsLearnt.searchSimilar({
          productType,
          errorDescription: description,
          limit: 3,
        });
        setSimilarLessons(result.lessons);
      } catch (error) {
        console.error("Failed to search similar lessons:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchSimilarLessons, 500);
    return () => clearTimeout(timeoutId);
  }, [description, productType]);

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
          description: data.description,
          productType,
        });
      } catch (error) {
        console.error("AI analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }

      reset();
      setSimilarLessons([]);
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
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Problemos aprašymas</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Aprašykite pastebėtą problemą ar klaidą..."
              {...register("description", { required: true })}
            />
          </div>
          
          {isSearching && (
            <div className="bg-muted/50 border border-border rounded-md p-3 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Ieškoma panašių problemų...</p>
            </div>
          )}
          
          {!isSearching && similarLessons.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 space-y-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100">
                  Panašios problemos iš praeities ({similarLessons.length})
                </h4>
              </div>
              <div className="space-y-2">
                {similarLessons.map((lesson) => (
                  <div key={lesson.id} className="bg-background border border-border rounded p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">{lesson.errorDescription}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Sprendimas:</span> {lesson.solution}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                        Pasikartojo {lesson.occurrenceCount}x
                      </span>
                      <span className="px-2 py-0.5 bg-muted rounded capitalize">
                        {lesson.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
              Rašant aprašymą, sistema automatiškai ieško panašių problemų iš praeities. Po išsaugojimo, AI analizuos ir pasiūlys papildomus sprendimus.
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
