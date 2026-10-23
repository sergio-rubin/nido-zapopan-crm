import { z } from "zod";

export const LEAD_STATUSES = ["Nuevo", "Contactado", "Le interesa", "Descartado"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string;
  phone: string;
  email: string;
  status: LeadStatus;
  note: string;
}

export const LEAD_SUCCESS_MESSAGE = "Gracias, te contactaremos pronto";
export const NOTE_MAX = 2000;

export const LEAD_LIMITS = { nameMin: 2, nameMax: 120, phoneMinDigits: 10, phoneMaxDigits: 15, emailMax: 254 } as const;

const FIELD_MESSAGES = {
  name: "Escribe tu nombre completo.",
  phone: "Escribe un teléfono válido.",
  email: "Escribe un correo válido.",
  privacy_consent: "Debes aceptar el aviso de privacidad.",
} as const;

export function normalizeName(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return (trimmed.startsWith("+") ? "+" : "") + digits;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** Public contract for POST /api/public/create-lead. Unknown keys are rejected. */
const leadInputSchema = z
  .object({
    name: z
      .string({ invalid_type_error: FIELD_MESSAGES.name, required_error: FIELD_MESSAGES.name })
      .max(400, FIELD_MESSAGES.name)
      .transform(normalizeName)
      .refine((v) => v.length >= LEAD_LIMITS.nameMin && v.length <= LEAD_LIMITS.nameMax, FIELD_MESSAGES.name),
    phone: z
      .string({ invalid_type_error: FIELD_MESSAGES.phone, required_error: FIELD_MESSAGES.phone })
      .max(40, FIELD_MESSAGES.phone)
      .refine((v) => /^[\d\s()+.-]+$/.test(v.trim()), FIELD_MESSAGES.phone)
      .transform(normalizePhone)
      .refine((v) => {
        const digits = v.replace(/\D/g, "").length;
        return digits >= LEAD_LIMITS.phoneMinDigits && digits <= LEAD_LIMITS.phoneMaxDigits;
      }, FIELD_MESSAGES.phone),
    email: z
      .string({ invalid_type_error: FIELD_MESSAGES.email, required_error: FIELD_MESSAGES.email })
      .transform(normalizeEmail)
      .pipe(z.string().max(LEAD_LIMITS.emailMax, FIELD_MESSAGES.email).email(FIELD_MESSAGES.email)),
    // Optional keys accepted for compatibility with the existing Vue frontend.
    privacy_consent: z.literal(true, { errorMap: () => ({ message: FIELD_MESSAGES.privacy_consent }) }).optional(),
    website: z.string().max(200).optional(), // honeypot
  })
  .strict();

export type LeadInput = { name: string; phone: string; email: string };

export type LeadValidation =
  | { ok: true; data: LeadInput; honeypot: boolean }
  | { ok: false; errors: Record<string, string[]> };

export function validateLeadInput(input: unknown): LeadValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: ["El cuerpo debe ser un objeto JSON."] } };
  }
  const parsed = leadInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      if (issue.code === "unrecognized_keys") {
        for (const key of issue.keys) errors[key] = ["Campo no permitido."];
        continue;
      }
      const field = String(issue.path[0] ?? "body");
      (errors[field] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const { name, phone, email, website } = parsed.data;
  return { ok: true, data: { name, phone, email }, honeypot: Boolean(website && website.trim()) };
}

/** wa.me link with digits only; 10-digit numbers are assumed Mexican (+52). */
export function whatsappUrl(phone: string, name: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `52${digits}`;
  const firstName = normalizeName(name).split(" ")[0] ?? "";
  const text = `Hola ${firstName}, te escribo de NIDO Zapopan sobre el departamento en Zapopan que te interesó. ¿Tienes un momento para platicar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function sortLeadsDesc<T extends { created_at: string }>(leads: T[]) {
  return [...leads].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function countByStatus(leads: { status: LeadStatus }[]) {
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const lead of leads) if (lead.status in counts) counts[lead.status] += 1;
  return counts;
}

export function filterLeads<T extends { name: string; status: LeadStatus }>(
  leads: T[],
  status: LeadStatus | "Todos",
  search: string,
) {
  const term = search
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return leads.filter((lead) => {
    if (status !== "Todos" && lead.status !== status) return false;
    if (!term) return true;
    return lead.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(term);
  });
}

export const PROJECT_ID = "65f11c62-5f1a-48fe-af81-5790b8468b8c";
const STATIC_ALLOWED = new Set([
  "https://blender-application.wacoding.org",
  "http://localhost:8080",
  "http://localhost:5173",
]);
const LOVABLE_ORIGIN = new RegExp(
  `^https://([a-z0-9-]+--)?${PROJECT_ID}\\.(lovable\\.app|lovableproject\\.com)$`,
);

export function isAllowedOrigin(origin: string, requestHosts: string[] = [], extra: string[] = []) {
  if (STATIC_ALLOWED.has(origin) || extra.includes(origin) || LOVABLE_ORIGIN.test(origin)) return true;
  try {
    const host = new URL(origin).host;
    return requestHosts.includes(host);
  } catch {
    return false;
  }
}

export function hasStaffAccess(roles: string[]) {
  return roles.includes("staff") || roles.includes("admin");
}
