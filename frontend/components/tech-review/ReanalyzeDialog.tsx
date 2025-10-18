import React, { useState, useEffect } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface ReanalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTypeId: string;
  onSuccess: () => void;
}

export function ReanalyzeDialog({ open, onOpenChange, productId, productTypeId, onSuccess }: ReanalyzeDialogProps) {
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [availableParts, setAvailableParts] = useState<Array<{ id: string; name: string; selected: boolean }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadParts = async () => {
      if (!open || !productTypeId) return;
      
      try {
        const { parts } = await backend.product_types.listParts({ productTypeId });
        setAvailableParts(parts.map((p: any) => ({
          id: p.id,
          name: p.name,
          selected: true
        })));
      } catch (error) {
        console.error("Failed to load parts:", error);
      }
    };

    loadParts();
  }, [open, productTypeId]);

  const togglePart = (partId: string) => {
    setAvailableParts(prev => prev.map(p => 
      p.id === partId ? { ...p, selected: !p.selected } : p
    ));
  };

  const toggleAll = () => {
    const allSelected = availableParts.every(p => p.selected);
    setAvailableParts(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast({
        title: "Klaida",
        description: "Įveskite aprašymą",
        variant: "destructive",
      });
      return;
    }

    const selectedPartIds = availableParts.filter(p => p.selected).map(p => p.id);
    if (selectedPartIds.length === 0) {
      toast({
        title: "Klaida",
        description: "Pasirinkite bent vieną dalį",
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
        selectedPartIds,
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

  const selectedCount = availableParts.filter(p => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              onChange={(e: any) => setDescription(e.target.value)}
              placeholder="Įklijuokite gaminio aprašymą iš Excel failo arba įveskite rankiniu būdu..."
              rows={6}
              className="font-mono text-sm"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              AI išanalizuos aprašymą ir automatiškai užpildys komponentų medžiagas, apdailas ir kitas detales.
            </p>
          </div>

          {availableParts.length > 0 && (
            <div className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Pasirinkite kurias dalis analizuoti ({selectedCount}/{availableParts.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                  disabled={isAnalyzing}
                >
                  {availableParts.every(p => p.selected) ? "Atžymėti visas" : "Pažymėti visas"}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {availableParts.map((part) => (
                  <div key={part.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`part-${part.id}`}
                      checked={part.selected}
                      onCheckedChange={() => togglePart(part.id)}
                      disabled={isAnalyzing}
                    />
                    <label
                      htmlFor={`part-${part.id}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      {part.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <Alert className={result.componentsUpdated > 0 ? "border-green-500 bg-green-50" : "border-amber-500 bg-amber-50"}>
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
                            <div key={idx} className="bg-white rounded p-2 text-xs border">
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
                            <p key={idx} className="text-xs text-amber-900">
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
                        <div className="bg-white rounded p-2 mt-2 max-h-60 overflow-y-auto border">
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
                disabled={!description.trim() || isAnalyzing || selectedCount === 0}
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
