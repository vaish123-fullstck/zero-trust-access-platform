// frontend/src/pages/Overview.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAuditStats, type AuditStat, type Health } from "../lib/api";
import type { User } from "../lib/users";

type AuthState = {
  token: string | null;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  } | null;
};

type OverviewProps = {
  health: Health | null;
  users: User[];
  error: string | null;
  auth: AuthState;
};

type ActivityItem = {
  id: number;
  resource_name: string;
  action: string;
  decision: string;
  path: string;
  method: string;
  ip: string;
  created_at: string;
};

export function OverviewPage({ health, users, error, auth }: OverviewProps) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const safeUsers: User[] = Array.isArray(users) ? users : [];
  const safeActivity: ActivityItem[] = Array.isArray(activity) ? activity : [];

  const isAdmin = auth.user?.role === "admin";

  // Load recent activity
  useEffect(() => {
    if (!auth.token || !auth.user) return;

    async function loadActivity() {
      try {
        setActivityError(null);
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/me/activity`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          },
        );
        if (!res.ok) {
          throw new Error(`failed to load activity: ${res.status}`);
        }
        const data = (await res.json()) as ActivityItem[] | null;
        setActivity(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setActivity([]);
        setActivityError(err.message ?? "failed to load activity");
      }
    }

    loadActivity();
  }, [auth.token, auth.user]);

  // Load audit stats for chart
  useEffect(() => {
    if (!auth.token || !isAdmin) {
      setStatsLoading(false);
      return;
    }

    async function loadStats() {
      try {
        setStatsLoading(true);
        const stats = await fetchAuditStats(auth.token as string);
        setAuditStats(stats);
      } catch (err: any) {
        console.error("Failed to load audit stats:", err.message);
        setAuditStats([]);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [auth.token, isAdmin]);

  // Small bar chart for allow/deny
  const AuditChart = () => {
    const allowCount =
      auditStats.find((s) => s.decision === "allow")?.count || 0;
    const denyCount = auditStats.find((s) => s.decision === "deny")?.count || 0;
    const total = allowCount + denyCount;
    const maxHeight = 70; // slightly shorter so it does not hit the label

    if (statsLoading) {
      return (
        <div
          style={{
            height: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.7,
          }}
        >
          Loading audit stats…
        </div>
      );
    }

    if (total === 0) {
      return (
        <div
          style={{
            height: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.7,
          }}
        >
          No audit data (30 days)
        </div>
      );
    }

    const allowHeight = (allowCount / total) * maxHeight;
    const denyHeight = (denyCount / total) * maxHeight;

    return (
      <div
        style={{
          position: "relative",
          height: maxHeight + 50,
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            alignItems: "flex-end",
            height: maxHeight + 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.35rem",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 40,
                height: allowHeight,
                background: "linear-gradient(180deg, #22c55e, #16a34a)",
                borderRadius: "4px 4px 0 0",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
              }}
            />
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Allow</div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#22c55e",
              }}
            >
              {allowCount}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.35rem",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 40,
                height: denyHeight,
                background: "linear-gradient(180deg, #f97316, #ea580c)",
                borderRadius: "4px 4px 0 0",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
              }}
            />
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Deny</div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#f97316",
              }}
            >
              {denyCount}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {isAdmin && (
        <section>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Users card */}
            <Link to="/users" style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  padding: "1rem 1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <h3 style={{ fontSize: "1rem", margin: 0 }}>Users</h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.75,
                    margin: 0,
                  }}
                >
                  Manage identities and roles in the system.
                </p>
                <div
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    marginTop: "0.35rem",
                  }}
                >
                  Total users: {safeUsers.length}
                </div>
              </div>
            </Link>

            {/* Audit overview (chart) */}
            <Link
              to="/admin/audit"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  padding: "1rem 1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  cursor: "pointer",
                  height: 200,
                }}
              >
                <h3 style={{ fontSize: "1rem", margin: 0 }}>Audit overview</h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.75,
                    margin: 0,
                  }}
                >
                  -
                </p>
                <AuditChart />
              </div>
            </Link>

            {/* Audit trail card */}
            <Link
              to="/admin/audit"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  padding: "1rem 1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <h3 style={{ fontSize: "1rem", margin: 0 }}>Audit trail</h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.75,
                    margin: 0,
                  }}
                >
                  Review recent access decisions and user activity.
                </p>
                <div
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    marginTop: "0.35rem",
                  }}
                >
                  Latest events: {safeActivity.length}
                </div>
              </div>
            </Link>

            {/* System status card */}
            <Link
              to="/admin/system"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  padding: "1rem 1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <h3 style={{ fontSize: "1rem", margin: 0 }}>System status</h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.75,
                    margin: 0,
                  }}
                >
                  Health of the policy engine and backend services.
                </p>
                <div
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    marginTop: "0.35rem",
                  }}
                >
                  {health ? "Healthy" : "Loading…"}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* System status detail */}
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

      {error && <p style={{ color: "#f97316" }}>Error: {error}</p>}
      {activityError && !error && (
        <p style={{ color: "#f97316" }}>Activity error: {activityError}</p>
      )}
    </div>
  );
}
