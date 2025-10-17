import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import type { LessonLearnt } from "~backend/lessons-learnt/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LessonCardProps {
  lesson: LessonLearnt;
}

const SEVERITY_CONFIG = {
  low: { icon: Info, color: "text-blue-500", badge: "outline" },
  medium: { icon: AlertCircle, color: "text-yellow-500", badge: "secondary" },
  high: { icon: AlertTriangle, color: "text-orange-500", badge: "default" },
  critical: { icon: XCircle, color: "text-red-500", badge: "destructive" },
} as const;

export function LessonCard({ lesson }: LessonCardProps) {
  const config = SEVERITY_CONFIG[lesson.severity];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
            <div className="flex-1">
              <p className="font-medium">{lesson.errorDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.badge as any}>{lesson.severity}</Badge>
            {lesson.occurrenceCount > 1 && (
              <Badge variant="outline">{lesson.occurrenceCount}× pasikartojo</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-accent/50 rounded-md p-3">
          <p className="text-sm font-medium text-foreground mb-1">Sprendimas:</p>
          <p className="text-sm text-muted-foreground">{lesson.solution}</p>
        </div>
      </CardContent>
    </Card>
  );
}
