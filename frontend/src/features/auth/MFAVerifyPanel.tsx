import React, { useState } from "react";
import type { AuthUser, AuthResponse } from "../../lib/api";

export type MfaState = {
  active: boolean;
  tempToken: string | null;
  user: AuthUser | null;
};

type Props = {
  mfa: MfaState;
  onSuccess: (final: AuthResponse) => void;
  onCancel: () => void;
};

export function MfaVerifyPanel({ mfa, onSuccess, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mfa.active || !mfa.tempToken || !mfa.user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8080/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mfa.tempToken}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        setError("Invalid or expired code. Try again.");
        return;
      }

      const data = (await res.json()) as AuthResponse;
      if (!data.token || !data.user) {
        setError("MFA verification failed.");
        return;
      }
      onSuccess(data);
    } catch (err: any) {
      setError(err.message ?? "MFA verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      style={{
        marginTop: "1.5rem",
        padding: "1.25rem 1.5rem",
        borderRadius: "0.9rem",
        border: "1px solid #1f2933",
        background:
          "radial-gradient(circle at top left, #1f2937, #020617 55%, #020617)",
        maxWidth: 360,
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
      }}
    >
      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.3rem" }}>
        Multi‑factor authentication
      </h2>
      <p
        style={{
          fontSize: "0.8rem",
          opacity: 0.75,
          marginBottom: "0.9rem",
        }}
      >
        Hi {mfa.user.full_name}. Open your authenticator app and enter the
        current 6‑digit code.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: "0.8rem" }}>
          One‑time code
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            style={{
              width: "100%",
              marginTop: "0.35rem",
              marginBottom: "0.7rem",
              padding: "0.5rem 0.7rem",
              borderRadius: "0.6rem",
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              letterSpacing: "0.2em",
              textAlign: "center",
              fontSize: "0.95rem",
            }}
          />
        </label>

        {error && (
          <p style={{ color: "#f97316", fontSize: "0.8rem", marginBottom: 8 }}>
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "999px",
              border: "none",
              background: "#22c55e",
              color: "#020617",
              fontSize: "0.85rem",
              cursor:
                submitting || code.length !== 6 ? "not-allowed" : "pointer",
              opacity: submitting || code.length !== 6 ? 0.5 : 1,
            }}
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #374151",
              background: "transparent",
              color: "#9ca3af",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
