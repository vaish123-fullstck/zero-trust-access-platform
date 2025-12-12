import { useEffect, useState } from "react";
import { fetchResources } from "../lib/api";
import type { Resource } from "../lib/api";

interface AuthState {
  token: string | null;
  user: { role: string; full_name: string; email: string } | null;
}

export function MyResources({ auth }: { auth: AuthState }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    setLoading(true);
    fetchResources(auth.token)
      .then(setResources)
      .catch((err) => setError(err.message ?? "Failed to load resources"))
      .finally(() => setLoading(false));
  }, [auth.token]);

  if (!auth.user || !auth.token) {
    return <p>Please sign in to view your resources.</p>;
  }

  return (
    <div>
      <h1>My Resources</h1>
      <p>Resources you are allowed to access based on policies.</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {resources.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "1px solid #1f2933",
                background: "#020617",
              }}
            >
              <h2 style={{ marginBottom: "0.25rem" }}>{r.name}</h2>
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>{r.type}</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                Sensitivity: <strong>{r.sensitivity}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
