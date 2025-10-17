import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";

export function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => backend.project.list(),
  });

  return (
    <MainLayout
      title="Projektai"
      description="Visi Solid Supply projektai ir jų techniniai vertinimai"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Naujas projektas
        </Button>
      }
    >
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
      ) : data?.projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nėra sukurtų projektų</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Sukurti pirmą projektą
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
    </MainLayout>
  );
}
