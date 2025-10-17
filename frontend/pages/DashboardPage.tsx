import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => backend.project.list(),
  });

  const projects = data?.projects || [];
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const activeCount = projects.filter((p) => p.status === "active").length;
  const totalCount = projects.length;
  const efficiency = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efektyvumas</p>
              <p className="text-3xl font-bold">{efficiency}%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
