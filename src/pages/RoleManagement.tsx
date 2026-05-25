import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Shield, Trash2, UserPlus } from "lucide-react";

type Role = "admin" | "operator" | "parent" | "driver" | "school";
const ALL_ROLES: Role[] = ["admin", "operator", "parent", "driver", "school"];

interface Profile {
  user_id: string;
  display_name: string | null;
}

interface RoleRow {
  id: string;
  user_id: string;
  role: Role;
}

const roleStyle: Record<Role, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  operator: "bg-primary/15 text-primary border-primary/30",
  parent: "bg-muted text-muted-foreground border-border",
  driver: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  school: "bg-sky-500/15 text-sky-700 border-sky-500/30",
};

const RoleManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, RoleRow[]>>({});
  const [filter, setFilter] = useState("");
  const [pendingRole, setPendingRole] = useState<Record<string, Role>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: pData }, { data: rData }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name"),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    setProfiles((pData ?? []) as Profile[]);
    const map: Record<string, RoleRow[]> = {};
    ((rData ?? []) as RoleRow[]).forEach((r) => {
      (map[r.user_id] ||= []).push(r);
    });
    setRolesByUser(map);
  };

  useEffect(() => { load(); }, []);

  const addRole = async (userId: string) => {
    const role = pendingRole[userId] ?? "parent";
    setBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    load();
  };

  const removeRole = async (rowId: string, role: Role, userId: string) => {
    // Prevent removing the last admin
    if (role === "admin") {
      const adminCount = Object.values(rolesByUser).flat().filter((r) => r.role === "admin").length;
      if (adminCount <= 1) return toast.error("Cannot remove the last admin");
    }
    setBusy(true);
    const { error } = await supabase.from("user_roles").delete().eq("id", rowId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Role removed");
    setRolesByUser((prev) => ({
      ...prev,
      [userId]: (prev[userId] ?? []).filter((r) => r.id !== rowId),
    }));
  };

  const filtered = profiles.filter((p) =>
    !filter || (p.display_name ?? "").toLowerCase().includes(filter.toLowerCase()) || p.user_id.includes(filter)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-display font-bold">Role management</span>
          </div>
          <Link to="/admin/audit" className="text-sm text-muted-foreground hover:text-foreground">
            Audit log →
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
        <Input
          placeholder="Search by name or user id"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">No users found.</p>
        )}

        {filtered.map((p) => {
          const userRoles = rolesByUser[p.user_id] ?? [];
          const heldRoles = new Set(userRoles.map((r) => r.role));
          const available = ALL_ROLES.filter((r) => !heldRoles.has(r));
          const selected = pendingRole[p.user_id] ?? available[0];
          return (
            <Card key={p.user_id} className="border-border">
              <CardHeader className="px-4 py-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.display_name ?? "Unnamed user"}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{p.user_id.slice(0, 8)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {userRoles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                  {userRoles.map((r) => (
                    <Badge key={r.id} variant="outline" className={`gap-1 ${roleStyle[r.role]}`}>
                      {r.role}
                      <button
                        onClick={() => removeRole(r.id, r.role, p.user_id)}
                        disabled={busy}
                        className="ml-1 hover:opacity-70"
                        aria-label={`Remove ${r.role}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {available.length > 0 && (
                  <div className="flex gap-2">
                    <Select
                      value={selected}
                      onValueChange={(v) => setPendingRole((prev) => ({ ...prev, [p.user_id]: v as Role }))}
                    >
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {available.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addRole(p.user_id)} disabled={busy}>
                      <UserPlus className="h-4 w-4 mr-1" /> Grant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
};

export default RoleManagement;
