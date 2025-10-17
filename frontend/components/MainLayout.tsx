import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function MainLayout({ title, description, actions, children }: MainLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Solid Supply</span>
              </div>
              <nav className="flex items-center gap-1">
                <Link to="/">
                  <div
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === "/"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    Visi projektai
                  </div>
                </Link>
                <Link to="/projects">
                  <div
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname.startsWith("/projects") && location.pathname !== "/"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    Pridėti projektą
                  </div>
                </Link>
                <Link to="/lessons-learnt">
                  <div
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      location.pathname === "/lessons-learnt"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                    Lessons Learnt
                  </div>
                </Link>
              </nav>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
