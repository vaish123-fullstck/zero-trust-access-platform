
import { QRCodeSVG } from "qrcode.react";

type Props = {
  otpauthUrl: string;
  secret: string;
  onContinue: () => void; // move to code entry screen
};

export function MfaEnrollPanel({ otpauthUrl, secret, onContinue }: Props) {
  return (
    <section
      style={{
        marginTop: "1.5rem",
        padding: "1.25rem 1.5rem",
        borderRadius: "0.9rem",
        border: "1px solid #1f2933",
        background:
          "radial-gradient(circle at top left, #1f2937, #020617 55%, #020617)",
        maxWidth: 380,
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
      }}
    >
      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.4rem" }}>
        Set up authenticator app
      </h2>
      <p
        style={{
          fontSize: "0.8rem",
          opacity: 0.8,
          marginBottom: "0.9rem",
        }}
      >
        1. Open Microsoft Authenticator (or Google/Authy).{" "}
        2. Choose “Add account” → “Other account”.{" "}
        3. Scan this QR code.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "0.85rem",
        }}
      >
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "#020617",
            border: "1px solid #1f2933",
          }}
        >
          <QRCodeSVG value={otpauthUrl} size={190} />
        </div>
      </div>

      <p
        style={{
          fontSize: "0.75rem",
          opacity: 0.8,
          wordBreak: "break-all",
          marginBottom: "0.9rem",
        }}
      >
        If you can’t scan, add account manually using this key:{" "}
        <code>{secret}</code>
      </p>

      <button
        type="button"
        onClick={onContinue}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          borderRadius: "999px",
          border: "none",
          background: "#22c55e",
          color: "#020617",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        I’ve added it, continue
      </button>
    </section>
  );
}
