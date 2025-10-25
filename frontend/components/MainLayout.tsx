import { ReactNode } from "react";

interface MainLayoutProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function MainLayout({ title, description, actions, children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_65%)]"
      />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      <main className="flex-1 pb-10">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
