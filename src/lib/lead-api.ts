export class LeadApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const CREATE_LEAD_PATH = "/api/public/create-lead";

export async function createLead(input: { name: string; phone: string; email: string; website?: string }) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(CREATE_LEAD_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string; errors?: Record<string, string[]> }
      | null;
    if (!response.ok) {
      throw new LeadApiError(body?.message ?? "No pudimos enviar tus datos.", response.status, body?.errors);
    }
    return body;
  } catch (error) {
    if (error instanceof LeadApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LeadApiError("La solicitud tardó demasiado. Intenta de nuevo.", 408);
    }
    throw new LeadApiError("No pudimos conectar con el servidor.", 0);
  } finally {
    window.clearTimeout(timeout);
  }
}
