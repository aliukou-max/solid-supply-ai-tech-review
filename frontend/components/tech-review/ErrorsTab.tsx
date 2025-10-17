import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { Error as ReviewError, AISuggestion } from "~backend/tech-review/types";
import { Button } from "@/components/ui/button";
import { AddErrorDialog } from "./AddErrorDialog";
import { ErrorCard } from "./ErrorCard";
import { AISuggestionsCard } from "./AISuggestionsCard";

interface ErrorsTabProps {
  techReviewId: number;
  errors: ReviewError[];
  suggestions: AISuggestion[];
  productType: string;
  onUpdate: () => void;
}

export function ErrorsTab({ techReviewId, errors, suggestions, productType, onUpdate }: ErrorsTabProps) {
  const [addErrorOpen, setAddErrorOpen] = useState(false);

  const openErrors = errors.filter(e => e.status === "open");
  const resolvedErrors = errors.filter(e => e.status === "resolved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Aktyvios problemos</h3>
        <Button onClick={() => setAddErrorOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Pridėti problemą
        </Button>
      </div>

      {suggestions.length > 0 && (
        <AISuggestionsCard suggestions={suggestions} />
      )}

      {openErrors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Jokių aktyvių problemų nerasta</p>
        </div>
      ) : (
        <div className="space-y-4">
          {openErrors.map((error) => (
            <ErrorCard key={error.id} error={error} />
          ))}
        </div>
      )}

      {resolvedErrors.length > 0 && (
        <>
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Išspręstos problemos</h3>
            <div className="space-y-4">
              {resolvedErrors.map((error) => (
                <ErrorCard key={error.id} error={error} />
              ))}
            </div>
          </div>
        </>
      )}

      <AddErrorDialog
        open={addErrorOpen}
        onOpenChange={setAddErrorOpen}
        techReviewId={techReviewId}
        productType={productType}
        onSuccess={() => {
          setAddErrorOpen(false);
          onUpdate();
        }}
      />
    </div>
  );
}
