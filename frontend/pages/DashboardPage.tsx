import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  Box, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Lightbulb,
  Activity,
  Plus,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Target,
  Zap
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
      case "project": return <FileText className="h-4 w-4" />;
      case "product": return <Box className="h-4 w-4" />;
      case "error": return <AlertCircle className="h-4 w-4" />;
      case "lesson": return <Lightbulb className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "project": return "text-blue-500 bg-blue-500/10";
      case "product": return "text-purple-500 bg-purple-500/10";
      case "error": return "text-red-500 bg-red-500/10";
      case "lesson": return "text-amber-500 bg-amber-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Solid Supply Tech Review Sistema</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowImportDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <Button 
              onClick={() => setShowCreateProjectDialog(true)}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Naujas Projektas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/projects">
            <Card className="p-6 bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/30 hover:border-blue-700/50 transition-all hover:shadow-lg hover:shadow-blue-900/20 backdrop-blur-sm cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/30">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {stats?.projectStats.active || 0} aktyvūs
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Viso projektų</p>
                <p className="text-4xl font-bold text-white">{stats?.projectStats.total || 0}</p>
                <div className="flex gap-3 mt-3 text-xs text-slate-400">
                  <span>✓ {stats?.projectStats.completed || 0} baigti</span>
                  <span>↻ {stats?.projectStats.recurring || 0} recurring</span>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30 hover:border-purple-700/50 transition-all hover:shadow-lg hover:shadow-purple-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30">
                <Box className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {stats?.productStats.withTechReview || 0} su TR
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Produktai</p>
              <p className="text-4xl font-bold text-white">{stats?.productStats.total || 0}</p>
              <div className="flex gap-3 mt-3 text-xs text-slate-400">
                <span>📐 {stats?.productStats.withDrawing || 0} su brėžiniais</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30 hover:border-cyan-700/50 transition-all hover:shadow-lg hover:shadow-cyan-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/30">
                <Target className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                {stats?.techReviewStats.completionRate || 0}%
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Tech Reviews</p>
              <p className="text-4xl font-bold text-white">{stats?.techReviewStats.total || 0}</p>
              <Progress 
                value={stats?.techReviewStats.completionRate || 0} 
                className="mt-3 h-1.5 bg-cyan-950/50"
              />
              <div className="flex gap-3 mt-3 text-xs text-slate-400">
                <span>✓ {stats?.techReviewStats.completed || 0} baigti</span>
                <span>⟳ {stats?.techReviewStats.inProgress || 0} vykdomi</span>
              </div>
            </div>
          </Card>

          <Link to="/errors">
            <Card className="p-6 bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-800/30 hover:border-red-700/50 transition-all hover:shadow-lg hover:shadow-red-900/20 backdrop-blur-sm cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  {stats?.errorStats.pending || 0} neišspręsti
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Klaidos</p>
                <p className="text-4xl font-bold text-white">{stats?.errorStats.total || 0}</p>
                <div className="flex gap-3 mt-3 text-xs text-slate-400">
                  <span>7d: {stats?.errorStats.last7Days || 0}</span>
                  <span>30d: {stats?.errorStats.last30Days || 0}</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 p-6 bg-slate-900/40 border-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Naujausia veikla
              </h2>
              <Badge variant="outline" className="text-slate-400 border-slate-700">
                {stats?.recentActivity.length || 0} įvykiai
              </Badge>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats?.recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">{formatTime(activity.timestamp)}</p>
                      {activity.projectName && (
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                          {activity.projectName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <p className="text-center text-slate-500 py-8">Nėra veiklos</p>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Pamokos</h3>
                  <p className="text-xs text-amber-300/70">Išmoktos pamokos</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Viso pamokų</span>
                  <span className="text-2xl font-bold text-white">{stats?.lessonStats.total || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-xs text-green-300 mb-1">Geros praktikos</p>
                    <p className="text-xl font-bold text-green-400">{stats?.lessonStats.goodPractice || 0}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs text-red-300 mb-1">Blogos praktikos</p>
                    <p className="text-xl font-bold text-red-400">{stats?.lessonStats.badPractice || 0}</p>
                  </div>
                </div>
                <Link to="/lessons-learnt">
                  <Button variant="outline" className="w-full border-amber-700/50 hover:bg-amber-900/30 text-amber-200">
                    Peržiūrėti visas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>

            <Link to="/nodes">
              <Card className="p-6 bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-800/30 hover:border-emerald-700/50 transition-all backdrop-blur-sm cursor-pointer">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Mazgų biblioteka</h3>
                    <p className="text-xs text-emerald-300/70">Node database</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Viso mazgų</span>
                    <span className="text-2xl font-bold text-white">{stats?.nodeStats.totalNodes || 0}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-400">
                    <span>📦 {stats?.nodeStats.totalProducts || 0} produktai</span>
                    <span>•</span>
                    <span>🏷️ {stats?.nodeStats.totalBrands || 0} brandai</span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {stats?.lessonStats.topIssues && stats.lessonStats.topIssues.length > 0 && (
          <Card className="p-6 bg-slate-900/40 border-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-red-400" />
              <h2 className="text-xl font-bold text-white">Dažniausios problemos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.lessonStats.topIssues.slice(0, 6).map((issue, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                      {issue.occurrenceCount}x
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{issue.errorDescription}</p>
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
