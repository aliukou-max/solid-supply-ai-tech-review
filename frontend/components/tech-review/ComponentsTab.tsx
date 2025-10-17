import React from "react";

const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { Edit2 } from "lucide-react";
import type { Component } from "~backend/tech-review/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditComponentDialog } from "./EditComponentDialog";
import { PhotoGallery } from "./PhotoGallery";

interface ComponentsTabProps {
  components: Component[];
  onUpdate: () => void;
}

export function ComponentsTab({ components, onUpdate }: ComponentsTabProps) {
  const [editingComponent, setEditingComponent] = useState(null);
  const [optimisticComponents, setOptimisticComponents] = useState(components);

  useEffect(() => {
    setOptimisticComponents(components);
  }, [components]);

  const handleOptimisticUpdate = (componentId: any, updatedData: any) => {
    setOptimisticComponents((prev: any) =>
      prev.map((c: any) => (c.id === componentId ? { ...c, ...updatedData } : c))
    );
  };

  return (
    <>
      <div className="grid gap-4">
        {optimisticComponents.map((component: any) => (
          <Card key={component.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{component.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingComponent(component)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {component.material && (
                  <div>
                    <p className="text-xs text-muted-foreground">Medžiaga</p>
                    <p className="text-sm font-medium">{component.material}</p>
                  </div>
                )}
                {component.finish && (
                  <div>
                    <p className="text-xs text-muted-foreground">Apdaila</p>
                    <p className="text-sm font-medium">{component.finish}</p>
                  </div>
                )}
                {component.color && (
                  <div>
                    <p className="text-xs text-muted-foreground">Spalva</p>
                    <p className="text-sm font-medium">{component.color}</p>
                  </div>
                )}
                {component.grainDirection && (
                  <div>
                    <p className="text-xs text-muted-foreground">Kryptis</p>
                    <p className="text-sm font-medium">{component.grainDirection}</p>
                  </div>
                )}
              </div>
              {component.technicalNotes && (
                <div className="bg-accent/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Techninis vertinimas</p>
                  <p className="text-sm">{component.technicalNotes}</p>
                </div>
              )}
              {component.assemblyNotes && (
                <div className="bg-accent/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Montavimo pastabos</p>
                  <p className="text-sm">{component.assemblyNotes}</p>
                </div>
              )}
              {component.photos && component.photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Nuotraukos ({component.photos.length})</p>
                  <PhotoGallery photos={component.photos} compact />
                </div>
              )}
              <div className="flex items-center gap-2">
                {component.nodeId && <Badge variant="outline">Mazgas: {component.nodeId}</Badge>}
                {component.photos && component.photos.length > 0 && (
                  <Badge variant="outline">{component.photos.length} nuotraukos</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingComponent && (
        <EditComponentDialog
          component={editingComponent}
          open={!!editingComponent}
          onOpenChange={(open) => !open && setEditingComponent(null)}
          onSuccess={() => {
            setEditingComponent(null);
            onUpdate();
          }}
          onOptimisticUpdate={(updatedData) => 
            handleOptimisticUpdate(editingComponent.id, updatedData)
          }
        />
      )}
    </>
  );
}
