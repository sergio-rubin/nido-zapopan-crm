import { describe, expect, it } from "vitest";

import {
  countByStatus,
  filterLeads,
  isAllowedOrigin,
  sortLeadsDesc,
  validateLeadInput,
  whatsappUrl,
  type LeadStatus,
} from "@/lib/leads";

describe("create-lead contract", () => {
  it("normaliza un alta válida", () => {
    const r = validateLeadInput({ name: "  Ana   López ", phone: "33 1234-5678", email: " Ana@Example.COM " });
    expect(r).toEqual({ ok: true, honeypot: false, data: { name: "Ana López", phone: "3312345678", email: "ana@example.com" } });
  });

  it("conserva el + internacional", () => {
    const r = validateLeadInput({ name: "Ana", phone: "+52 33 1234 5678", email: "a@b.mx" });
    expect(r.ok && r.data.phone).toBe("+523312345678");
  });

  it("rechaza correo inválido, teléfono corto y nombre vacío", () => {
    const r = validateLeadInput({ name: " ", phone: "123", email: "correo-invalido" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "name", "phone"]);
  });

  it("rechaza campos extra como status o note", () => {
    const r = validateLeadInput({ name: "Ana", phone: "3312345678", email: "a@b.mx", status: "Le interesa" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["status"]).toBeDefined();
  });

  it("limita longitudes", () => {
    expect(validateLeadInput({ name: "a".repeat(121), phone: "3312345678", email: "a@b.mx" }).ok).toBe(false);
    expect(validateLeadInput({ name: "Ana", phone: "1".repeat(16), email: "a@b.mx" }).ok).toBe(false);
    expect(validateLeadInput({ name: "Ana", phone: "3312345678", email: `${"a".repeat(250)}@b.mx` }).ok).toBe(false);
  });

  it("acepta los campos del frontend Vue y detecta el honeypot", () => {
    const r = validateLeadInput({ name: "Ana", phone: "3312345678", email: "a@b.mx", privacy_consent: true, website: "spam.com" });
    expect(r.ok && r.honeypot).toBe(true);
  });

  it("rechaza cuerpos que no son objeto", () => {
    expect(validateLeadInput([]).ok).toBe(false);
    expect(validateLeadInput("x").ok).toBe(false);
  });
});

describe("CORS", () => {
  it("permite la landing existente, previews del proyecto y el mismo host", () => {
    expect(isAllowedOrigin("https://blender-application.wacoding.org")).toBe(true);
    expect(isAllowedOrigin("https://id-preview--65f11c62-5f1a-48fe-af81-5790b8468b8c.lovable.app")).toBe(true);
    expect(isAllowedOrigin("https://nido.lovable.app", ["nido.lovable.app"])).toBe(true);
  });
  it("bloquea otros orígenes", () => {
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("https://blender-application.wacoding.org.evil.example")).toBe(false);
    expect(isAllowedOrigin("https://other-project.lovable.app")).toBe(false);
  });
});

describe("CRM", () => {
  it("construye la URL de WhatsApp sólo con dígitos y prefijo 52 para números de 10 dígitos", () => {
    const url = whatsappUrl("(33) 1234-5678", "Ana López");
    expect(url.startsWith("https://wa.me/523312345678?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1]!)).toContain("Hola Ana");
    expect(whatsappUrl("+52 1 33 1234 5678", "X").startsWith("https://wa.me/5213312345678?")).toBe(true);
  });

  it("ordena del más reciente al más antiguo", () => {
    const sorted = sortLeadsDesc([
      { id: "a", created_at: "2026-10-01T10:00:00Z" },
      { id: "c", created_at: "2026-10-03T10:00:00Z" },
      { id: "b", created_at: "2026-10-02T10:00:00Z" },
    ]);
    expect(sorted.map((l) => l.id)).toEqual(["c", "b", "a"]);
  });

  const leads: { name: string; status: LeadStatus }[] = [
    { name: "Ana López", status: "Nuevo" },
    { name: "José Pérez", status: "Contactado" },
    { name: "Ana María", status: "Le interesa" },
    { name: "Luis", status: "Nuevo" },
  ];

  it("cuenta por estado", () => {
    expect(countByStatus(leads)).toEqual({ Nuevo: 2, Contactado: 1, "Le interesa": 1, Descartado: 0 });
  });

  it("filtra por estado y nombre sin importar acentos", () => {
    expect(filterLeads(leads, "Todos", "ana").length).toBe(2);
    expect(filterLeads(leads, "Nuevo", "ana").length).toBe(1);
    expect(filterLeads(leads, "Todos", "jose").length).toBe(1);
  });
});
