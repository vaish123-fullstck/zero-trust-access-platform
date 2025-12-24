// frontend/src/pages/PolicyEditorPage.tsx
import { useEffect, useState } from "react";

import { fetchAwsRolePolicies, type AwsRole } from "../lib/api";

type AuthState = {
  token: string | null;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  } | null;
};

type PolicyEditorPageProps = {
  auth: AuthState;
};

type Policies = Record<string, AwsRole[]>;

export function PolicyEditorPage({ auth }: PolicyEditorPageProps) {
  const [policies, setPolicies] = useState<Policies>({});
  const [allRoles, setAllRoles] = useState<AwsRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token) {
      setPolicies({});
      setAllRoles([]);
      setLoading(false);
      return;
    }

    async function loadPolicies() {
      try {
        setLoading(true);
        setError(null);

        // load current policies
        const policyData = await fetchAwsRolePolicies(auth.token as string);
        setPolicies(policyData);

        // derive ALL roles from the policy map
        const flattenedRoles = Object.values(policyData).flat();
        const uniqueRoles = Array.from(
          new Set(flattenedRoles.map((r: AwsRole) => r.id)),
        ).map((id) => flattenedRoles.find((r: AwsRole) => r.id === id)!);

        setAllRoles(uniqueRoles);
      } catch (err: any) {
        setError(err.message ?? "Failed to load policies");
      } finally {
        setLoading(false);
      }
    }

    loadPolicies();
  }, [auth.token]);

  if (!auth.user || auth.user.role !== "admin") {
    return <p style={{ fontSize: "0.9rem" }}>Admin access only.</p>;
  }

  if (loading) {
    return <p style={{ fontSize: "0.9rem" }}>Loading policies…</p>;
  }

  if (error) {
    return (
      <p style={{ fontSize: "0.9rem", color: "#f97316" }}>
        {error}
      </p>
    );
  }

  const appRoles = Object.keys(policies);

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
        AWS role policies
      </h2>
      <p
        style={{
          fontSize: "0.85rem",
          opacity: 0.75,
          marginBottom: "1rem",
        }}
      >
        Read‑only view of which AWS roles each application role can assume.
      </p>

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
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.4rem 0.3rem",
                }}
              >
                AWS role
              </th>
              {appRoles.map((role) => (
                <th
                  key={role}
                  style={{
                    textAlign: "center",
                    padding: "0.4rem 0.3rem",
                    textTransform: "capitalize",
                  }}
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRoles.map((r) => (
              <tr key={r.id}>
                <td
                  style={{
                    padding: "0.35rem 0.3rem",
                    borderTop: "1px solid #1f2933",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    {r.env} • {r.risk_level}
                  </div>
                  {r.description && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.7,
                        marginTop: "0.25rem",
                      }}
                    >
                      {r.description}
                    </div>
                  )}
                </td>
                {appRoles.map((appRole) => {
                  const hasRole = policies[appRole]?.some(
                    (pr) => pr.id === r.id,
                  );
                  return (
                    <td
                      key={appRole}
                      style={{
                        padding: "0.35rem 0.3rem",
                        borderTop: "1px solid #1f2933",
                        textAlign: "center",
                      }}
                    >
                      {hasRole ? "✓" : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
