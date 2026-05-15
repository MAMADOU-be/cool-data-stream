import { ReactNode } from "react";

// 🔓 Auth temporairement désactivée — stub permettant à l'app de fonctionner sans login.
export type AppRole = "admin" | "operateur" | "agriculteur" | "user";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

const stub = {
  user: { id: DEMO_USER_ID, email: "demo@doundeul.local" } as any,
  session: null as any,
  loading: false,
  role: "admin" as AppRole,
  roles: ["admin", "operateur"] as AppRole[],
  isAdmin: true,
  isOperateur: true,
  signOut: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return stub;
}
