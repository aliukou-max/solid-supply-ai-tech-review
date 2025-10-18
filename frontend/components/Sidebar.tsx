// @ts-nocheck
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
    <aside className="w-64 bg-card border-r min-h-screen flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-base">Solid Supply</div>
            <div className="text-xs text-muted-foreground">Tech Review</div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isActive 
                      ? "bg-primary/10 text-primary hover:bg-primary/15" 
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <div>
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wider">Admin</p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
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
