import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Box } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";

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
  const efficiency = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const recentProjects = projects.slice(0, 3);
  
  const totalProductNodes = products.reduce((sum, p) => sum + p.count, 0);
  const totalBrandNodes = brands.reduce((sum, b) => sum + b.count, 0);

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
        <h2 className="text-2xl font-bold mb-4">Naujausi įvesti projektai</h2>
        <div className="space-y-3">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
