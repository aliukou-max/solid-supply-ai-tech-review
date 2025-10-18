import { AlertCircle, AlertTriangle, Info, XCircle, CheckCircle, XOctagon, Sparkles, Shield } from "lucide-react";
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
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
            <div className="flex-1">
              <p className="font-medium">{lesson.errorDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lesson.productType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lesson.practiceType === "good" && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Geroji praktika
              </Badge>
            )}
            {lesson.practiceType === "bad" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                <XOctagon className="h-3 w-3 mr-1" />
                Blogoji praktika
              </Badge>
            )}
            <Badge variant={config.badge as any}>{lesson.severity}</Badge>
            {lesson.occurrenceCount > 1 && (
              <Badge variant="outline">{lesson.occurrenceCount}× pasikartojo</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-accent/50 rounded-md p-3">
          <p className="text-sm font-medium text-foreground mb-1">Sprendimas:</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lesson.solution}</p>
        </div>

        {lesson.prevention && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Prevencija:
            </p>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{lesson.prevention}</p>
          </div>
        )}

        {lesson.aiSuggestion && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p className="text-sm font-medium text-purple-900 mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI pasiūlymas:
            </p>
            <p className="text-sm text-purple-800 whitespace-pre-wrap">{lesson.aiSuggestion}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
