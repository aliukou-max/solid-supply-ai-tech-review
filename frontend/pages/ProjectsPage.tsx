import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import type { Project } from "~backend/project/create";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";

export function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

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
        <div className="space-y-2">
          {data?.projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="w-32">
                  <Link to={`/projects/${project.id}`} className="font-medium hover:underline">
                    {project.id}
                  </Link>
                </div>
                <div className="w-48">
                  <p className="text-sm">{project.name}</p>
                </div>
                <div className="w-48">
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                <div className="w-32">
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString("lt-LT")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditProject(project)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
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

      {editProject && (
        <EditProjectDialog
          project={editProject}
          open={!!editProject}
          onOpenChange={(open) => !open && setEditProject(null)}
          onSuccess={() => {
            setEditProject(null);
            refetch();
          }}
        />
      )}
    </MainLayout>
  );
}
