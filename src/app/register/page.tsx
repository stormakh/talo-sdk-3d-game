"use client";

import { useState, useEffect } from "react";

type RegistrationState =
  | { step: "form" }
  | {
      step: "payment";
      registrationId: string;
      paymentAlias: string | null;
      paymentCvu: string | null;
      xHandle: string;
    }
  | { step: "confirmed"; xHandle: string };

export default function RegisterPage() {
  const [state, setState] = useState<RegistrationState>({ step: "form" });
  const [xHandle, setXHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = xHandle.replace(/^@/, "").trim();
  const avatarUrl = handle
    ? `https://unavatar.io/x/${handle}`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xHandle: handle }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar");
      }

      const data = await res.json();
      setState({
        step: "payment",
        registrationId: data.registrationId,
        paymentAlias: data.paymentAlias,
        paymentCvu: data.paymentCvu,
        xHandle: handle,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  // Poll for confirmation
  useEffect(() => {
    if (state.step !== "payment") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/register?id=${state.registrationId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "confirmed") {
            setState({ step: "confirmed", xHandle: state.xHandle });
          }
        }
      } catch {
        // Retry on next interval
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [state]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      <a
        href="/"
        className="mb-8 self-start text-sm transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        &larr; Volver al Lobby
      </a>

      <h1
        className="mb-2 text-3xl md:text-4xl"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--text-primary)",
        }}
      >
        Registrar tu @
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        Pagá una vez, usalo en todas las carreras.
      </p>

      {state.step === "form" && (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={handle}
                className="h-12 w-12 rounded-full border-2"
                style={{ borderColor: "var(--border-gold)" }}
              />
            )}
            <div className="flex-1">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Tu @ de X
              </label>
              <input
                type="text"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                placeholder="@tuusuario"
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-sm" style={{ color: "var(--error, #ef4444)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!handle || submitting}
            className="cursor-pointer rounded px-6 py-2.5 text-sm font-semibold tracking-wider uppercase transition-colors disabled:opacity-50"
            style={{
              background: "var(--accent-gold)",
              color: "var(--bg-deep)",
            }}
          >
            {submitting ? "Creando pago..." : "Registrarme por $10 ARS"}
          </button>
        </form>
      )}

      {state.step === "payment" && (
        <div className="w-full max-w-sm">
          <div
            className="rounded-lg border p-5"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-gold)",
            }}
          >
            <p className="label mb-3 text-center">
              Transferi $10 ARS para confirmar
            </p>

            {state.paymentAlias && (
              <div className="mb-3">
                <p
                  className="mb-1 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Alias
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 rounded px-3 py-2 font-mono text-sm"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-gold)",
                    }}
                  >
                    {state.paymentAlias}
                  </code>
                  <button
                    onClick={() => copyToClipboard(state.paymentAlias!)}
                    className="cursor-pointer rounded px-3 py-2 text-xs uppercase tracking-wider transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {state.paymentCvu && (
              <div>
                <p
                  className="mb-1 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  CVU
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 rounded px-3 py-2 font-mono text-sm"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-gold)",
                    }}
                  >
                    {state.paymentCvu}
                  </code>
                  <button
                    onClick={() => copyToClipboard(state.paymentCvu!)}
                    className="cursor-pointer rounded px-3 py-2 text-xs uppercase tracking-wider transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <p
              className="mt-3 text-center text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Esperando tu transferencia...
            </p>
          </div>
        </div>
      )}

      {state.step === "confirmed" && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: "var(--bg-surface)" }}
          >
            <span className="text-3xl" style={{ color: "var(--success)" }}>
              ✓
            </span>
          </div>
          <p className="text-center text-lg" style={{ color: "var(--text-primary)" }}>
            Tu @ fue registrada.
          </p>
          <p
            className="text-center text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            En tus proximas carreras vas a aparecer como{" "}
            <span style={{ color: "var(--text-gold)" }}>@{state.xHandle}</span>
          </p>
          <a
            href="/"
            className="mt-4 rounded border px-6 py-2 text-sm tracking-wider uppercase transition-colors"
            style={{
              borderColor: "var(--border-gold)",
              color: "var(--text-gold)",
            }}
          >
            Volver al Lobby
          </a>
        </div>
      )}
    </div>
  );
}
