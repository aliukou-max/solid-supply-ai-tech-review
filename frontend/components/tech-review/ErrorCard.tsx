import { CheckCircle, XCircle } from "lucide-react";
import type { Error as ReviewError } from "~backend/tech-review/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ErrorCardProps {
  error: ReviewError;
}

export function ErrorCard({ error }: ErrorCardProps) {
  const isResolved = error.status === "resolved";

  return (
    <Card className={isResolved ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isResolved ? (
              <CheckCircle className="h-5 w-5 mt-0.5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="font-medium">{error.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(error.createdAt).toLocaleDateString("lt-LT")}
              </p>
            </div>
          </div>
          <Badge variant={isResolved ? "secondary" : "destructive"}>
            {isResolved ? "Išspręsta" : "Aktyvi"}
          </Badge>
        </div>
      </CardHeader>
      {error.solution && (
        <CardContent>
          <div className="bg-accent/50 rounded-md p-3">
            <p className="text-sm font-medium text-foreground mb-1">Sprendimas:</p>
            <p className="text-sm text-muted-foreground">{error.solution}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
