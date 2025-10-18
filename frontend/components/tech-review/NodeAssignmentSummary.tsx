import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NodeAssignmentSummaryProps {
  componentParts: any[];
  onNavigateToPart: (partName: string) => void;
}

export function NodeAssignmentSummary({ componentParts, onNavigateToPart }: NodeAssignmentSummaryProps) {
  const withNodes = componentParts.filter(p => p.selectedNodeId);
  const withoutNodes = componentParts.filter(p => !p.selectedNodeId);
  const progress = componentParts.length > 0 
    ? Math.round((withNodes.length / componentParts.length) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">Mazgų priskyrimo statusas</span>
          <div className="flex items-center gap-2">
            <Badge variant={progress === 100 ? "default" : "secondary"} className="text-sm">
              {withNodes.length} / {componentParts.length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {progress}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {withNodes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-green-700 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Priskirti mazgai ({withNodes.length})
            </p>
            <div className="grid gap-1">
              {withNodes.map(part => (
                <div 
                  key={part.id} 
                  className="text-xs bg-green-50 dark:bg-green-950/20 rounded px-2 py-1 flex items-center justify-between"
                >
                  <span className="font-medium">{part.partName}</span>
                  <Badge variant="outline" className="text-xs bg-white dark:bg-background">
                    {part.selectedNodeId}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {withoutNodes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Reikia priskirti mazgus ({withoutNodes.length})
            </p>
            <div className="grid gap-1">
              {withoutNodes.map(part => (
                <Button
                  key={part.id}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1 px-2 justify-between bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                  onClick={() => onNavigateToPart(part.partName)}
                >
                  <span className="font-medium">{part.partName}</span>
                  <Sparkles className="h-3 w-3 text-amber-600" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {progress === 100 && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-green-900 dark:text-green-100">
              Visi komponentai turi priskirtus mazgus!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
