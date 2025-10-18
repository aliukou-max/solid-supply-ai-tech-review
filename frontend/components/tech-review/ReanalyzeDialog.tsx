import React, { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface ReanalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onSuccess: () => void;
}

export function ReanalyzeDialog({ open, onOpenChange, productId, onSuccess }: ReanalyzeDialogProps) {
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast({
        title: "Klaida",
        description: "Įveskite aprašymą",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await backend.techReview.reanalyzeProduct({
        productId,
        description,
      });

      setResult(response);

      toast({
        title: "AI analizė baigta",
        description: `Atnaujinta ${response.componentsUpdated} komponentų`,
      });

      if (response.componentsUpdated > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to reanalyze:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atlikti AI analizės",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI analizė
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Gaminio aprašymas</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Įklijuokite gaminio aprašymą iš Excel failo arba įveskite rankiniu būdu..."
              rows={8}
              className="font-mono text-sm"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              AI išanalizuos aprašymą ir automatiškai užpildys komponentų medžiagas, apdailas ir kitas detales.
            </p>
          </div>

          {result && (
            <div className="space-y-3">
              <Alert className={result.componentsUpdated > 0 ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-amber-500 bg-amber-50 dark:bg-amber-950/20"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {result.componentsUpdated > 0 ? (
                        <span className="text-green-600 font-medium">
                          ✓ Atnaujinta {result.componentsUpdated} komponentų
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          ⚠ Komponentai neatnaujinti
                        </span>
                      )}
                    </div>
                    
                    {result.components && result.components.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-2">Rasti komponentai:</p>
                        <div className="space-y-2">
                          {result.components.map((comp: any, idx: number) => (
                            <div key={idx} className="bg-background rounded p-2 text-xs border">
                              <div className="font-medium">{comp.name}</div>
                              {comp.material && <div>Medžiaga: {comp.material}</div>}
                              {comp.finish && <div>Apdaila: {comp.finish}</div>}
                              {comp.other && <div className="text-muted-foreground">{comp.other}</div>}
                              {comp.uncertainTerms && comp.uncertainTerms.length > 0 && (
                                <div className="text-amber-600">⚠ {comp.uncertainTerms.join(", ")}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1">Perspėjimai:</p>
                        <div className="space-y-1">
                          {result.warnings.map((warning: string, idx: number) => (
                            <p key={idx} className="text-xs text-amber-900 dark:text-amber-100">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.aiResponse && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Rodyti AI atsakymą
                        </summary>
                        <div className="bg-background rounded p-2 mt-2 max-h-60 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {result.aiResponse}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              {result ? "Uždaryti" : "Atšaukti"}
            </Button>
            {!result && (
              <Button
                onClick={handleAnalyze}
                disabled={!description.trim() || isAnalyzing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analizuojama..." : "Analizuoti su AI"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
