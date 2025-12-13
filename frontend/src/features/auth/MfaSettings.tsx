import { useState } from "react";
import type { AuthUser, AuthResponse } from "../../lib/api";
import { MfaEnrollPanel } from "./MfaEnrollPanel";
import { MfaVerifyPanel, type MfaState } from "./MFAVerifyPanel";

type Props = {
  token: string;
  user: AuthUser;
  onFinalAuth: (res: AuthResponse) => void;
};

export function MfaSettings({ token, user, onFinalAuth }: Props) {
  const [enrollData, setEnrollData] = useState<{
    otpauth_url: string;
    secret: string;
  } | null>(null);
  const [showVerify, setShowVerify] = useState(false);

  const [mfa, setMfa] = useState<MfaState>({
    active: false,
    tempToken: null,
    user: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startEnroll() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("http://localhost:8080/auth/mfa/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Failed to start MFA enrollment.");
        return;
      }

      const data = (await res.json()) as { otpauth_url: string; secret: string };
      setEnrollData(data);
      setShowVerify(false);
    } catch (e: any) {
      setError(e.message ?? "Failed to start MFA enrollment.");
    } finally {
      setLoading(false);
    }
  }

  function goToVerify() {
    if (!enrollData) return;
    setMfa({
      active: true,
      tempToken: token, // reuse current token for initial verify
      user,
    });
    setShowVerify(true);
  }

  return (
    <section
      style={{
        padding: "1.1rem 1.2rem",
        borderRadius: "0.9rem",
        border: "1px solid #1f2933",
        background:
          "radial-gradient(circle at top left, #020617, #020617 55%, #020617)",
        maxWidth: 480,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 0, #38bdf8, #0f172a 60%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
          }}
        >
          🔐
        </div>
        <div>
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>
            Multi‑factor authentication
          </h2>
          <p
            style={{
              fontSize: "0.8rem",
              opacity: 0.8,
              margin: 0,
            }}
          >
            Add a one‑time code step when you sign in to this console.
          </p>
        </div>
      </div>

      {!enrollData && !showVerify && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={startEnroll}
            disabled={loading}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              background:
                "linear-gradient(90deg, #22c55e, #38bdf8)",
              color: "#020617",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 10px 26px rgba(34,197,94,0.35)",
            }}
          >
            {loading ? "Preparing setup..." : "Enable MFA"}
          </button>
          <p
            style={{
              marginTop: "0.45rem",
              fontSize: "0.78rem",
              opacity: 0.7,
            }}
          >
            Recommended for all admins and anyone with access to sensitive
            environments.
          </p>
        </div>
      )}

      {enrollData && !showVerify && (
        <div style={{ marginTop: "0.75rem" }}>
          <MfaEnrollPanel
            otpauthUrl={enrollData.otpauth_url}
            secret={enrollData.secret}
            onContinue={goToVerify}
          />
        </div>
      )}

      {showVerify && mfa.active && (
        <div style={{ marginTop: "0.75rem" }}>
          <MfaVerifyPanel
            mfa={mfa}
            onSuccess={(res) => onFinalAuth(res)}
            onCancel={() => {
              setShowVerify(false);
              setMfa({ active: false, tempToken: null, user: null });
            }}
          />
        </div>
      )}

      {error && (
        <p
          style={{
            marginTop: "0.6rem",
            fontSize: "0.8rem",
            color: "#f97316",
          }}
        >
          {error}
        </p>
      )}
    </section>
  );
}
