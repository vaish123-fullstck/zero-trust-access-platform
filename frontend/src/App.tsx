import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  fetchHealth,
  login,
  signup,
  type Health,
  type AuthUser,
  type AuthResponse,
  type Resource,
} from "./lib/api";
import { fetchUsers, updateUserRole } from "./lib/users";
import type { User } from "./lib/users";

import { LoginForm } from "./features/auth/LoginForm";
import { SignupForm } from "./features/auth/SignUpForm";
import {
  MfaVerifyPanel,
  type MfaState,
} from "./features/auth/MFAVerifyPanel";
import { MfaEnrollPanel } from "./features/auth/MfaEnrollPanel";
import { MfaSettings } from "./features/auth/MfaSettings";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

function NavItem({
  to,
  label,
  current,
}: {
  to: string;
  label: string;
  current: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        padding: "0.5rem 0.75rem",
        borderRadius: "0.5rem",
        textDecoration: "none",
        display: "block",
        color: current ? "#020617" : "#e5e7eb",
        background: current ? "#38bdf8" : "transparent",
        fontSize: "0.9rem",
      }}
    >
      {label}
    </Link>
  );
}

function AppShell({
  children,
  auth,
  onLogout,
}: {
  children: React.ReactNode;
  auth: AuthState;
  onLogout: () => void;
}) {
  const location = useLocation();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f172a, #020617)",
        color: "#e5e7eb",
      }}
    >
      <aside
        style={{
          width: 240,
          borderRight: "1px solid #1f2933",
          padding: "1.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          backdropFilter: "blur(12px)",
          background: "rgba(15,23,42,0.8)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Zero Trust Console
          </h1>
          <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>
            Demoing policies, least privilege, and audit.
          </p>
        </div>

        <nav
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <NavItem to="/" label="Overview" current={location.pathname === "/"} />
          <NavItem
            to="/resources"
            label="My Resources"
            current={location.pathname.startsWith("/resources")}
          />
          <NavItem
            to="/users"
            label="Users"
            current={location.pathname.startsWith("/users")}
          />
        </nav>

        <div style={{ marginTop: "auto", fontSize: "0.8rem", opacity: 0.7 }}>
          Zero Trust Access Platform
        </div>
      </aside>

      <main style={{ flex: 1, padding: "1.5rem 2rem" }}>
        <header
          style={{
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div />
          {auth.user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
                <div>{auth.user.full_name}</div>
                <div style={{ opacity: 0.7 }}>{auth.user.role}</div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "999px",
                  border: "1px solid #f97316",
                  background: "transparent",
                  color: "#f97316",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          ) : null}
        </header>

        {children}
      </main>
    </div>
  );
}

// Pages

function OverviewPage({
  health,
  users,
  error,
  auth,
  onFinalAuth,
}: {
  health: Health | null;
  users: User[];
  error: string | null;
  auth: AuthState;
  onFinalAuth: (res: AuthResponse) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          System status
        </h2>
        {health ? (
          <pre
            style={{
              background: "#020617",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              fontSize: "0.8rem",
              border: "1px solid #1f2933",
            }}
          >
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>Loading health...</p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Users</h2>
        {users.length === 0 ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>No users loaded yet.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.5rem",
            }}
          >
            {users.map((u) => (
              <li
                key={u.id}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  fontSize: "0.85rem",
                }}
              >
                {u.full_name} ({u.email}) – {u.role}
              </li>
            ))}
          </ul>
        )}
      </section>

      {auth.user && auth.token && (
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            Security
          </h2>
          <MfaSettings
            token={auth.token}
            user={auth.user}
            onFinalAuth={onFinalAuth}
          />
        </section>
      )}

      {error && <p style={{ color: "#f97316" }}>Error: {error}</p>}
    </div>
  );
}

