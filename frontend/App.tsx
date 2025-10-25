// @ts-nocheck
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { TechReviewPage } from "./pages/TechReviewPage";
import { LessonsLearntPage } from "./pages/LessonsLearntPage";
import { ErrorsPage } from "./pages/ErrorsPage";
import { NodesPage } from "./pages/NodesPage";
import { NodesByProductPage } from "./pages/NodesByProductPage";
import { NodesByBrandPage } from "./pages/NodesByBrandPage";
import { NodesByPartPage } from "./pages/NodesByPartPage";
import ProductTypesAdminPage from "./pages/ProductTypesAdminPage";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto bg-gradient-to-br from-background via-muted/40 to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-[-10%] w-2/3 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_60%)]"
        />
        <div className="relative">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/tech-review/:productId" element={<TechReviewPage />} />
            <Route path="/errors" element={<ErrorsPage />} />
            <Route path="/lessons-learnt" element={<LessonsLearntPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/nodes/by-product" element={<NodesByProductPage />} />
            <Route path="/nodes/by-brand" element={<NodesByBrandPage />} />
            <Route path="/nodes/by-part" element={<NodesByPartPage />} />
            <Route path="/admin/product-types" element={<ProductTypesAdminPage />} />
          </Routes>
        </div>
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
