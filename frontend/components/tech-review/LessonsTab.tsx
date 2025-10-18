// @ts-nocheck
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { LessonLearnt } from "~backend/lessons-learnt/types";
import { Button } from "@/components/ui/button";
import { LessonCard } from "../LessonCard";

interface LessonsTabProps {
  productType: string;
  lessons: LessonLearnt[];
}

export function LessonsTab({ productType, lessons }: LessonsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lessons Learnt – {productType}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Panašios klaidos ir sprendimai iš ankstesnių projektų
          </p>
        </div>
        <Link to="/lessons-learnt">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Visa bazė
          </Button>
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            Nėra įrašytų pamokų tipui "{productType}"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
