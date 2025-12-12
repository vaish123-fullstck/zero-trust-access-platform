import  { useState } from "react";
import type { AuthUser } from "../../lib/api";
import { MfaEnrollPanel } from "./MfaEnrollPanel";
import { MfaVerifyPanel, type MfaState } from "./MFAVerifyPanel";

type Props = {
  token: string;
  user: AuthUser;
  onFinalAuth: (res: { token: string; user: AuthUser }) => void;
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

  async function startEnroll() {
    const res = await fetch("http://localhost:8080/auth/mfa/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // TODO: surface error
      return;
    }

    const data = (await res.json()) as { otpauth_url: string; secret: string };
    setEnrollData(data);
    setShowVerify(false);
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
    <section style={{ marginTop: "1.5rem" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
        Multi‑factor authentication
      </h2>
      <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.75rem" }}>
        Protect your account with a one‑time code from an authenticator app.
      </p>

      {!enrollData && !showVerify && (
        <button
          onClick={startEnroll}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid #38bdf8",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Enable MFA
        </button>
      )}

      {enrollData && !showVerify && (
        <MfaEnrollPanel
          otpauthUrl={enrollData.otpauth_url}
          secret={enrollData.secret}
          onContinue={goToVerify}
        />
      )}

      {showVerify && mfa.active && (
        <MfaVerifyPanel
          mfa={mfa}
          onSuccess={(res) => onFinalAuth(res)}
          onCancel={() => {
            setShowVerify(false);
            setMfa({ active: false, tempToken: null, user: null });
          }}
        />
      )}
    </section>
  );
}
