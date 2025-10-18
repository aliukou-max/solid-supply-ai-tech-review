import React from "react";
const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Edit2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import type { ComponentPart } from "~backend/tech-review/component-part-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditComponentPartDialog } from "./EditComponentPartDialog";

interface ComponentPartsTabProps {
  techReviewId: number;
  productId: string;
  onUpdate: () => void;
}

export function ComponentPartsTab({ techReviewId, productId, onUpdate }: ComponentPartsTabProps) {
  const [editingPart, setEditingPart] = useState<ComponentPart | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["component-parts", techReviewId],
    queryFn: async () => backend.techReview.listComponentParts({ techReviewId }),
  });

  const handleSuccess = () => {
    refetch();
    onUpdate();
  };

  return (
    <>
      <div className="grid gap-4">
        {data?.parts.map((part) => (
          <Card key={part.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{part.partName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPart(part)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {part.photoUrl && (
                <div>
                  <img src={part.photoUrl} alt={part.partName} className="w-full h-48 object-cover rounded" />
                </div>
              )}

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  {part.hasDone ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={part.hasDone ? "text-green-600" : "text-muted-foreground"}>
                    Esame darę
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {part.hasNode ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={part.hasNode ? "text-green-600" : "text-muted-foreground"}>
                    Turime mazgą
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {part.hadErrors ? (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className={part.hadErrors ? "text-amber-600" : "text-green-600"}>
                    {part.hadErrors ? "Buvo klaidų" : "Be klaidų"}
                  </span>
                </div>
              </div>

              {(part.material || part.finish || part.notes) && (
                <div className="grid grid-cols-3 gap-3">
                  {part.material && (
                    <div>
                      <p className="text-xs text-muted-foreground">Medžiaga</p>
                      <p className="text-sm font-medium">{part.material}</p>
                    </div>
                  )}
                  {part.finish && (
                    <div>
                      <p className="text-xs text-muted-foreground">Apdaila</p>
                      <p className="text-sm font-medium">{part.finish}</p>
                    </div>
                  )}
                  {part.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Pastaba</p>
                      <p className="text-sm font-medium">{part.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {part.selectedNodeId && (
                <div className="bg-accent/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Mazgas</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{part.selectedNodeId}</p>
                    {part.drawingCode && (
                      <Badge variant="outline">Brėžinio kodas: {part.drawingCode}</Badge>
                    )}
                  </div>
                </div>
              )}

              {part.technologicalDescription && (
                <div className="bg-accent/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Technologinis aprašymas</p>
                  <p className="text-sm">{part.technologicalDescription}</p>
                </div>
              )}

              {part.assemblyTechnology && (
                <div className="bg-accent/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Surinkimo technologija</p>
                  <p className="text-sm">{part.assemblyTechnology}</p>
                </div>
              )}

              {part.linkedErrors && part.linkedErrors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Susijusios klaidos</p>
                  <div className="flex flex-wrap gap-1">
                    {part.linkedErrors.map((errorId) => (
                      <Badge key={errorId} variant="destructive" className="text-xs">
                        Klaida #{errorId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!data || data.parts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nėra detalių. Pasirinkite gaminio tipą kuriant gaminį, kad automatiškai būtų sukurtos detalės.
            </p>
          </div>
        )}
      </div>

      {editingPart && (
        <EditComponentPartDialog
          part={editingPart}
          productId={productId}
          open={!!editingPart}
          onOpenChange={(open) => !open && setEditingPart(null)}
          onSuccess={() => {
            setEditingPart(null);
            handleSuccess();
          }}
        />
      )}
    </>
  );
}
