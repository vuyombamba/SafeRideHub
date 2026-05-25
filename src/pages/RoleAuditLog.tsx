import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History } from "lucide-react";

interface AuditRow {
  id: string;
  actor_user_id: string | null;
  target_user_id: string;
  role: "admin" | "operator" | "parent";
  action: "grant" | "revoke";
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
}

const RoleAuditLog = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("role_audit_log").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("user_id, display_name"),
      ]);
      setRows((a ?? []) as AuditRow[]);
      const map: Record<string, string> = {};
      ((p ?? []) as Profile[]).forEach((x) => { map[x.user_id] = x.display_name ?? x.user_id.slice(0, 8); });
      setProfiles(map);
      setLoading(false);
    })();
  }, []);

  const nameOf = (id: string | null) => (id ? profiles[id] ?? `${id.slice(0, 8)}…` : "system");

  const grouped = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/admin/roles" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Roles
          </Link>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span className="font-display font-bold">Audit log</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6 space-y-3">
        {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!loading && grouped.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">No role changes yet.</p>
        )}
        {grouped.map((r) => (
          <Card key={r.id} className="border-border">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{nameOf(r.actor_user_id)}</span>{" "}
                  <span className="text-muted-foreground">
                    {r.action === "grant" ? "granted" : "revoked"}
                  </span>{" "}
                  <Badge variant="outline" className="mx-1">{r.role}</Badge>{" "}
                  <span className="text-muted-foreground">on</span>{" "}
                  <span className="font-semibold">{nameOf(r.target_user_id)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  r.action === "grant"
                    ? "border-primary/40 text-primary bg-primary/10"
                    : "border-destructive/40 text-destructive bg-destructive/10"
                }
              >
                {r.action}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
};

export default RoleAuditLog;
