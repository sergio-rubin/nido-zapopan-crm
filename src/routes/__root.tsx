import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/nido/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <main className="legal-page">
      <article>
        <h1>404</h1>
        <p>La página que buscas no existe o fue movida.</p>
        <Link to="/" className="back-link">
          ← Volver a la propiedad
        </Link>
      </article>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="legal-page">
      <article>
        <h1>Esta página no cargó</h1>
        <p>Algo salió mal. Puedes intentar de nuevo o volver al inicio.</p>
        <div className="session-actions">
          <button
            className="ui-button is-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Intentar de nuevo
          </button>
          <a href="/" className="ui-button is-outline">
            Ir al inicio
          </a>
        </div>
      </article>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f7f5ef" },
      { name: "application-name", content: "NIDO Zapopan" },
      { name: "apple-mobile-web-app-title", content: "NIDO" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "NIDO Zapopan" },
      { name: "description", content: "Departamento en Zapopan, Jalisco." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") queryClient.clear();
      else queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <SiteHeader />
      <Outlet />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
