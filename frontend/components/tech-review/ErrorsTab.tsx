import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles, AlertTriangle } from "lucide-react";
import backend from "~backend/client";
import type { Error as ReviewError, AISuggestion } from "~backend/tech-review/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddErrorDialog } from "./AddErrorDialog";
import { ErrorCard } from "./ErrorCard";
import { AISuggestionsCard } from "./AISuggestionsCard";

interface ErrorsTabProps {
  techReviewId: number;
  errors: ReviewError[];
  suggestions: AISuggestion[];
  productType: string;
  projectCode: string;
  productCode: string;
  onUpdate: () => void;
}

export function ErrorsTab({ techReviewId, errors, suggestions, productType, projectCode, productCode, onUpdate }: ErrorsTabProps) {
  const [addErrorOpen, setAddErrorOpen] = useState(false);

  const { data: productionErrorsData } = useQuery({
    queryKey: ["production-errors", projectCode, productCode],
    queryFn: async () => backend.production_errors.listByProduct({ projectCode, productCode }),
    enabled: !!projectCode && !!productCode,
  });

  const productionErrors = productionErrorsData?.errors || [];
  const openErrors = errors.filter(e => e.status === "open");
  const resolvedErrors = errors.filter(e => e.status === "resolved");

  return (
    <div className="space-y-6">
      {productionErrors.length > 0 && (
        <Card className="p-4 border-orange-500/50 bg-orange-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">
                Gamybos klaidos ({productionErrors.length})
              </h3>
              <div className="space-y-2">
                {productionErrors.map((error) => (
                  <div key={error.id} className="flex items-start gap-2 text-sm">
                    <Badge variant={error.isResolved ? "default" : "destructive"} className="mt-0.5 text-xs">
                      {error.isResolved ? "Išspręsta" : "Aktyvi"}
                    </Badge>
                    <p className="flex-1 text-orange-950">{error.errorDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

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
