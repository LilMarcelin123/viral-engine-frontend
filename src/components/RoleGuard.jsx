import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

// Envuelve una página y solo la muestra si el rol del usuario está permitido.
export default function RoleGuard({ roles, children }) {
  const { user, isAdmin, isCliente } = useUserRole();
  if (!user) return null;
  const role = isAdmin ? "admin" : isCliente ? "cliente" : "editor";
  if (!roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}