function UsersPage({
  auth,
  users,
  onRoleChange,
}: {
  auth: AuthState;
  users: User[];
  onRoleChange: (id: number, role: "user" | "admin") => void;
}) {
  if (!auth.user || auth.user.role !== "admin") {
    return <p>You must be an admin to manage users.</p>;
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Users</h2>
      <table
        style={{
          width: "100%",
          fontSize: "0.85rem",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Email</th>
            <th align="left">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) =>
                    onRoleChange(
                      u.id,
                      e.target.value === "admin" ? "admin" : "user",
                    )
                  }
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyResourcesPage({ auth }: { auth: AuthState }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    setLoading(true);
    import("./lib/api")
      .then((m) => m.fetchResources(auth.token as string))
      .then(setResources)
      .catch((err) => setError(err.message ?? "Failed to load resources"))
      .finally(() => setLoading(false));
  }, [auth.token]);

  if (!auth.user || !auth.token) {
    return <p style={{ fontSize: "0.9rem" }}>Sign in to view your resources.</p>;
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>My Resources</h2>
      <p
        style={{
          fontSize: "0.85rem",
          opacity: 0.8,
          marginBottom: "1rem",
        }}
      >
        These are the resources you are allowed to access based on current
        policies.
      </p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#f97316" }}>{error}</p>}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {resources.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "1px solid #1f2933",
                background: "#020617",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                {r.name}
              </div>
              <div style={{ opacity: 0.75 }}>{r.type}</div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                Sensitivity: <strong>{r.sensitivity}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Root App

const App: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auth, setAuth] = useState<AuthState>({ token: null, user: null });
  const [error, setError] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const [mfa, setMfa] = useState<MfaState>({
    active: false,
    tempToken: null,
    user: null,
  });

  const [needsEnroll, setNeedsEnroll] = useState(false);
  const [enrollData, setEnrollData] = useState<{
    otpauth_url: string;
    secret: string;
  } | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => setError(err.message));

    const saved = localStorage.getItem("zt_token");
    const savedUser = localStorage.getItem("zt_user");
    if (saved && savedUser) {
      setAuth({ token: saved, user: JSON.parse(savedUser) });
    }
  }, []);

  useEffect(() => {
    if (!auth.token) {
      setUsers([]);
      return;
    }
    fetchUsers(auth.token)
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, [auth.token]);

  const handleFinalAuth = (res: AuthResponse) => {
    if (!res.token || !res.user) {
      setError("Login did not return a token");
      return;
    }
    setAuth({ token: res.token, user: res.user });
    localStorage.setItem("zt_token", res.token);
    localStorage.setItem("zt_user", JSON.stringify(res.user));
    setError(null);
    setMfa({ active: false, tempToken: null, user: null });
    setNeedsEnroll(false);
    setEnrollData(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login(email, password);

      if (res.mfa_required) {
        const temp = res.temp_token;
        if (!temp || !res.user) {
          setError("MFA flow returned invalid data");
          return;
        }

        setNeedsEnroll(!!res.enrollment_required);
        setMfa({
          active: true,
          tempToken: temp,
          user: res.user,
        });
        setError(null);
        return;
      }

      // Fallback (should not happen with mandatory MFA)
      handleFinalAuth(res);
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await signup(fullName, email, password);
      // With your current backend, signup returns a token.
      // You can either accept that as fully logged-in or
      // force a fresh login+MFA. For now, keep as-is:
      handleFinalAuth(res);
    } catch (err: any) {
      setError(err.message ?? "Signup failed");
    }
  };

  const handleLogout = () => {
    setAuth({ token: null, user: null });
    setUsers([]);
    localStorage.removeItem("zt_token");
    localStorage.removeItem("zt_user");
    setMfa({ active: false, tempToken: null, user: null });
    setNeedsEnroll(false);
    setEnrollData(null);
  };

  const handleUserRoleChange = async (id: number, role: "user" | "admin") => {
    if (!auth.token) return;
    try {
      const updated = await updateUserRole(auth.token, id, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u)),
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to update role");
    }
  };

  const isAuthed = !!auth.user && !!auth.token;

  // ---------- Unauthenticated: full-screen auth (login/signup + MFA) ----------
  if (!isAuthed) {
    // helper to start enrollment during login MFA
    const startLoginEnroll = async () => {
      if (!mfa.tempToken) return;
      try {
        const res = await fetch("http://localhost:8080/auth/mfa/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mfa.tempToken}`,
          },
        });
        if (!res.ok) {
          setError("Failed to start MFA enrollment.");
          return;
        }
        const data = (await res.json()) as {
          otpauth_url: string;
          secret: string;
        };
        setEnrollData(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to start MFA enrollment.");
      }
    };

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          background: "radial-gradient(circle at top, #0f172a, #020617)",
          color: "#e5e7eb",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#020617",
            borderRadius: "1.25rem",
            border: "1px solid #1f2933",
            padding: "2rem 2.25rem",
            boxShadow: "0 24px 80px rgba(15,23,42,0.8)",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(56,189,248,0.15), rgba(249,115,22,0.15))",
                fontSize: "0.75rem",
                color: "#e5e7eb",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "999px",
                  background: "#22c55e",
                }}
              />
              Zero Trust Access Platform
            </div>
            <h1
              style={{
                marginTop: "0.9rem",
                fontSize: "1.6rem",
                fontWeight: 600,
              }}
            >
              Sign in to your console
            </h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
              Strong identity, MFA, and least‑privilege access in one place.
            </p>
          </div>

          {!mfa.active && authMode === "login" && (
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleLogin}
              switchToSignup={() => setAuthMode("signup")}
            />
          )}

          {!mfa.active && authMode === "signup" && (
            <SignupForm
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleSignup}
              switchToLogin={() => setAuthMode("login")}
            />
          )}

          {mfa.active && needsEnroll && (
            <>
              {!enrollData && (
                <button
                  type="button"
                  onClick={startLoginEnroll}
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
                    marginTop: "0.5rem",
                  }}
                >
                  Start MFA enrollment
                </button>
              )}

              {enrollData && (
                <MfaEnrollPanel
                  otpauthUrl={enrollData.otpauth_url}
                  secret={enrollData.secret}
                  onContinue={() => {
                    // after showing QR, go to verify
                    setNeedsEnroll(false);
                  }}
                />
              )}
            </>
          )}

          {mfa.active && !needsEnroll && (
            <MfaVerifyPanel
              mfa={mfa}
              onSuccess={handleFinalAuth}
              onCancel={() =>
                setMfa({ active: false, tempToken: null, user: null })
              }
            />
          )}

          {error && (
            <p
              style={{
                color: "#f97316",
                marginTop: "0.75rem",
                fontSize: "0.85rem",
              }}
            >
              Error: {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------- Authenticated: console shell + routes ----------
  return (
    <AppShell auth={auth} onLogout={handleLogout}>
      <Routes>
        <Route
          path="/"
          element={
            <OverviewPage
              health={health}
              users={users}
              error={error}
              auth={auth}
              onFinalAuth={handleFinalAuth}
            />
          }
        />
        <Route path="/resources" element={<MyResourcesPage auth={auth} />} />
        <Route
          path="/users"
          element={
            <UsersPage
              auth={auth}
              users={users}
              onRoleChange={handleUserRoleChange}
            />
          }
        />
      </Routes>
      {error && (
        <p
          style={{
            color: "#f97316",
            marginTop: "0.75rem",
            fontSize: "0.85rem",
          }}
        >
          Error: {error}
        </p>
      )}
    </AppShell>
  );
};

export default App;
