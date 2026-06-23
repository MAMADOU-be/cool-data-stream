import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "operateur" | "agriculteur" | "user";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  role: AppRole; // rôle principal (le plus privilégié)
  isAdmin: boolean;
  isOperateur: boolean; // admin OU opérateur
  isAgriculteur: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

const RANK: Record<AppRole, number> = { admin: 3, operateur: 2, agriculteur: 1, user: 0 };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listener d'abord pour ne rater aucun événement
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRoles([]);
        return;
      }
      // defer pour éviter le deadlock du listener
      setTimeout(() => fetchRoles(sess.user.id), 0);
    });

    // 2. Puis check de la session existante
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchRoles(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchRoles = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    if (error) {
      console.warn("fetch roles failed", error);
      setRoles([]);
      return;
    }
    setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  const role: AppRole = roles.length
    ? ([...roles].sort((a, b) => RANK[b] - RANK[a])[0])
    : "agriculteur";

  const value: AuthCtx = {
    user,
    session,
    loading,
    roles,
    role,
    isAdmin: roles.includes("admin"),
    isOperateur: roles.includes("admin") || roles.includes("operateur"),
    isAgriculteur: roles.includes("agriculteur") && !roles.includes("admin") && !roles.includes("operateur"),
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRoles([]);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
