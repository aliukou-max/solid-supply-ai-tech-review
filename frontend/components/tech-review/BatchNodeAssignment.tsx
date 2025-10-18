import React from "react";
const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Square, Layers, Zap, Loader2 } from "lucide-react";
import backend from "~backend/client";
import type { ComponentPart } from "~backend/tech-review/component-part-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface BatchNodeAssignmentProps {
  parts: ComponentPart[];
  productType: string;
  onAssignmentComplete: () => void;
}

interface PartSelection {
  partId: number;
  selectedNodeId: string | null;
}

export function BatchNodeAssignment({ parts, productType, onAssignmentComplete }: BatchNodeAssignmentProps) {
  const { toast } = useToast();
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Map<number, string>>(new Map());
  const [assigning, setAssigning] = useState(false);

  const unassignedParts = parts.filter(p => !p.selectedNodeId && !p.hasNode);

  const partRecommendations = useQuery({
    queryKey: ["batch-node-recommendations", unassignedParts.map(p => p.id)],
    queryFn: async () => {
      const results = await Promise.all(
        unassignedParts.map(async (part) => {
          const recommendations = await backend.nodes.recommendForPart({
            partName: part.partName,
            productType,
            material: part.material,
            finish: part.finish,
          });
          return {
            partId: part.id,
            recommendations: recommendations.recommendations,
          };
        })
      );
      return results;
    },
    enabled: unassignedParts.length > 0,
  });

  const handlePartClick = (index: number, partId: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelected = new Set(selectedParts);
      for (let i = start; i <= end; i++) {
        newSelected.add(unassignedParts[i].id);
      }
      setSelectedParts(newSelected);
    } else if (event.ctrlKey || event.metaKey) {
      const newSelected = new Set(selectedParts);
      if (newSelected.has(partId)) {
        newSelected.delete(partId);
      } else {
        newSelected.add(partId);
      }
      setSelectedParts(newSelected);
      setLastSelectedIndex(index);
    } else {
      setSelectedParts(new Set([partId]));
      setLastSelectedIndex(index);
    }
  };

  const handleSelectAll = () => {
    if (selectedParts.size === unassignedParts.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(unassignedParts.map(p => p.id)));
    }
  };

  const handleNodeSelect = (partId: number, nodeId: string) => {
    const newAssignments = new Map(assignments);
    newAssignments.set(partId, nodeId);
    setAssignments(newAssignments);
  };

  const handleAutoAssignSelected = () => {
    const newAssignments = new Map(assignments);
    selectedParts.forEach(partId => {
      const recommendations = partRecommendations.data?.find(r => r.partId === partId);
      if (recommendations && recommendations.recommendations.length > 0) {
        newAssignments.set(partId, recommendations.recommendations[0].node.id);
      }
    });
    setAssignments(newAssignments);
    toast({ title: `Auto-priskirti ${selectedParts.size} mazgai(-ų)` });
  };

  const handleBulkAssign = async () => {
    const assignmentList = Array.from(selectedParts)
      .map(partId => {
        const nodeId = assignments.get(partId);
        if (!nodeId) return null;
        return { componentPartId: partId, nodeId };
      })
      .filter(Boolean) as Array<{ componentPartId: number; nodeId: string }>;

    if (assignmentList.length === 0) {
      toast({ 
        title: "Nėra priskirtų mazgų", 
        description: "Pasirinkite mazgus pasirinktoms dalims",
        variant: "destructive" 
      });
      return;
    }

    try {
      setAssigning(true);
      await backend.techReview.bulkAssignNodes({ assignments: assignmentList });
      toast({ title: `${assignmentList.length} mazgai(-ų) priskirti` });
      setSelectedParts(new Set());
      setAssignments(new Map());
      onAssignmentComplete();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida priskiriant mazgus", variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const selectedWithAssignments = Array.from(selectedParts).filter(partId => 
    assignments.has(partId)
  ).length;

  if (unassignedParts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckSquare className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">Visos dalys turi priskirtus mazgus</h3>
          <p className="text-sm text-muted-foreground">Nėra nepriskirtų dalių šiam produktui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedParts.size === unassignedParts.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Pasirinkti visus ({unassignedParts.length})
              </Button>
              {selectedParts.size > 0 && (
                <Badge variant="secondary">
                  {selectedParts.size} pasirinkta
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedParts.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoAssignSelected}
                    disabled={partRecommendations.isLoading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-priskirti geriausius
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkAssign}
                    disabled={selectedWithAssignments === 0 || assigning}
                  >
                    {assigning ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Layers className="h-4 w-4 mr-2" />
                    )}
                    Priskirti {selectedWithAssignments > 0 ? `(${selectedWithAssignments})` : ''}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            <strong>Klaviatūros spartieji klavišai:</strong> Ctrl/Cmd + Click = multi-select | Shift + Click = intervalas
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {unassignedParts.map((part, index) => {
          const isSelected = selectedParts.has(part.id);
          const recommendations = partRecommendations.data?.find(r => r.partId === part.id)?.recommendations || [];
          const selectedNodeId = assignments.get(part.id);

          return (
            <Card 
              key={part.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary bg-accent/50' 
                  : 'hover:bg-accent/20'
              }`}
              onClick={(e) => handlePartClick(index, part.id, e)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-medium">{part.partName}</h4>
                        <div className="flex gap-2 mt-1">
                          {part.material && (
                            <Badge variant="outline" className="text-xs">
                              {part.material}
                            </Badge>
                          )}
                          {part.finish && (
                            <Badge variant="outline" className="text-xs">
                              {part.finish}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {partRecommendations.isLoading ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ieškoma rekomendacijų...
                      </div>
                    ) : recommendations.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Rekomenduojami mazgai:</p>
                        <div className="grid gap-2">
                          {recommendations.slice(0, 3).map((rec) => (
                            <button
                              key={rec.node.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNodeSelect(part.id, rec.node.id);
                              }}
                              className={`text-left p-3 rounded-md border transition-all ${
                                selectedNodeId === rec.node.id
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-card hover:bg-accent border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{rec.node.id}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {rec.node.brandName} • {rec.node.partName}
                                  </p>
                                </div>
                                <Badge 
                                  variant={rec.matchScore > 70 ? "default" : "secondary"}
                                  className="text-xs flex-shrink-0"
                                >
                                  {rec.matchScore}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nerasta rekomendacijų šiai daliai
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
