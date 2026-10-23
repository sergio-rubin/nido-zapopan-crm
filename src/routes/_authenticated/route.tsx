import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  pendingComponent: () => (
    <main className="leads-page" aria-busy="true">
      <p className="crm-checking" role="status">
        <span className="spinner" aria-hidden="true" /> Verificando sesión…
      </p>
    </main>
  ),
  component: () => <Outlet />,
});
