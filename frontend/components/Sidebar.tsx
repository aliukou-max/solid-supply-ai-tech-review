import { Link, useLocation } from "react-router-dom";
import { Package, FolderOpen, AlertCircle, BookOpen, Box, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects", label: "Projektai", icon: FolderOpen },
    { path: "/nodes", label: "Mazgu biblioteka", icon: Box },
    { path: "/lessons-learnt", label: "Pamokos", icon: BookOpen },
    { path: "/errors", label: "Klaidu registras", icon: AlertCircle },
  ];

  const adminItems = [
    { path: "/admin/product-types", label: "Product Types", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 border-r border-blue-900/30 min-h-screen flex flex-col backdrop-blur-sm">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-blue-900/30">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-base text-white">Solid Supply</div>
            <div className="text-xs text-blue-300/70">Tech Review</div>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 transition-all",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-200 border-l-2 border-blue-400 shadow-sm" 
                      : "text-slate-400 hover:text-blue-200 hover:bg-blue-950/30"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-blue-400")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Separator className="mb-4 bg-blue-900/30" />
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-500 px-3 mb-2 uppercase tracking-wider">Admin</p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 transition-all",
                        isActive
                          ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-200 border-l-2 border-blue-400"
                          : "text-slate-400 hover:text-blue-200 hover:bg-blue-950/30"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-blue-400")} />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
