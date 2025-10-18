import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Edit2, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function LessonsLearntPage() {
  const [practiceType, setPracticeType] = useState<'good' | 'bad'>('good');
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [solution, setSolution] = useState('');
  const [editingSolutionId, setEditingSolutionId] = useState<number | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const { toast } = useToast();

  const { data: errorsData } = useQuery({
    queryKey: ["all-errors"],
    queryFn: async () => backend.production_errors.list(),
  });

  const { data: solutionsData, refetch: refetchSolutions } = useQuery({
    queryKey: ["error-solutions", selectedErrorId],
    queryFn: async () => {
      if (!selectedErrorId) return { solutions: [] };
      return backend.error_solutions.list({ errorId: selectedErrorId });
    },
    enabled: !!selectedErrorId,
  });

  const handleGenerateAI = async () => {
    if (!selectedErrorId) return;
    const error = errorsData?.errors.find(e => e.id === selectedErrorId);
    if (!error) return;

    setGeneratingAI(true);
    try {
      const result = await backend.aiAnalysis.analyze({
        context: `Error: ${error.errorDescription}\nProject: ${error.projectCode}\nProduct: ${error.productCode}`,
        prompt: "Suggest 3 specific solutions to prevent this manufacturing error from happening again. Be concise and actionable.",
      });
      setSolution(result.analysis);
      toast({ title: "AI sprendimai sugeneruoti" });
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida generuojant sprendimus", variant: "destructive" });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveSolution = async () => {
    if (!selectedErrorId || !solution.trim()) return;
    
    try {
      if (editingSolutionId) {
        await backend.error_solutions.update({
          id: editingSolutionId,
          solution: solution,
          practiceType: practiceType,
        });
        toast({ title: "Sprendimas atnaujintas" });
        setEditingSolutionId(null);
      } else {
        await backend.error_solutions.create({
          errorId: selectedErrorId,
          solution: solution,
          practiceType: practiceType,
        });
        toast({ title: "Sprendimas išsaugotas" });
      }
      setSolution('');
      refetchSolutions();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida išsaugant", variant: "destructive" });
    }
  };

  const handleDelete = async (solutionId: number) => {
    if (!confirm('Ar tikrai norite ištrinti šį sprendimą?')) return;
    
    try {
      await backend.error_solutions.delete_({ id: solutionId });
      toast({ title: "Sprendimas ištrintas" });
      refetchSolutions();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida trinant", variant: "destructive" });
    }
  };

  const handleEdit = (sol: any) => {
    setEditingSolutionId(sol.id);
    setSolution(sol.solution);
    setPracticeType(sol.practiceType);
  };

  return (
    <MainLayout title="Klaidų registro pamokos ir prevencija">
      <div className="space-y-6">
        <div className="flex gap-4">
          <Button
            variant={practiceType === 'good' ? 'default' : 'outline'}
            onClick={() => setPracticeType('good')}
          >
            Geroji praktika
          </Button>
          <Button
            variant={practiceType === 'bad' ? 'default' : 'outline'}
            onClick={() => setPracticeType('bad')}
          >
            Blogoji praktika
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pasirinkite klaidą</label>
          <Select
            value={selectedErrorId?.toString() || ''}
            onValueChange={(value) => {
              setSelectedErrorId(value ? parseInt(value) : null);
              setSolution('');
              setEditingSolutionId(null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pasirinkite klaidą iš registro..." />
            </SelectTrigger>
            <SelectContent>
              {errorsData?.errors.map((error) => (
                <SelectItem key={error.id} value={error.id.toString()}>
                  {error.errorDescription} ({error.projectCode} - {error.productCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedErrorId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Naujas sprendimas</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generatingAI ? 'Generuojama...' : 'Tech AI sprendimai'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Įrašykite sprendimą arba sugeneruokite su Tech AI..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={6}
              />
              <div className="flex justify-end gap-2">
                {editingSolutionId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSolutionId(null);
                      setSolution('');
                    }}
                  >
                    Atšaukti
                  </Button>
                )}
                <Button onClick={handleSaveSolution} disabled={!solution.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingSolutionId ? 'Atnaujinti' : 'Išsaugoti'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedErrorId && solutionsData && solutionsData.solutions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Išsaugoti sprendimai</h3>
            {solutionsData.solutions.map((sol) => (
              <Card key={sol.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={sol.practiceType === 'good' ? 'default' : 'destructive'}>
                        {sol.practiceType === 'good' ? 'Geroji praktika' : 'Blogoji praktika'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(sol)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sol.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{sol.solution}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sukurta: {new Date(sol.createdAt).toLocaleDateString('lt-LT')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
