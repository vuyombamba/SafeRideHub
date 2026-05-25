import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, homeForRoles } from "@/hooks/useAuth";

const AuthCallback = () => {
  const nav = useNavigate();
  const { user, roles, loading, rolesLoaded } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) return nav("/auth", { replace: true });
    if (!rolesLoaded) return;
    nav(homeForRoles(roles), { replace: true });
  }, [user, roles, loading, rolesLoaded, nav]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Signing you in…</div>
    </div>
  );
};
export default AuthCallback;
