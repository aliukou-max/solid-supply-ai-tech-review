// @ts-nocheck
import React from "react";
const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { Lightbulb, ExternalLink, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import backend from "~backend/client";

interface Node {
  id: string;
  productCode: string;
  brandName: string;
  partName: string;
  description: string;
  pdfUrl: string;
  productType?: string;
  createdAt: Date;
}

interface NodeRecommendation {
  node: Node;
  confidence: number;
  reason: string;
}

interface NodeRecommendationsProps {
  productId: string;
}

export function NodeRecommendations({ productId }: NodeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<NodeRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await backend.nodes.recommend({ productId });
      setRecommendations(result.recommendations);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setError("Nepavyko įkelti rekomendacijų");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecommendations();
  }, [productId]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "outline" => {
    if (confidence >= 80) return "default";
    if (confidence >= 60) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Mazgų rekomendacijos
          </CardTitle>
          <CardDescription>
            AI analizuoja produktą ir siūlo tinkamus mazgus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analizuojama...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Mazgų rekomendacijos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecommendations}
            className="mt-4"
          >
            Bandyti dar kartą
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Mazgų rekomendacijos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nerasta tinkamų mazgų rekomendacijų šiam gaminiui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Mazgų rekomendacijos
        </CardTitle>
        <CardDescription>
          AI analizė pasiūlė {recommendations.length} tinkamus mazgus pagal produkto tipą ir panašius projektus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec: NodeRecommendation, index: number) => (
          <div
            key={rec.node.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    #{index + 1}
                  </Badge>
                  <h4 className="font-semibold text-sm truncate">
                    {rec.node.brandName} - {rec.node.partName}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {rec.node.productCode}
                </p>
                {rec.node.productType && (
                  <Badge variant="secondary" className="text-xs mb-2">
                    {rec.node.productType}
                  </Badge>
                )}
                <p className="text-sm text-foreground/80 line-clamp-2">
                  {rec.node.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge
                  variant={getConfidenceBadgeVariant(rec.confidence)}
                  className="gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  {rec.confidence}%
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => window.open(rec.node.pdfUrl, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={rec.confidence} className="h-1.5" />
                <span className={`text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                  {rec.confidence}%
                </span>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground italic">
                  {rec.reason}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
