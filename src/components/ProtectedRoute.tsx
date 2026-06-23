import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";

interface Props {
  children: JSX.Element;
  /** Liste de rôles autorisés. Si vide, n'importe quel utilisateur authentifié est admis. */
  roles?: AppRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading, roles: userRoles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0) {
    const allowed = userRoles.some((r) => roles.includes(r));
    if (!allowed) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
