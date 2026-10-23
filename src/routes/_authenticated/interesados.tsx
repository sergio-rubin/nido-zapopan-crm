import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, LogOut, MessageCircle, RefreshCw, Search, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { UiButton } from "@/components/nido/UiButton";
import { supabase } from "@/integrations/supabase/client";
import {
  LEAD_STATUSES,
  NOTE_MAX,
  countByStatus,
  filterLeads,
  whatsappUrl,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/interesados")({
  head: () => ({
    meta: [
      { title: "Interesados · NIDO Zapopan" },
      { name: "description", content: "Seguimiento de personas interesadas en el departamento de Zapopan." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Interesados · NIDO Zapopan" },
      { property: "og:description", content: "Panel privado del equipo de ventas." },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadsPage,
});

const LEADS_KEY = ["leads"] as const;

async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at, updated_at, name, phone, email, status, note")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("No pudimos cargar los interesados.");
  return data as Lead[];
}

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const statusSlug = (s: LeadStatus) => s.toLowerCase().replace(/\s+/g, "-");

function LeadsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const leads = useQuery({ queryKey: LEADS_KEY, queryFn: fetchLeads });
  const [status, setStatus] = useState<LeadStatus | "Todos">("Todos");
  const [search, setSearch] = useState("");

  const all = leads.data ?? [];
  const counts = useMemo(() => countByStatus(all), [all]);
  const visible = useMemo(() => filterLeads(all, status, search), [all, status, search]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <main id="main-content" className="leads-page">
      <section className="leads-workspace" aria-labelledby="leads-title">
        <div className="leads-heading">
          <div>
            <h1 id="leads-title">Interesados</h1>
            <p>Personas que solicitaron información sobre este departamento, del más reciente al más antiguo.</p>
          </div>
          <div className="session-actions">
            <UiButton variant="outline" loading={leads.isFetching && !leads.isPending} loadingLabel="Actualizando…" onClick={() => leads.refetch()}>
              <RefreshCw size={17} aria-hidden="true" /> Actualizar
            </UiButton>
            <UiButton variant="ghost" onClick={signOut}>
              <LogOut size={17} aria-hidden="true" /> Cerrar sesión
            </UiButton>
          </div>
        </div>

        <ul className="crm-summary" aria-label="Resumen por estado">
          <li>
            <button type="button" aria-pressed={status === "Todos"} onClick={() => setStatus("Todos")}>
              <span>Total</span>
              <strong>{leads.isPending ? "—" : all.length}</strong>
            </button>
          </li>
          {LEAD_STATUSES.map((s) => (
            <li key={s}>
              <button type="button" aria-pressed={status === s} onClick={() => setStatus(s)} data-status={statusSlug(s)}>
                <span>{s}</span>
                <strong>{leads.isPending ? "—" : counts[s]}</strong>
              </button>
            </li>
          ))}
        </ul>

        <div className="crm-toolbar">
          <div className="lead-search">
            <label htmlFor="lead-search">Buscar por nombre</label>
            <div className="input-wrap">
              <Search size={18} aria-hidden="true" />
              <input id="lead-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ej. Ana" />
            </div>
          </div>
          <div className="lead-search">
            <label htmlFor="status-filter">Filtrar por estado</label>
            <div className="input-wrap">
              <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | "Todos")}>
                <option value="Todos">Todos los estados</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {leads.isPending ? (
          <div aria-busy="true">
            <p className="sr-only" role="status">
              Cargando interesados…
            </p>
            <div className="crm-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="lead-card is-skeleton" aria-hidden="true">
                  <span /> <span /> <span />
                </div>
              ))}
            </div>
          </div>
        ) : leads.isError ? (
          <div className="empty-state" role="alert">
            <p>{leads.error.message}</p>
            <UiButton variant="outline" onClick={() => leads.refetch()}>
              Reintentar
            </UiButton>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <UsersRound size={34} strokeWidth={1.3} aria-hidden="true" />
            {all.length === 0 ? (
              <p>Aún no hay interesados. Los registros del formulario “Me interesa” aparecerán aquí.</p>
            ) : (
              <>
                <p>Ningún interesado coincide con los filtros.</p>
                <UiButton
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatus("Todos");
                  }}
                >
                  Limpiar filtros
                </UiButton>
              </>
            )}
          </div>
        ) : (
          <ol className="crm-list" aria-label="Interesados, del más reciente al más antiguo">
            {visible.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Lead, "status" | "note">> }) => {
      const { data, error } = await supabase.from("leads").update(patch).eq("id", id).select("id, status, note, updated_at").single();
      if (error) throw new Error("No se pudo guardar el cambio.");
      return data;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: LEADS_KEY });
      const previous = queryClient.getQueryData<Lead[]>(LEADS_KEY);
      queryClient.setQueryData<Lead[]>(LEADS_KEY, (old) => old?.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(LEADS_KEY, ctx.previous);
      toast.error(error.message);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Lead[]>(LEADS_KEY, (old) => old?.map((l) => (l.id === data.id ? { ...l, ...data } as Lead : l)));
    },
  });
}

