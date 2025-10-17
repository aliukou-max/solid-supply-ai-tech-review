import { ReactNode } from "react";

interface MainLayoutProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function MainLayout({ title, description, actions, children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
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
