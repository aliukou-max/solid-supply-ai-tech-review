import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { TechReviewPage } from "./pages/TechReviewPage";
import { LessonsLearntPage } from "./pages/LessonsLearntPage";
import { ErrorsPage } from "./pages/ErrorsPage";
import { NodesPage } from "./pages/NodesPage";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/tech-review/:productId" element={<TechReviewPage />} />
          <Route path="/errors" element={<ErrorsPage />} />
          <Route path="/lessons-learnt" element={<LessonsLearntPage />} />
          <Route path="/nodes" element={<NodesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
