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
  const [productStats, setProductStats] = useState<{count: number, types: string[]}>({ count: 0, types: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProductStats();
  }, [project.id]);

  const loadProductStats = async () => {
    try {
      const { products } = await backend.product.listByProject({ projectId: project.id });
      const uniqueTypes = [...new Set(products.map((p: any) => p.type))];
      setProductStats({ count: products.length, types: uniqueTypes });
    } catch (error) {
      console.error("Failed to load product stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const projectTypeLabel = project.projectType === 'recurring' ? 'Recurring' : 'New Development';
  const projectTypeBadgeColor = project.projectType === 'recurring' ? 'bg-blue-500' : 'bg-amber-600';

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`w-2 h-2 rounded-full ${projectTypeBadgeColor} mt-2`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{project.id}</h3>
                </div>
                <p className="font-medium text-base">{project.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              className="absolute top-3 right-3"
            >
              {/* @ts-ignore */}
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {projectTypeLabel}
            </Badge>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
          
          {!isLoading && productStats.count > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {productStats.count} {productStats.count === 1 ? 'gaminys' : 'gaminiai'}
              </p>
              {productStats.types.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tipai: {productStats.types.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            {/* @ts-ignore */}
            <Calendar className="h-3 w-3" />
            {new Date(project.createdAt).toLocaleDateString("lt-LT")}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
