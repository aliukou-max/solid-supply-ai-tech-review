import React from "react";
const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import { Link } from "react-router-dom";
import { Folder, Calendar, Edit2 } from "lucide-react";
import type { Project } from "~backend/project/create";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const [productStats, setProductStats] = useState<{count: number, typeNames: string[]}>({ count: 0, typeNames: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProductStats();
  }, [project.id]);

  const loadProductStats = async () => {
    try {
      const { products } = await backend.product.listByProject({ projectId: project.id });
      const typeMap = new Map<string, number>();
      
      products.forEach((p: any) => {
        const typeName = p.productTypeName || p.type;
        typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1);
      });
      
      const typeNames = Array.from(typeMap.entries())
        .map(([name, count]) => count > 1 ? `${name} (${count})` : name);
      
      setProductStats({ count: products.length, typeNames });
    } catch (error) {
      console.error("Failed to load product stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const projectTypeLabel = project.projectType === 'recurring' ? 'Recurring' : 'New Development';

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{project.id}</h3>
                <Badge variant="outline" className="text-xs">
                  {projectTypeLabel}
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{project.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              {!isLoading && productStats.count > 0 && (
                <>
                  <span className="text-muted-foreground">
                    {productStats.count} {productStats.count === 1 ? 'gaminys' : 'gaminiai'}
                  </span>
                  {productStats.typeNames.length > 0 && (
                    <span className="text-muted-foreground">
                      {productStats.typeNames.join(', ')}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(project.createdAt).toLocaleDateString("lt-LT")}
              </div>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {project.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
