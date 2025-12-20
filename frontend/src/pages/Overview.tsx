// frontend/src/pages/Overview.tsx
import { useEffect, useState } from "react";
import type { Health } from "../lib/api";
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
  users?: User[] | null; // can be undefined/null
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

  const safeUsers: User[] = Array.isArray(users) ? users : [];
  const safeActivity: ActivityItem[] = Array.isArray(activity) ? activity : [];

  useEffect(() => {
    if (!auth.token || !auth.user) return;

    async function loadActivity() {
      try {
        setActivityError(null);
        const res = await fetch("http://localhost:8080/me/activity", {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
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
        {safeUsers.length === 0 ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            No users loaded yet.
          </p>
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
            {safeUsers.map((u) => (
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
            Recent activity
          </h2>
          {activityError && (
            <p style={{ color: "#f97316", fontSize: "0.85rem" }}>
              {activityError}
            </p>
          )}
          {safeActivity.length === 0 && !activityError ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              No recent activity yet.
            </p>
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
              {safeActivity.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #1f2933",
                    background: "#020617",
                    fontSize: "0.8rem",
                  }}
                >
                  <div>
                    <strong>{item.resource_name}</strong> – {item.action} (
                    {item.decision})
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    {item.method} {item.path} • {item.ip}
                  </div>
                  <div
                    style={{
                      opacity: 0.6,
                      fontSize: "0.75rem",
                    }}
                  >
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && <p style={{ color: "#f97316" }}>Error: {error}</p>}
    </div>
  );
}
