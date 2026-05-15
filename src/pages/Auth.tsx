import { Navigate } from "react-router-dom";
// Authentification temporairement désactivée — redirige vers le dashboard.
export default function AuthPage() {
  return <Navigate to="/dashboard" replace />;
}
