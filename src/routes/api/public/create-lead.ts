import { createFileRoute } from "@tanstack/react-router";

import { LEAD_SUCCESS_MESSAGE, isAllowedOrigin, validateLeadInput } from "@/lib/leads";

const MAX_BODY_BYTES = 4096;
const RATE_WINDOW_MINUTES = 10;
const RATE_MAX_PER_EMAIL = 3;

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && originAllowed(request, origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Accept";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function originAllowed(request: Request, origin: string) {
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(
    (h): h is string => Boolean(h),
  );
  const extra = (process.env["LEADS_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return isAllowedOrigin(origin, hosts, extra);
}

function json(request: Request, status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(request),
      ...extraHeaders,
    },
  });
}

export const Route = createFileRoute("/api/public/create-lead")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!origin || !originAllowed(request, origin)) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      },
      GET: async ({ request }) =>
        json(request, 405, { ok: false, message: "Método no permitido." }, { Allow: "POST, OPTIONS" }),
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && !originAllowed(request, origin)) {
          return json(request, 403, { ok: false, message: "Origen no permitido." });
        }
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().startsWith("application/json")) {
          return json(request, 415, { ok: false, message: "Envía los datos como JSON." });
        }
        const declared = Number(request.headers.get("content-length") ?? "0");
        if (declared > MAX_BODY_BYTES) {
          return json(request, 413, { ok: false, message: "Solicitud demasiado grande." });
        }
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) {
          return json(request, 413, { ok: false, message: "Solicitud demasiado grande." });
        }
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return json(request, 400, { ok: false, message: "JSON inválido." });
        }

        const result = validateLeadInput(body);
        if (!result.ok) {
          return json(request, 400, { ok: false, message: "Revisa los datos del formulario.", errors: result.errors });
        }
        // Bots filling the hidden field get a normal-looking response and nothing is stored.
        if (result.honeypot) return json(request, 201, { ok: true, message: LEAD_SUCCESS_MESSAGE });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString();
        const { count, error: countError } = await supabaseAdmin
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("email", result.data.email)
          .gte("created_at", since);
        if (countError) {
          console.error("create-lead rate check failed", countError.message);
          return json(request, 500, { ok: false, message: "No pudimos registrar tus datos. Intenta de nuevo." });
        }
        if ((count ?? 0) >= RATE_MAX_PER_EMAIL) {
          return json(
            request,
            429,
            { ok: false, message: "Ya recibimos tus datos. Intenta de nuevo en unos minutos." },
            { "Retry-After": String(RATE_WINDOW_MINUTES * 60) },
          );
        }

        const { error } = await supabaseAdmin
          .from("leads")
          .insert({ ...result.data, status: "Nuevo", note: "" });
        if (error) {
          console.error("create-lead insert failed", error.message);
          return json(request, 500, { ok: false, message: "No pudimos registrar tus datos. Intenta de nuevo." });
        }
        return json(request, 201, { ok: true, message: LEAD_SUCCESS_MESSAGE });
      },
    },
  },
});
