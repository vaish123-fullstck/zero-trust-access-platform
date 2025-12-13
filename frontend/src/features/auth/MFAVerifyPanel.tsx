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
    <section>
      <div
        style={{
          marginBottom: "0.9rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.2rem 0.65rem",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, rgba(56,189,248,0.18), rgba(34,197,94,0.18))",
            fontSize: "0.75rem",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "999px",
              background: "#22c55e",
            }}
          />
          Step 2 · Multi‑factor verification
        </div>
        <h2
          style={{
            fontSize: "1.05rem",
            marginTop: "0.7rem",
            marginBottom: "0.25rem",
          }}
        >
          Enter your one‑time code
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            opacity: 0.75,
          }}
        >
          Hi {mfa.user.full_name}. Open your authenticator app and enter the
          current 6‑digit code to finish signing in.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label
          style={{
            fontSize: "0.78rem",
            display: "block",
            marginBottom: "0.35rem",
            opacity: 0.9,
          }}
        >
          One‑time code
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123 456"
          style={{
            width: "100%",
            marginBottom: "0.7rem",
            padding: "0.5rem 0.7rem",
            borderRadius: "0.7rem",
            border: "1px solid #1f2933",
            background: "#020617",
            color: "#e5e7eb",
            letterSpacing: "0.25em",
            textAlign: "center",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />

        {error && (
          <p
            style={{
              color: "#f97316",
              fontSize: "0.8rem",
              marginBottom: "0.5rem",
            }}
          >
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
              borderRadius: "0.9rem",
              border: "none",
              background:
                "linear-gradient(90deg, #22c55e, #38bdf8)",
              color: "#020617",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor:
                submitting || code.length !== 6 ? "not-allowed" : "pointer",
              opacity: submitting || code.length !== 6 ? 0.5 : 1,
              boxShadow: "0 10px 26px rgba(34,197,94,0.35)",
            }}
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.9rem",
              border: "1px solid #374151",
              background: "transparent",
              color: "#9ca3af",
              fontSize: "0.8rem",
              cursor: "pointer",
              minWidth: 80,
            }}
          >
            Back
          </button>
        </div>

        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            opacity: 0.65,
          }}
        >
          Codes change every 30 seconds. Make sure your device time is in sync.
        </p>
      </form>
    </section>
  );
}
