import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import backend from "~backend/client";
import type { ProductType } from "~backend/product/types";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { CreateLessonDialog } from "@/components/CreateLessonDialog";
import { LessonCard } from "@/components/LessonCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRODUCT_TYPES: ProductType[] = ["Stalas", "Backwall", "Lightbox", "Lentyna", "Vitrina", "Kita"];

export function LessonsLearntPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType>("Stalas");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lessons", selectedType],
    queryFn: async () => backend.lessonsLearnt.listByType({ productType: selectedType }),
  });

  return (
    <MainLayout
      title={
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6" />
          <span>Lessons Learnt</span>
        </div>
      }
      description="Solid Supply techninių žinių bazė – pasikartojančios klaidos ir sprendimai"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nauja pamoka
        </Button>
      }
    >
      <div className="mb-6">
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ProductType)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
      ) : data?.lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nėra įrašytų pamokų tipui "{selectedType}"
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Sukurti pirmą pamoką
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}

      <CreateLessonDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType={selectedType}
        onSuccess={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
    </MainLayout>
  );
}
