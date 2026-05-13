import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Role = "admin" | "operator" | "parent";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, roles: userRoles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (roles && roles.length > 0 && !roles.some((r) => userRoles.includes(r))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="text-xl font-bold mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            This area requires {roles.join(" or ")} role. Contact an admin to request access.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
