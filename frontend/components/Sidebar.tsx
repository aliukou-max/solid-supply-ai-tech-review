// @ts-nocheck
import { Link, useLocation } from "react-router-dom";
import { Package, FolderOpen, AlertCircle, BookOpen, Box, Settings, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const location = useLocation();

  const isPathActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
    <aside className="relative flex min-h-screen w-64 flex-col border-r bg-card/95 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_65%)]"
      />
      <div className="relative flex flex-1 flex-col gap-6 p-6">
        <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Solid Supply</p>
              <p className="text-xs text-muted-foreground">Tech Review Hub</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Sistema veikia sklandžiai
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/80">
              Navigacija
            </p>
            <nav className="mt-3 space-y-1">
              {navItems.map((item) => {
                const isActive = isPathActive(item.path);
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <Separator className="mb-3" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/80">
              Admin
            </p>
            <nav className="mt-3 space-y-1">
              {adminItems.map((item) => {
                const isActive = isPathActive(item.path);
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/50 p-4 text-xs text-muted-foreground shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Nauja sąsaja
            </div>
            <p className="mt-2 leading-relaxed">
              Išbandykite atnaujintą Tech Review panelę ir pasidalinkite grįžtamuoju ryšiu su komanda.
            </p>
            <Link to="/lessons-learnt">
              <Button size="sm" variant="secondary" className="mt-3 w-full">
                Dalintis pamoka
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
