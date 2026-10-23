import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

import { InterestForm } from "@/components/nido/InterestForm";

afterEach(() => vi.unstubAllGlobals());

function fill(email = "ana@example.com") {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana López" } });
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "33 1234 5678" } });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: email } });
  fireEvent.click(screen.getByLabelText(/Acepto el/));
}

describe("InterestForm", () => {
  it("bloquea el envío inválido y no llama al servidor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<InterestForm onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Enviar mis datos/ }));
    expect(await screen.findByText("Escribe tu nombre completo.")).toBeInTheDocument();
    expect(screen.getByText("Escribe un teléfono válido.")).toBeInTheDocument();
    expect(screen.getByText("Escribe un correo válido.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía a create-lead y muestra el mensaje exacto", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, message: "Gracias, te contactaremos pronto" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<InterestForm onClose={() => {}} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: /Enviar mis datos/ }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Gracias, te contactaremos pronto"));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/public/create-lead");
    expect(JSON.parse(init.body)).toEqual({ name: "Ana López", phone: "33 1234 5678", email: "ana@example.com" });
  });
});
