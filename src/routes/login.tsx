import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { UiButton } from "@/components/nido/UiButton";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ redirect: z.string().optional() });

function safeRedirect(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/interesados";
}

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: safeRedirect(search.redirect) });
  },
  head: () => ({
    meta: [
      { title: "Acceso de personal · NIDO Zapopan" },
      { name: "description", content: "Acceso para el equipo de ventas de NIDO Zapopan." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Acceso de personal · NIDO Zapopan" },
      { property: "og:description", content: "Acceso restringido al equipo de ventas." },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Escribe tu correo y contraseña.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) {
      setError(
        authError.message.toLowerCase().includes("invalid")
          ? "Correo o contraseña incorrectos."
          : "No pudimos iniciar sesión. Intenta de nuevo.",
      );
      return;
    }
    await navigate({ to: safeRedirect(search.redirect), replace: true });
  }

  return (
    <main id="main-content" className="leads-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-photo" aria-hidden="true" />
        <div className="login-content">
          <h1 id="login-title">
            Acceso de
            <br />
            personal
          </h1>
          <p>Ingresa con tu cuenta autorizada para consultar y dar seguimiento a los interesados.</p>
          <form noValidate onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="login-email">Correo</label>
              <div className="input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <UiButton type="submit" loading={loading} loadingLabel="Entrando…">
              Entrar <span aria-hidden="true">→</span>
            </UiButton>
          </form>
        </div>
      </section>
    </main>
  );
}
