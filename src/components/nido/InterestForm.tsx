import { Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Mail, Phone, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { LeadApiError, createLead } from "@/lib/lead-api";
import { LEAD_SUCCESS_MESSAGE } from "@/lib/leads";
import { UiButton } from "./UiButton";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo.").max(120, "Escribe tu nombre completo."),
  phone: z
    .string()
    .trim()
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return /^[\d\s()+.-]*$/.test(v) && digits >= 10 && digits <= 15;
    }, "Escribe un teléfono válido."),
  email: z.string().trim().max(254, "Escribe un correo válido.").email("Escribe un correo válido."),
  privacy_consent: z.boolean().refine(Boolean, "Debes aceptar el aviso de privacidad."),
  website: z.string(),
});

type Values = z.infer<typeof schema>;
const initial: Values = { name: "", phone: "", email: "", privacy_consent: false, website: "" };

export function InterestForm({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setRequestError("");
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        next[field] ??= issue.message;
      }
      setErrors(next);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".interest-form [aria-invalid='true']")?.focus());
      return;
    }
    setSubmitting(true);
    try {
      const { name, phone, email, website } = parsed.data;
      await createLead({ name, phone, email, ...(website ? { website } : {}) });
      setSuccess(true);
    } catch (error) {
      if (error instanceof LeadApiError && error.fieldErrors) {
        const next: Record<string, string> = {};
        for (const [field, messages] of Object.entries(error.fieldErrors)) next[field] = messages[0] ?? "Revisa este campo.";
        setErrors(next);
      }
      setRequestError(error instanceof LeadApiError ? error.message : "No pudimos enviar tus datos.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="interest-success nido-rise" role="status">
        <span className="success-icon">
          <CheckCircle2 size={48} strokeWidth={1.35} />
        </span>
        <h2>{LEAD_SUCCESS_MESSAGE}</h2>
        <p>Recibimos tus datos. Uno de nuestros asesores se pondrá en contacto contigo a la brevedad.</p>
        <UiButton onClick={onClose}>Cerrar</UiButton>
      </div>
    );
  }

  const field = (id: keyof Values, label: string, Icon: typeof Mail, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="form-field">
      <label htmlFor={`lead-${id}`}>{label}</label>
      <div className="input-wrap">
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
        <input
          id={`lead-${id}`}
          value={values[id] as string}
          onChange={(e) => set(id, e.target.value as never)}
          aria-invalid={Boolean(errors[id])}
          aria-describedby={errors[id] ? `lead-${id}-error` : undefined}
          {...props}
        />
      </div>
      {errors[id] && (
        <p id={`lead-${id}-error`} className="field-error">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <form className="interest-form" noValidate onSubmit={submit}>
      {field("name", "Nombre", UserRound, { autoComplete: "name", placeholder: "Tu nombre completo", maxLength: 120 })}
      {field("phone", "Teléfono", Phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "Ej. 33 1234 5678", maxLength: 30 })}
      {field("email", "Correo electrónico", Mail, { type: "email", inputMode: "email", autoComplete: "email", placeholder: "tucorreo@ejemplo.com", maxLength: 254 })}

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="lead-website">Sitio web</label>
        <input id="lead-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <div className="consent-field">
        <label className="consent-row" htmlFor="lead-consent">
          <input
            id="lead-consent"
            type="checkbox"
            checked={values.privacy_consent}
            onChange={(e) => set("privacy_consent", e.target.checked)}
            aria-invalid={Boolean(errors.privacy_consent)}
            aria-describedby={errors.privacy_consent ? "lead-consent-error" : undefined}
          />
          <span className="checkbox-box">
            <Check size={15} aria-hidden="true" />
          </span>
          <span>
            Acepto el{" "}
            <Link to="/privacidad" target="_blank" rel="noopener">
              aviso de privacidad
            </Link>
            .
          </span>
        </label>
        {errors.privacy_consent && (
          <p id="lead-consent-error" className="field-error">
            {errors.privacy_consent}
          </p>
        )}
      </div>

      {requestError && (
        <p className="form-error" role="alert">
          {requestError}
        </p>
      )}
      <UiButton type="submit" loading={submitting} loadingLabel="Enviando…">
        Enviar mis datos <span aria-hidden="true">→</span>
      </UiButton>
    </form>
  );
}
