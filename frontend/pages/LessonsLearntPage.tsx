import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import type { ProductType } from "~backend/product/types";
import { MainLayout } from "@/components/MainLayout";
import { LessonCard } from "@/components/LessonCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRODUCT_TYPES: ProductType[] = ["Stalas", "Backwall", "Lightbox", "Lentyna", "Vitrina", "Kita"];

export function LessonsLearntPage() {
  const [selectedType, setSelectedType] = useState<ProductType>("Stalas");

  const { data, isLoading } = useQuery({
    queryKey: ["lessons", selectedType],
    queryFn: async () => backend.lessonsLearnt.listByType({ productType: selectedType }),
  });

  return (
    <MainLayout
      title="Mazgų biblioteka"
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
          <p className="text-muted-foreground">
            Nėra įrašytų pamokų tipui "{selectedType}"
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
