import React from "react";
const useState = (React as any).useState;
import { useQuery, useMutation } from "@tanstack/react-query";
import backend from "~backend/client";
import type { ProductionError } from "~backend/production-errors/types";
import type { PracticeType } from "~backend/lessons-learnt/types";
import { MainLayout } from "@/components/MainLayout";
import { LessonCard } from "@/components/LessonCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Lightbulb, Plus, Sparkles, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LessonsLearntPage() {
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [solution, setSolution] = useState("");
  const [prevention, setPrevention] = useState("");
  const [practiceType, setPracticeType] = useState<PracticeType | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [filterType, setFilterType] = useState<PracticeType | "all">("all");
  const { toast } = useToast();

  const { data: errorsData } = useQuery({
    queryKey: ["production-errors"],
    queryFn: async () => backend.productionErrors.list(),
  });

  const { data: lessonsData, refetch: refetchLessons } = useQuery({
    queryKey: ["lessons", filterType],
    queryFn: async () => backend.lessonsLearnt.list({ practiceType: filterType }),
  });

  const selectedError = errorsData?.errors.find(e => e.id === selectedErrorId);

  const { mutate: generateAISuggestion, isPending: isGenerating } = useMutation({
    mutationFn: async (errorId: number) => {
      const error = errorsData?.errors.find(e => e.id === errorId);
      if (!error) throw new Error("Error not found");

      return backend.lessonsLearnt.suggestAISolution({
        errorType: "Production Error",
        errorDescription: error.errorDescription,
        partName: error.partName,
        projectName: error.projectCode,
      });
    },
    onSuccess: (data) => {
      setSolution(data.suggestion);
      setPrevention(data.prevention);
      setAiSuggestion(`${data.suggestion}\n\nPrevention:\n${data.prevention}`);
      toast({ title: "AI pasiūlymas gautas", description: "Sprendimas ir prevencija užpildyti automatiškai" });
    },
    onError: (error) => {
      console.error("AI suggestion error:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko gauti AI pasiūlymo",
        variant: "destructive",
      });
    },
  });

  const { mutate: saveLesson, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!selectedError) throw new Error("No error selected");
      if (!solution) throw new Error("Solution is required");

      return backend.lessonsLearnt.create({
        productType: "Kita",
        errorDescription: selectedError.errorDescription,
        solution,
        prevention,
        aiSuggestion,
        practiceType: practiceType || undefined,
        errorId: selectedErrorId || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Pamoka išsaugota sėkmingai" });
      setSelectedErrorId(null);
      setSolution("");
      setPrevention("");
      setAiSuggestion("");
      setPracticeType(null);
      refetchLessons();
    },
    onError: (error) => {
      console.error("Save lesson error:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti pamokos",
        variant: "destructive",
      });
    },
  });

  const handleErrorSelect = (errorId: string) => {
    const id = errorId === "" ? null : parseInt(errorId);
    setSelectedErrorId(id);
    setSolution("");
    setPrevention("");
    setAiSuggestion("");
    setPracticeType(null);
  };

  const handleGenerateAI = () => {
    if (selectedErrorId) {
      generateAISuggestion(selectedErrorId);
    }
  };

  return (
    <MainLayout title="Pamokos (Lessons Learned)">
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              Nauja Pamoka
            </CardTitle>
            <CardDescription>
              Sukurkite pamokų įrašą iš gamybos klaidų registro su AI pagalba
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="error-select">1. Pasirinkite klaidą</Label>
              <Select value={selectedErrorId?.toString() || ""} onValueChange={handleErrorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite klaidą iš registro..." />
                </SelectTrigger>
                <SelectContent>
                  {errorsData?.errors.map((error) => (
                    <SelectItem key={error.id} value={error.id.toString()}>
                      {error.projectCode} - {error.productCode} - {error.errorDescription.slice(0, 60)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedError && (
              <>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pasirinkta klaida</p>
                      <p className="text-sm text-muted-foreground">{selectedError.errorDescription}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedError.projectCode} → {selectedError.productCode}
                        {selectedError.partName && ` → ${selectedError.partName}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generuojama..." : "Gauti AI pasiūlymą"}
                  </Button>
                </div>

                {aiSuggestion && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI pasiūlymas
                    </p>
                    <p className="text-sm text-purple-800 whitespace-pre-wrap">{aiSuggestion}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="solution">2. Sprendimas</Label>
                  <Textarea
                    id="solution"
                    rows={4}
                    placeholder="Kaip buvo išspręsta problema..."
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prevention">3. Prevencija</Label>
                  <Textarea
                    id="prevention"
                    rows={4}
                    placeholder="Kaip išvengti šios problemos ateityje..."
                    value={prevention}
                    onChange={(e) => setPrevention(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>4. Praktikos tipas</Label>
                  <RadioGroup
                    value={practiceType || ""}
                    onValueChange={(value) => setPracticeType(value as PracticeType)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="good" />
                      <Label htmlFor="good" className="font-normal cursor-pointer">
                        ✅ Geroji praktika
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bad" id="bad" />
                      <Label htmlFor="bad" className="font-normal cursor-pointer">
                        ❌ Blogoji praktika
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedErrorId(null);
                      setSolution("");
                      setPrevention("");
                      setAiSuggestion("");
                      setPracticeType(null);
                    }}
                  >
                    Atšaukti
                  </Button>
                  <Button
                    onClick={() => saveLesson()}
                    disabled={isSaving || !solution}
                  >
                    {isSaving ? "Saugoma..." : "Išsaugoti pamoką"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
           
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visos</SelectItem>
                  <SelectItem value="good">✅ Gerosios praktikos</SelectItem>
                  <SelectItem value="bad">❌ Blogosios praktikos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {lessonsData?.lessons.length === 0 ? (
           
          ) : (
            <div className="space-y-4">
              {lessonsData?.lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
