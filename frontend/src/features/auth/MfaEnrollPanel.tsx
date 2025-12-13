import { QRCodeSVG } from "qrcode.react";

type Props = {
  otpauthUrl: string;
  secret: string;
  onContinue: () => void; // move to code entry screen
};

export function MfaEnrollPanel({ otpauthUrl, secret, onContinue }: Props) {
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
              background: "#38bdf8",
            }}
          />
          Step 1 · Enroll authenticator
        </div>
        <h2
          style={{
            fontSize: "1.05rem",
            marginTop: "0.7rem",
            marginBottom: "0.25rem",
          }}
        >
          Set up your authenticator app
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            opacity: 0.8,
          }}
        >
          Use Microsoft Authenticator, Google Authenticator, or any TOTP app to
          link your account before continuing.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "0.9rem",
        }}
      >
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.9rem",
            background: "#020617",
            border: "1px solid #1f2933",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          }}
        >
          <QRCodeSVG value={otpauthUrl} size={190} />
        </div>
      </div>

      <ol
        style={{
          fontSize: "0.78rem",
          opacity: 0.85,
          margin: "0 0 0.9rem 1.1rem",
          padding: 0,
        }}
      >
        <li>Open your authenticator app.</li>
        <li>Choose “Add account” → “Other” or “Scan QR code”.</li>
        <li>Scan the QR code above.</li>
      </ol>

      <p
        style={{
          fontSize: "0.75rem",
          opacity: 0.8,
          wordBreak: "break-all",
          marginBottom: "0.9rem",
        }}
      >
        If you can’t scan, add it manually using this key:{" "}
        <code
          style={{
            fontSize: "0.74rem",
            padding: "0.15rem 0.35rem",
            borderRadius: "0.4rem",
            background: "#020617",
            border: "1px solid #1f2933",
          }}
        >
          {secret}
        </code>
      </p>

      <button
        type="button"
        onClick={onContinue}
        style={{
          width: "100%",
          padding: "0.55rem 0.8rem",
          borderRadius: "0.9rem",
          border: "none",
          background:
            "linear-gradient(90deg, #22c55e, #38bdf8)",
          color: "#020617",
          fontSize: "0.86rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 12px 30px rgba(34,197,94,0.35)",
        }}
      >
        I’ve added it, continue
      </button>
    </section>
  );
}
