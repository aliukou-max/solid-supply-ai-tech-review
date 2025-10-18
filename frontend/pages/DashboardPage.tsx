import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Box, 
  Target,
  AlertTriangle,
  Activity,
  Plus,
  Upload,
  ArrowRight,
  Clock
} from "lucide-react";
import { useState } from "react";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";

export function DashboardPage() {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  const { data: stats, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => backend.dashboard.getStats(),
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project": return <FileText className="h-3 w-3" />;
      case "product": return <Box className="h-3 w-3" />;
      case "error": return <AlertTriangle className="h-3 w-3" />;
      case "lesson": return <Target className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
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
    <div className="min-h-screen bg-slate-950">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-200">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Solid Supply Tech Review</p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => setShowImportDialog(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import Excel
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowCreateProjectDialog(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Naujas Projektas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Link to="/projects">
            <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                  {stats?.projectStats.active || 0} aktyvūs
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Projektai</p>
                <p className="text-2xl font-semibold text-slate-200">{stats?.projectStats.total || 0}</p>
                <div className="flex gap-2 mt-2 text-[10px] text-slate-600">
                  <span>{stats?.projectStats.completed || 0} baigti</span>
                  <span>•</span>
                  <span>{stats?.projectStats.recurring || 0} recurring</span>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Box className="h-4 w-4 text-slate-400" />
              </div>
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                {stats?.productStats.withTechReview || 0} su TR
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Produktai</p>
              <p className="text-2xl font-semibold text-slate-200">{stats?.productStats.total || 0}</p>
              <div className="flex gap-2 mt-2 text-[10px] text-slate-600">
                <span>{stats?.productStats.withDrawing || 0} su brėžiniais</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-slate-400" />
              </div>
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                {stats?.techReviewStats.completionRate || 0}%
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Tech Reviews</p>
              <p className="text-2xl font-semibold text-slate-200">{stats?.techReviewStats.total || 0}</p>
              <Progress 
                value={stats?.techReviewStats.completionRate || 0} 
                className="mt-2 h-1 bg-slate-800"
              />
              <div className="flex gap-2 mt-2 text-[10px] text-slate-600">
                <span>{stats?.techReviewStats.completed || 0} baigti</span>
                <span>•</span>
                <span>{stats?.techReviewStats.inProgress || 0} vykdomi</span>
              </div>
            </div>
          </Card>

          <Link to="/errors">
            <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                </div>
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                  {stats?.errorStats.pending || 0} pending
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Klaidos</p>
                <p className="text-2xl font-semibold text-slate-200">{stats?.errorStats.total || 0}</p>
                <div className="flex gap-2 mt-2 text-[10px] text-slate-600">
                  <span>7d: {stats?.errorStats.last7Days || 0}</span>
                  <span>•</span>
                  <span>30d: {stats?.errorStats.last30Days || 0}</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-slate-500" />
                Naujausia veikla
              </h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats?.recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-2 p-2 rounded bg-slate-800/50 border border-slate-800"
                >
                  <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 line-clamp-1">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(activity.timestamp)}
                      </p>
                      {activity.projectName && (
                        <Badge variant="outline" className="text-[10px] h-4 border-slate-700 text-slate-500">
                          {activity.projectName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <p className="text-center text-slate-600 py-8 text-xs">Nėra veiklos</p>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-300">Pamokos</h3>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Viso pamokų</span>
                  <span className="text-xl font-semibold text-slate-200">{stats?.lessonStats.total || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 border border-slate-700 rounded p-2">
                    <p className="text-[10px] text-slate-500 mb-0.5">Geros</p>
                    <p className="text-base font-semibold text-slate-300">{stats?.lessonStats.goodPractice || 0}</p>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded p-2">
                    <p className="text-[10px] text-slate-500 mb-0.5">Blogos</p>
                    <p className="text-base font-semibold text-slate-300">{stats?.lessonStats.badPractice || 0}</p>
                  </div>
                </div>
                <Link to="/lessons-learnt">
                  <Button size="sm" variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 text-xs h-7">
                    Peržiūrėti visas
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>

            <Link to="/nodes">
              <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Box className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-slate-300">Mazgų biblioteka</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Viso mazgų</span>
                    <span className="text-xl font-semibold text-slate-200">{stats?.nodeStats.totalNodes || 0}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-slate-600">
                    <span>{stats?.nodeStats.totalProducts || 0} produktai</span>
                    <span>•</span>
                    <span>{stats?.nodeStats.totalBrands || 0} brandai</span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {stats?.lessonStats.topIssues && stats.lessonStats.topIssues.length > 0 && (
          <Card className="p-4 bg-slate-900 border-slate-800 mt-4">
            <h2 className="text-sm font-medium text-slate-300 mb-3">Dažniausios problemos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {stats.lessonStats.topIssues.slice(0, 6).map((issue, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded bg-slate-800/50 border border-slate-800"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <Badge 
                      variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-[10px] h-4"
                    >
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4 border-slate-700 text-slate-500">
                      {issue.occurrenceCount}x
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{issue.errorDescription}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ImportExcelDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          refetch();
        }}
      />

      <CreateProjectDialog
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
