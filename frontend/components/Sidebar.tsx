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
    <aside className="w-56 bg-slate-950 border-r border-slate-800 min-h-screen flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
          <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-200">Solid Supply</div>
            <div className="text-[10px] text-slate-600">Tech Review</div>
          </div>
        </div>

        <nav className="space-y-0.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 h-8 text-xs transition-all",
                    isActive 
                      ? "bg-slate-800 text-slate-200" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-3">
          <Separator className="mb-3 bg-slate-800" />
          <div>
            <p className="text-[10px] font-medium text-slate-600 px-2 mb-1 uppercase tracking-wider">Admin</p>
            <nav className="space-y-0.5">
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 h-7 text-xs transition-all",
                        isActive
                          ? "bg-slate-800 text-slate-200"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
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
