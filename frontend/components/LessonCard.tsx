// @ts-nocheck
import { AlertCircle, AlertTriangle, Info, XCircle, CheckCircle, XOctagon } from "lucide-react";
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
    <Card className={
      lesson.practiceType === "good" 
        ? "border-green-200 bg-green-50/30" 
        : lesson.practiceType === "bad" 
        ? "border-red-200 bg-red-50/30" 
        : ""
    }>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-base">{lesson.errorDescription}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {lesson.practiceType === "good" && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Geroji praktika
              </Badge>
            )}
            {lesson.practiceType === "bad" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                <XOctagon className="h-3 w-3 mr-1" />
                Blogoji praktika
              </Badge>
            )}
            <Badge variant={config.badge as any} className="text-xs">{lesson.severity}</Badge>
            {lesson.occurrenceCount > 1 && (
              <Badge variant="outline" className="text-xs">{lesson.occurrenceCount}×</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <p className="text-xs text-muted-foreground">
            {lesson.productType}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-accent/50 rounded-md p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Sprendimas:</p>
          <p className="text-sm whitespace-pre-wrap">{lesson.solution}</p>
        </div>
      </CardContent>
    </Card>
  );
}
