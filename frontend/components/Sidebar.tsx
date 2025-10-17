import { Link, useLocation } from "react-router-dom";
import { Package, Plus, FolderOpen, AlertCircle, BookOpen, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: FolderOpen },
    { path: "/projects", label: "Projektai", icon: FolderOpen },
    { path: "/nodes", label: "Mazgu biblioteka", icon: Box },
    { path: "/lessons-learnt", label: "Pamokos", icon: BookOpen },
    { path: "/errors", label: "Klaidu registras", icon: AlertCircle },
  ];

  return (
    <aside className="w-64 bg-card border-r min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-sm">Solid Supply</div>
            <div className="text-xs text-muted-foreground">Tech Review</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  location.pathname === item.path && "bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
