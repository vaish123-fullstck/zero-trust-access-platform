import React from "react";

type Props = {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  switchToLogin: () => void;
};

export function SignupForm({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  switchToLogin,
}: Props) {
  return (
    <section>
      {/* Tab buttons */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "0.5rem",
          padding: "0.15rem",
          borderRadius: "999px",
          background: "#020617",
          border: "1px solid #1f2933",
        }}
      >
        <button
          type="button"
          onClick={switchToLogin}
          style={{
            flex: 1,
            padding: "0.4rem 0.5rem",
            borderRadius: "999px",
            border: "none",
            background: "transparent",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Login
        </button>

        <button
          type="button"
          style={{
            flex: 1,
            padding: "0.4rem 0.5rem",
            borderRadius: "999px",
            border: "none",
            background:
              "linear-gradient(90deg, #38bdf8, #22c55e)",
            color: "#020617",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              fontSize: "0.78rem",
              display: "block",
              marginBottom: "0.25rem",
              opacity: 0.85,
            }}
          >
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem",
              borderRadius: "0.6rem",
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              fontSize: "0.78rem",
              display: "block",
              marginBottom: "0.25rem",
              opacity: 0.85,
            }}
          >
            Work email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem",
              borderRadius: "0.6rem",
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <label
            style={{
              fontSize: "0.78rem",
              display: "block",
              marginBottom: "0.25rem",
              opacity: 0.85,
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem",
              borderRadius: "0.6rem",
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
          <div
            style={{
              marginTop: "0.25rem",
              fontSize: "0.72rem",
              opacity: 0.6,
            }}
          >
            Use at least 12 characters, including a symbol and a number.
          </div>
        </div>

        <button
          type="submit"
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
          Create account
        </button>

        <p
          style={{
            marginTop: "0.6rem",
            fontSize: "0.75rem",
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          Your account will use MFA for sensitive actions by default.
        </p>
      </form>
    </section>
  );
}
