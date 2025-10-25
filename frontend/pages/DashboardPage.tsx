import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/MainLayout";
import {
  FileText,
  Box,
  AlertTriangle,
  Activity,
  ArrowRight,
  Clock,
  Lightbulb,
} from "lucide-react";

export function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => backend.dashboard.getStats(),
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project":
        return <FileText className="h-3.5 w-3.5" />;
      case "product":
        return <Box className="h-3.5 w-3.5" />;
      case "error":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case "lesson":
        return <Lightbulb className="h-3.5 w-3.5" />;
      default:
        return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "now";
  };

  return (
    <MainLayout
      title={
        <div className="flex items-center gap-2">
          <span>Dashboard</span>
          <Badge variant="outline" className="hidden sm:inline-flex">
            Beta
          </Badge>
        </div>
      }
      description="Solid Supply Tech Review Sistema"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/projects">Peržiūrėti projektus</Link>
          </Button>
          <Button asChild>
            <Link to="/projects/new">Naujas projektas</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/projects" className="block">
            <Card className="group relative overflow-hidden border-none bg-card/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary">{stats?.projectStats.active || 0} aktyvūs</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projektai</p>
                  <p className="text-3xl font-semibold text-foreground">
                    {stats?.projectStats.total || 0}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stats?.projectStats.completed || 0} baigti
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="group relative overflow-hidden border-none bg-card/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Box className="h-6 w-6" />
                </div>
                <Badge variant="secondary">
                  {stats?.productStats.withTechReview || 0} su TR
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produktai</p>
                <p className="text-3xl font-semibold text-foreground">
                  {stats?.productStats.total || 0}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats?.productStats.withDrawing || 0} su brėžiniais
                </p>
              </div>
            </div>
          </Card>

          <Link to="/errors" className="block">
            <Card className="group relative overflow-hidden border-none bg-card/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <Badge variant="destructive">
                    {stats?.errorStats.pending || 0} neišspręstos
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Klaidos</p>
                  <p className="text-3xl font-semibold text-foreground">
                    {stats?.errorStats.total || 0}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stats?.errorStats.last7Days || 0} per 7d
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/nodes" className="block">
            <Card className="group relative overflow-hidden border-none bg-card/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mazgų biblioteka</p>
                  <p className="text-3xl font-semibold text-foreground">
                    {stats?.nodeStats.totalNodes || 0}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stats?.nodeStats.totalProducts || 0} produktai, {stats?.nodeStats.totalBrands || 0} brandai
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-none bg-card/80 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Activity className="h-5 w-5" />
                Naujausia veikla
              </h2>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {stats?.recentActivity?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border border-transparent bg-muted/60 p-3 transition hover:border-muted hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(activity.timestamp)}
                      </p>
                      {activity.projectName && (
                        <Badge variant="outline" className="text-xs">
                          {activity.projectName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">Nėra veiklos</p>
              )}
            </div>
          </Card>

          <Card className="border-none bg-card/80 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pamokos</h3>
                <p className="text-xs text-muted-foreground">Išmoktos pamokos</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Viso pamokų</span>
                <span className="text-2xl font-semibold text-foreground">
                  {stats?.lessonStats.total || 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="mb-1 text-xs text-green-700">Geros</p>
                  <p className="text-xl font-bold text-green-700">
                    {stats?.lessonStats.goodPractice || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-xs text-red-700">Blogos</p>
                  <p className="text-xl font-bold text-red-700">
                    {stats?.lessonStats.badPractice || 0}
                  </p>
                </div>
              </div>
              <Link to="/lessons-learnt">
                <Button variant="outline" className="w-full">
                  Peržiūrėti visas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {stats?.lessonStats.topIssues && stats.lessonStats.topIssues.length > 0 && (
          <Card className="border-none bg-card/80 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Dažniausios problemos</h2>
              <Badge variant="outline" className="text-xs">
                Top 6
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.lessonStats.topIssues.slice(0, 6).map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-transparent bg-muted/60 p-4 transition hover:border-muted hover:bg-muted"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <Badge variant={issue.severity === "high" ? "destructive" : "secondary"}>
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline">{issue.occurrenceCount}x</Badge>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {issue.errorDescription}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
