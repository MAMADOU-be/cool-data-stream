import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "operateur" | "agriculteur" | "user";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  roles: AppRole[];
  isAdmin: boolean;
  isOperateur: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(async () => {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", newSession.user.id);
          const list = (data ?? []).map((r: any) => r.role as AppRole);
          setRoles(list.length ? list : ["user"]);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  // role principal pour rétro-compat (priorité admin > operateur > agriculteur > user)
  const priority: AppRole[] = ["admin", "operateur", "agriculteur", "user"];
  const role = priority.find((r) => roles.includes(r)) ?? null;

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      role, roles,
      isAdmin: roles.includes("admin"),
      isOperateur: roles.includes("operateur") || roles.includes("admin"),
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
