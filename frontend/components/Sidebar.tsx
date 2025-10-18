import { Link, useLocation } from "react-router-dom";
import { Package, Plus, FolderOpen, AlertCircle, BookOpen, Box, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: FolderOpen },
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
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-sm">Solid Supply</div>
            <div className="text-xs text-muted-foreground">Tech Review</div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
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

        <div className="mt-auto">
          <Separator className="mb-4" />
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">ADMIN</p>
            <nav className="space-y-1">
              {adminItems.map((item) => (
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
        </div>
      </div>
    </aside>
  );
}
