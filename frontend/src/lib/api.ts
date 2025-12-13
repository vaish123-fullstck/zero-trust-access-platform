const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type Health = {
  status: string;
  env: string;
  time: string;
};

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export type AuthResponse = {
  token?: string;
  user?: AuthUser;
  mfa_required?: boolean;
  enrollment_required?: boolean;
  temp_token?: string;
};

// Resources

export type Resource = {
  id: number;
  name: string;
  type: string;
  sensitivity: string;
  created_at: string;
};

export async function fetchResources(token: string): Promise<Resource[]> {
  const res = await fetch(`${API_BASE_URL}/resources`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load resources: ${res.status}`);
  }
  return res.json();
}

// Health & auth

export async function fetchHealth(): Promise<Health> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }
  return res.json();
}

export async function signup(
  full_name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password }),
  });
  if (!res.ok) {
    throw new Error(`Signup failed: ${res.status}`);
  }
  return res.json();
}
