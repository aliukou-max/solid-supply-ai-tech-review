import React from "react";

const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { useQuery } from "@tanstack/react-query";
import { Edit2, Trash2, Plus, FileSpreadsheet } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import backend from "~backend/client";
import type { Project } from "~backend/project/create";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { useToast } from "@/components/ui/use-toast";

interface ProjectStats {
  count: number;
  types: string[];
}

export function ProjectsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => backend.project.list(),
  });

  useEffect(() => {
    if (data?.projects) {
      loadAllProductStats();
    }
  }, [data?.projects]);

  const loadAllProductStats = async () => {
    if (!data?.projects) return;
    const stats: Record<string, ProjectStats> = {};
    
    for (const project of data.projects) {
      try {
        const { products } = await backend.product.listByProject({ projectId: project.id });
        const uniqueTypes = [...new Set(products.map((p: any) => p.type))];
        stats[project.id] = { count: products.length, types: uniqueTypes };
      } catch (error) {
        stats[project.id] = { count: 0, types: [] };
      }
    }
    
    setProjectStats(stats);
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Ar tikrai norite ištrinti šį projektą?')) {
      return;
    }

    try {
      await backend.project.deleteProject({ id: projectId });
      toast({ title: "Projektas ištrintas" });
      refetch();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti projekto",
        variant: "destructive",
      });
    }
  };

  const getProjectTypeColor = (projectType?: string) => {
    return projectType === 'recurring' ? 'bg-blue-500' : 'bg-amber-600';
  };

  const getProjectTypeLabel = (projectType?: string) => {
    return projectType === 'recurring' ? 'recurring' : 'new development';
  };

  return (
    <MainLayout
      title="Projektai"
      description="Visi Solid Supply projektai ir jų techniniai vertinimai"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            {/* @ts-ignore */}
            <Plus className="h-4 w-4 mr-2" />
            Pridėti projektą
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            {/* @ts-ignore */}
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importuoti Excel
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
      ) : data?.projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nėra sukurtų projektų</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.projects.map((project) => {
            const stats = projectStats[project.id] || { count: 0, types: [] };
            
            return (
              <Link 
                key={project.id}
                to={`/projects/${project.id}`}
                className="block"
              >
                <div className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-1 ${getProjectTypeColor(project.projectType)}`} />
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg">{project.id}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getProjectTypeLabel(project.projectType)}
                          </Badge>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-base mt-1">{project.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditProject(project);
                          }}
                        >
                          {/* @ts-ignore */}
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(project.id, e as any)}
                        >
                          {/* @ts-ignore */}
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {stats.count > 0 ? (
                        <div className="text-sm text-muted-foreground">
                          <p>{stats.count} {stats.count === 1 ? 'gaminys' : 'gaminiai'}</p>
                          {stats.types.length > 0 && (
                            <p className="text-xs">Tipai: {stats.types.join(', ')}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nėra gaminių</p>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.client}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
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

      <ImportExcelDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
        }}
      />
    </MainLayout>
  );
}
