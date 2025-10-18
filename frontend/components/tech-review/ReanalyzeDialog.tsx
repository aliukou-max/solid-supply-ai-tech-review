import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface ReanalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTypeId: string;
  productDescription?: string;
  onSuccess: () => void;
}

export function ReanalyzeDialog({ open, onOpenChange, productId, productTypeId, productDescription, onSuccess }: ReanalyzeDialogProps) {
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

    if (open && productDescription) {
      setDescription(productDescription);
    }

    loadParts();
  }, [open, productTypeId, productDescription]);

  const togglePart = (partId: string) => {
    setAvailableParts(prev => prev.map(p => 
      p.id === partId ? { ...p, selected: !p.selected } : p
    ));
  };

  const toggleAll = () => {
    const allSelected = availableParts.every(p => p.selected);
    setAvailableParts(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  const handleSave = async () => {
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

    setIsSaving(true);

    try {
      await backend.techReview.reanalyzeProduct({
        productId,
        description,
        selectedPartIds,
      });

      toast({
        title: "Išsaugota",
        description: "Aprašymas išsaugotas",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to save:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    onOpenChange(false);
  };

  const selectedCount = availableParts.filter(p => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Redaguoti aprašymą
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Aprašymas:</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              placeholder="Įklijuokite gaminio aprašymą iš Excel failo arba įveskite rankiniu būdu..."
              rows={10}
              className="font-mono text-sm"
              disabled={isSaving}
            />
          </div>

          {availableParts.length > 0 && (
            <div className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Pasirinkite kurias dalis įtraukti ({selectedCount}/{availableParts.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                  disabled={isSaving}
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
                      disabled={isSaving}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Atšaukti
            </Button>
            <Button
              onClick={handleSave}
              disabled={!description.trim() || isSaving || selectedCount === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saugoma..." : "Išsaugoti"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
