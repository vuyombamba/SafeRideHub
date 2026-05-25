import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SchoolRow { id: string; name: string; address: string | null; contact_phone: string | null; }

export function useSchool() {
  const { user } = useAuth();
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("schools").select("id,name,address,contact_phone").eq("admin_user_id", user.id).maybeSingle()
      .then(({ data }) => { setSchool((data as SchoolRow) ?? null); setLoading(false); });
  }, [user]);

  return { school, loading };
}