function LeadCard({ lead }: { lead: Lead }) {
  const update = useUpdateLead();
  const [note, setNote] = useState(lead.note);
  const [noteState, setNoteState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = note !== lead.note;

  useEffect(() => {
    if (noteState !== "saving") setNote(lead.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.note]);

  function changeStatus(next: LeadStatus) {
    update.mutate(
      { id: lead.id, patch: { status: next } },
      { onSuccess: () => toast.success(`${lead.name}: estado “${next}”`) },
    );
  }

  function saveNote() {
    setNoteState("saving");
    update.mutate(
      { id: lead.id, patch: { note } },
      {
        onSuccess: () => setNoteState("saved"),
        onError: () => setNoteState("error"),
      },
    );
  }

  const noteId = `note-${lead.id}`;
  const statusId = `status-${lead.id}`;

  return (
    <li className="lead-card" data-status={statusSlug(lead.status)}>
      <div className="lead-card-main">
        <time dateTime={lead.created_at}>{dateFormat.format(new Date(lead.created_at))}</time>
        <h2>{lead.name}</h2>
        <div className="lead-contacts">
          <a href={`tel:${lead.phone}`}>{lead.phone}</a>
          <a href={`mailto:${lead.email}`}>{lead.email}</a>
        </div>
      </div>

      <div className="lead-card-controls">
        <div className="lead-field">
          <label htmlFor={statusId}>Estado</label>
          <select id={statusId} className="status-select" value={lead.status} onChange={(e) => changeStatus(e.target.value as LeadStatus)}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <a className="ui-button is-outline whatsapp-link" href={whatsappUrl(lead.phone, lead.name)} target="_blank" rel="noopener noreferrer">
          <span className="button-content">
            <MessageCircle size={17} aria-hidden="true" /> WhatsApp
          </span>
        </a>
      </div>

      <div className="lead-note">
        <label htmlFor={noteId}>Nota</label>
        <textarea
          id={noteId}
          value={note}
          maxLength={NOTE_MAX}
          rows={2}
          placeholder="Ej. Prefiere llamada por la tarde"
          onChange={(e) => {
            setNote(e.target.value);
            setNoteState("idle");
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && dirty) saveNote();
          }}
        />
        <div className="lead-note-actions">
          <span className="note-status" role="status" aria-live="polite">
            {noteState === "saving"
              ? "Guardando…"
              : noteState === "error"
                ? "No se guardó. Intenta de nuevo."
                : dirty
                  ? "Cambios sin guardar"
                  : noteState === "saved"
                    ? (
                      <>
                        <Check size={14} aria-hidden="true" /> Guardado
                      </>
                    )
                    : ""}
          </span>
          <UiButton variant="outline" className="is-compact" onClick={saveNote} disabled={!dirty} loading={noteState === "saving"} loadingLabel="Guardando…">
            Guardar nota
          </UiButton>
        </div>
      </div>
    </li>
  );
}
