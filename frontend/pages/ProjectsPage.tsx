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
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200">
            {/* @ts-ignore */}
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Pridėti projektą
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            {/* @ts-ignore */}
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            Importuoti Excel
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Kraunama...</div>
      ) : data?.projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">Nėra sukurtų projektų</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.projects.map((project) => {
            const stats = projectStats[project.id] || { products: [] };
            
            return (
              <Link 
                key={project.id}
                to={`/projects/${project.id}`}
                className="block"
              >
                <div className={`bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-all border-l-2 ${getProjectTypeColor(project.projectType)}`}>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-slate-600 uppercase tracking-wide">
                            {getProjectTypeLabel(project.projectType)}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 border-slate-700 text-slate-400">
                            {project.client}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm text-slate-200">{project.id}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5">
                          {project.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditProject(project);
                          }}
                        >
                          {/* @ts-ignore */}
                          <Edit2 className="h-3 w-3 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => handleDelete(project.id, e as any)}
                        >
                          {/* @ts-ignore */}
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {stats.products.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {stats.products.slice(0, 5).map((product, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] h-4 bg-slate-800 text-slate-400 border-slate-700">
                              {product.name}
                            </Badge>
                          ))}
                          {stats.products.length > 5 && (
                            <Badge variant="outline" className="text-[10px] h-4 border-slate-700 text-slate-500">
                              +{stats.products.length - 5}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">Nėra gaminių</p>
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
