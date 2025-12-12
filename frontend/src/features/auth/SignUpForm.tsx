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
    <section
      style={{
        marginTop: "1.5rem",
        padding: "1rem 1.25rem",
        borderRadius: "0.75rem",
        border: "1px solid #1f2933",
        background: "#020617",
        maxWidth: 360,
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
        Create account
      </h2>

      <div
        style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}
      >
        <button
          onClick={switchToLogin}
          style={{
            flex: 1,
            padding: "0.4rem 0.5rem",
            borderRadius: "999px",
            border: "1px solid #38bdf8",
            background: "transparent",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Login
        </button>

        <button
          style={{
            flex: 1,
            padding: "0.4rem 0.5rem",
            borderRadius: "999px",
            border: "1px solid #38bdf8",
            background: "#38bdf8",
            color: "#020617",
            fontSize: "0.8rem",
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem" }}>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.8rem",
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem" }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.8rem",
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem" }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.8rem",
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.45rem 0.75rem",
            borderRadius: "999px",
            border: "none",
            background: "#22c55e",
            color: "#020617",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Create account
        </button>
      </form>
    </section>
  );
}
