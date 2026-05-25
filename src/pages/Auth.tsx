import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth, homeForRoles, type Role } from "@/hooks/useAuth";

import { Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import trakLogo from "@/assets/trak-logo.png";

const ROLE_LABEL: Record<string, string> = { parent: "Parent", driver: "Driver", school: "School" };

const Auth = () => {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const desiredRole = (params.get("role") as Role | null) ?? null;
  const { user, roles, loading, rolesLoaded, refreshRoles } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(desiredRole ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user || !rolesLoaded) return;
    nav(homeForRoles(roles), { replace: true });
  }, [user, roles, loading, rolesLoaded, nav]);

  const assignSelectedRole = async () => {
    if (!desiredRole) return;
    if (!["parent", "driver", "school"].includes(desiredRole)) return;
    const { error } = await supabase.rpc("assign_self_role", { _role: desiredRole });
    if (error) toast.error(`Role assignment failed: ${error.message}`);
    await refreshRoles();
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: name || email.split("@")[0], phone },
      },
    });
    if (error) { setBusy(false); return toast.error(error.message); }
    if (data.session) {
      await assignSelectedRole();
      setBusy(false);
      toast.success("Account created — signing you in");
    } else {
      setBusy(false);
      toast.success("Check your email to confirm your account");
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    // Stash desired role so the callback can claim it after the redirect.
    if (desiredRole) sessionStorage.setItem("pending_role", desiredRole);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) { setBusy(false); toast.error("Google sign-in failed"); }
  };

  // After a session arrives, claim a pending role from session storage (Google flow).
  useEffect(() => {
    if (!user || !rolesLoaded) return;
    const pending = sessionStorage.getItem("pending_role") as Role | null;
    if (pending && !roles.includes(pending)) {
      sessionStorage.removeItem("pending_role");
      supabase.rpc("assign_self_role", { _role: pending }).then(() => refreshRoles());
    }
  }, [user, rolesLoaded, roles, refreshRoles]);

  const roleBanner = desiredRole && ROLE_LABEL[desiredRole]
    ? `Signing up as ${ROLE_LABEL[desiredRole]}`
    : null;

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen flex flex-col">
        <img src={trakLogo} alt="TRAK" width={96} height={96} className="mx-auto mt-6 sm:mt-10 h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-sm" />

        <div className="-mt-6 flex-1 px-6 pb-8">
          {roleBanner && (
            <div className="mb-4 rounded-full bg-primary/10 text-primary text-xs font-medium py-2 px-4 text-center">
              {roleBanner}
            </div>
          )}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 w-full bg-secondary rounded-full h-11 p-1">
              <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-center mb-2">Login</h1>
              <form onSubmit={onSignIn} className="space-y-3">
                <Field icon={Mail} placeholder="Email" type="email" value={email} onChange={setEmail} />
                <Field icon={Lock} placeholder="Password" type="password" value={password} onChange={setPassword} />
                <div className="text-right -mt-1">
                  <button type="button" className="text-xs text-primary font-medium">forgot password</button>
                </div>
                <Button type="submit" className="w-full h-12 rounded-full text-base font-semibold" disabled={busy}>Login</Button>
              </form>
              <Divider label="or login with" />
              <SocialRow onGoogle={onGoogle} disabled={busy} />
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-center mb-2">Get Started</h1>
              <p className="text-center text-xs text-muted-foreground -mt-1 mb-2">By creating a free account.</p>
              <form onSubmit={onSignUp} className="space-y-3">
                <Field icon={UserIcon} placeholder="Full name" value={name} onChange={setName} />
                <Field icon={Mail} placeholder="Valid email" type="email" value={email} onChange={setEmail} />
                <Field icon={Phone} placeholder="Phone number" value={phone} onChange={setPhone} />
                <Field icon={Lock} placeholder="Strong password" type="password" value={password} onChange={setPassword} minLength={6} />
                <p className="text-[11px] text-muted-foreground text-center pt-1">By signing up you agree to our Terms.</p>
                <Button type="submit" className="w-full h-12 rounded-full text-base font-semibold" disabled={busy}>Create account</Button>
              </form>
              <Divider label="or sign up with" />
              <SocialRow onGoogle={onGoogle} disabled={busy} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

function Field({ icon: Icon, placeholder, type = "text", value, onChange, minLength }: any) {
  return (
    <div className="relative">
      <Input type={type} required minLength={minLength} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-full bg-secondary/60 border-secondary pl-5 pr-12 text-sm placeholder:text-muted-foreground/70" />
      <Icon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">{label}</span><div className="flex-1 h-px bg-border" />
    </div>
  );
}
function SocialRow({ onGoogle, disabled }: { onGoogle: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onGoogle} disabled={disabled}
      className="w-full h-12 rounded-full border border-border bg-background flex items-center justify-center gap-3 text-sm font-medium hover:bg-secondary/60 transition">
      <GoogleIcon /> Continue with Google
    </button>
  );
}
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.32z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.87 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.37-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.69-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.69 2.84C6.73 7.31 9.15 5.38 12 5.38z"/>
    </svg>
  );
}
export default Auth;
