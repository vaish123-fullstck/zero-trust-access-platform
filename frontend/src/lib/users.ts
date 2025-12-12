// lib/users.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

export async function fetchUsers(token: string): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load users: ${res.status}`);
  }
  return res.json();
}

export async function updateUserRole(
  token: string,
  userId: number,
  role: "user" | "admin",
): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update role: ${res.status}`);
  }
  return res.json();
}
