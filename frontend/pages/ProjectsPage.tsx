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
  products: Array<{ name: string; type: string }>;
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
        stats[project.id] = { 
          products: products.map((p: any) => ({ name: p.name, type: p.type }))
        };
      } catch (error) {
        stats[project.id] = { products: [] };
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
    return projectType === 'recurring' ? 'border-l-blue-600' : 'border-l-amber-600';
  };

  const getProjectTypeLabel = (projectType?: string) => {
    return projectType === 'recurring' ? 'recurring' : 'new development';
  };

  return (
    <MainLayout
      title="Projektai"
      description="Visi Solid Supply projektai ir jų techniniai vertinimai"
      actions={
        <div className="flex gap-3">
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
        <div className="space-y-4">
          {data?.projects.map((project) => {
            const stats = projectStats[project.id] || { products: [] };
            
            return (
              <Link 
                key={project.id}
                to={`/projects/${project.id}`}
                className="block"
              >
                <div className={`bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all border-l-4 ${getProjectTypeColor(project.projectType)}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            {getProjectTypeLabel(project.projectType)}
                          </span>
                          <Badge variant="outline">
                            {project.client}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{project.id}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
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
                          size="icon"
                          onClick={(e) => handleDelete(project.id, e as any)}
                        >
                          {/* @ts-ignore */}
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {stats.products.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {stats.products.slice(0, 5).map((product, idx) => (
                            <Badge key={idx} variant="secondary">
                              {product.name}
                            </Badge>
                          ))}
                          {stats.products.length > 5 && (
                            <Badge variant="outline">
                              +{stats.products.length - 5} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nėra gaminių</p>
                      )}
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
