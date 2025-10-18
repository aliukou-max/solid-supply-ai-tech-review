// @ts-nocheck
import { Sparkles } from "lucide-react";
import type { AISuggestion } from "~backend/tech-review/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AISuggestionsCardProps {
  suggestions: AISuggestion[];
}

export function AISuggestionsCard({ suggestions }: AISuggestionsCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Pasiūlymai</CardTitle>
          <Badge variant="secondary">Naujausia analizė</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {suggestions.slice(0, 3).map((suggestion) => (
            <li key={suggestion.id} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <p className="text-sm flex-1">{suggestion.suggestion}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
