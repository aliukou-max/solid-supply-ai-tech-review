import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Box, 
  AlertTriangle,
  Activity,
  ArrowRight,
  Clock,
  Lightbulb
} from "lucide-react";

export function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => backend.dashboard.getStats(),
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project": return <FileText className="h-3.5 w-3.5" />;
      case "product": return <Box className="h-3.5 w-3.5" />;
      case "error": return <AlertTriangle className="h-3.5 w-3.5" />;
      case "lesson": return <Lightbulb className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
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
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Solid Supply Tech Review Sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/projects">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <Badge variant="secondary">
                  {stats?.projectStats.active || 0} aktyvūs
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Projektai</p>
                <p className="text-3xl font-bold text-foreground">{stats?.projectStats.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.projectStats.completed || 0} baigti
                </p>
              </div>
            </Card>
          </Link>

          <Card className="p-6 border-2">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Box className="h-6 w-6 text-purple-600" />
              </div>
              <Badge variant="secondary">
                {stats?.productStats.withTechReview || 0} su TR
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Produktai</p>
              <p className="text-3xl font-bold text-foreground">{stats?.productStats.total || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.productStats.withDrawing || 0} su brėžiniais
              </p>
            </div>
          </Card>

          <Link to="/errors">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <Badge variant="destructive">
                  {stats?.errorStats.pending || 0} neišspręstos
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Klaidos</p>
                <p className="text-3xl font-bold text-foreground">{stats?.errorStats.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.errorStats.last7Days || 0} per 7d
                </p>
              </div>
            </Card>
          </Link>

          <Link to="/nodes">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Box className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mazgų biblioteka</p>
                <p className="text-3xl font-bold text-foreground">{stats?.nodeStats.totalNodes || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.nodeStats.totalProducts || 0} produktai, {stats?.nodeStats.totalBrands || 0} brandai
                </p>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Naujausia veikla
              </h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats?.recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                <p className="text-center text-muted-foreground py-8 text-sm">Nėra veiklos</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Pamokos</h3>
                <p className="text-xs text-muted-foreground">Išmoktos pamokos</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Viso pamokų</span>
                <span className="text-2xl font-bold">{stats?.lessonStats.total || 0}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-700 mb-1">Geros</p>
                  <p className="text-xl font-bold text-green-700">{stats?.lessonStats.goodPractice || 0}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 mb-1">Blogos</p>
                  <p className="text-xl font-bold text-red-700">{stats?.lessonStats.badPractice || 0}</p>
                </div>
              </div>
              <Link to="/lessons-learnt">
                <Button variant="outline" className="w-full">
                  Peržiūrėti visas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {stats?.lessonStats.topIssues && stats.lessonStats.topIssues.length > 0 && (
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Dažniausios problemos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.lessonStats.topIssues.slice(0, 6).map((issue, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                    >
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline">
                      {issue.occurrenceCount}x
                    </Badge>
                  </div>
                  <p className="text-sm line-clamp-2">{issue.errorDescription}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
