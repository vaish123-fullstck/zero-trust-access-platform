import { useEffect, useState } from "react";

type AuditActivity = {
  id: number;
  resource_name: string;
  action: string;
  decision: string;
  path: string;
  method: string;
  ip: string;
  created_at: string;
  user_email?: string;
};

type AuditDetailProps = {
  auth: {
    token: string | null;
    user: { id: number; email: string; full_name: string; role: string } | null;
  };
};

export function AuditDetailPage({ auth }: AuditDetailProps) {
  const [rows, setRows] = useState<AuditActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.token || !auth.user) return;

    if (auth.user.role !== "admin") {
      setError("You must be an admin to view the audit trail.");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("http://localhost:8080/me/activity", {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`failed to load activity: ${res.status}`);
        }
        const data = (await res.json()) as AuditActivity[] | null;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message ?? "failed to load activity");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth.token, auth.user]);

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
        Audit trail
      </h2>
      <p style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "0.75rem" }}>
        Time-stamped record of access decisions and user actions across the system.
      </p>

      {error && (
        <p style={{ color: "#f97316", fontSize: "0.85rem" }}>{error}</p>
      )}
      {loading && <p style={{ fontSize: "0.9rem" }}>Loading audit events…</p>}

      {!loading && !error && rows.length === 0 && (
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          No audit events have been recorded yet.
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #1f2933",
            background: "#020617",
            padding: "0.75rem 1rem",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "0.4rem 0.3rem" }}>Time</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>User</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>Action</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>Decision</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>Resource</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>Method</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>Path</th>
                <th style={{ padding: "0.4rem 0.3rem" }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                    }}
                  >
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                    }}
                  >
                    {row.user_email ?? "N/A"}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                    }}
                  >
                    {row.action}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                      color:
                        row.decision === "allow"
                          ? "#22c55e"
                          : row.decision === "deny"
                          ? "#f97316"
                          : "#e5e7eb",
                    }}
                  >
                    {row.decision}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                    }}
                  >
                    {row.resource_name}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                      opacity: 0.8,
                    }}
                  >
                    {row.method}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                      opacity: 0.8,
                    }}
                  >
                    {row.path}
                  </td>
                  <td
                    style={{
                      padding: "0.35rem 0.3rem",
                      borderTop: "1px solid #1f2933",
                      opacity: 0.8,
                    }}
                  >
                    {row.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
