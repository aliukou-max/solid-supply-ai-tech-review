import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Box } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => backend.project.list(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["nodes-products"],
    queryFn: async () => backend.nodes.listProducts(),
  });

  const { data: brandsData } = useQuery({
    queryKey: ["nodes-brands"],
    queryFn: async () => backend.nodes.listBrands(),
  });

  const projects = data?.projects || [];
  const products = productsData?.products || [];
  const brands = brandsData?.brands || [];
  
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const activeCount = projects.filter((p) => p.status === "active").length;
  const totalCount = projects.length;
  const recentProjects = projects.slice(0, 3);
  
  const totalProductNodes = products.reduce((sum, p) => sum + p.count, 0);
  const totalBrandNodes = brands.reduce((sum, b) => sum + b.count, 0);

  const getProjectTypeColor = (projectType?: string) => {
    return projectType === 'recurring' ? 'bg-blue-500' : 'bg-amber-600';
  };

  const getProjectTypeLabel = (projectType?: string) => {
    return projectType === 'recurring' ? 'recurring' : 'new development';
  };

  const [projectStats, setProjectStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (recentProjects.length > 0) {
      loadProductStats();
    }
  }, [recentProjects.map(p => p.id).join(',')]);

  const loadProductStats = async () => {
    const stats: Record<string, any> = {};
    
    for (const project of recentProjects) {
      try {
        const { products } = await backend.product.listByProject({ projectId: project.id });
        const typeMap = new Map<string, number>();
        
        products.forEach((p: any) => {
          const typeName = p.productTypeName || p.type;
          typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1);
        });
        
        stats[project.id] = {
          count: products.length,
          typeNames: Array.from(typeMap.entries())
            .map(([name, count]) => count > 1 ? `${name} (${count})` : name)
        };
      } catch (error) {
        stats[project.id] = { count: 0, typeNames: [] };
      }
    }
    
    setProjectStats(stats);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Baigti projektai</p>
              <p className="text-3xl font-bold">{completedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vykdomi projektai</p>
              <p className="text-3xl font-bold">{activeCount}</p>
            </div>
          </div>
        </Card>

        <Link to="/nodes" className="block">
          <Card className="p-6 hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Box className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mazgų biblioteka</p>
                <p className="text-3xl font-bold">{totalProductNodes + totalBrandNodes}</p>
                <p className="text-xs text-muted-foreground mt-1">{products.length} gaminių • {brands.length} brandų</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Projektai</h2>
        <div className="space-y-3">
          {recentProjects.map((project) => {
            const stats = projectStats[project.id] || { count: 0, typeNames: [] };

            return (
              <Link 
                key={project.id}
                to={`/projects/${project.id}`}
                className="block"
              >
                <div className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-1 ${getProjectTypeColor(project.projectType)}`} />
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            {getProjectTypeLabel(project.projectType)}
                          </span>
                          {project.client && (
                            <Badge variant="outline" className="text-xs">
                              {project.client}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-base">{project.id}</h3>
                        <p className="font-normal text-sm mt-1">{project.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    {stats.count > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{stats.count} {stats.count === 1 ? 'gaminys' : 'gaminiai'}</span>
                          {stats.typeNames.length > 0 && (
                            <span>{stats.typeNames.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
