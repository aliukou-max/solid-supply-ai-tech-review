import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { LessonCard } from "@/components/LessonCard";

export function LessonsLearntPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: async () => backend.lessonsLearnt.list(),
  });

  return (
    <MainLayout
      title="Klaidų registro pamokos ir prevencija"
    >
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
      ) : data?.lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nėra įrašytų pamokų
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
