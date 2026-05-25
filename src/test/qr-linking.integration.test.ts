/**
 * End-to-end test: QR driver linking.
 *
 * Walks the full path: driver creates profile -> parent calls link_driver_by_qr ->
 * RLS allows parent to read driver_profiles, blocks unrelated users.
 *
 * Gated behind RUN_INTEGRATION=1 so the default `vitest run` stays hermetic.
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (anon key).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_INTEGRATION === "1";
const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const d = describe.skipIf(!enabled || !url || !anon);

function newClient(): SupabaseClient {
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signUpEphemeral(client: SupabaseClient, role: "parent" | "driver") {
  const email = `it+${role}+${Date.now()}+${Math.random().toString(36).slice(2, 8)}@trak-test.dev`;
  const password = `Test!${Math.random().toString(36).slice(2, 12)}A1`;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error(`No session — auto-confirm disabled? email=${email}`);
  await client.rpc("assign_self_role" as any, { _role: role });
  return data.user!;
}

d("QR driver linking", () => {
  let parent: SupabaseClient, driver: SupabaseClient, stranger: SupabaseClient;
  let driverId: string;
  let parentId: string;
  let qr: string;

  beforeAll(async () => {
    parent = newClient(); driver = newClient(); stranger = newClient();
    parentId = (await signUpEphemeral(parent, "parent")).id;
    driverId = (await signUpEphemeral(driver, "driver")).id;
    await signUpEphemeral(stranger, "parent");

    const { data: prof, error } = await driver
      .from("driver_profiles")
      .insert({ driver_user_id: driverId, full_name: "IT Driver", license_number: `LIC-${Date.now()}` })
      .select("qr_token")
      .single();
    if (error) throw error;
    qr = prof.qr_token as string;
  }, 60_000);

  it("driver can read own profile", async () => {
    const { data, error } = await driver.from("driver_profiles").select("driver_user_id").eq("driver_user_id", driverId).single();
    expect(error).toBeNull();
    expect(data?.driver_user_id).toBe(driverId);
  });

  it("parent cannot read driver profile before linking", async () => {
    const { data } = await stranger.from("driver_profiles").select("driver_user_id").eq("driver_user_id", driverId);
    expect(data ?? []).toEqual([]);
  });

  it("link_driver_by_qr returns driver id and creates parent_drivers row", async () => {
    const { data, error } = await parent.rpc("link_driver_by_qr" as any, { _qr_token: qr });
    expect(error).toBeNull();
    expect(data).toBe(driverId);

    const { data: rows } = await parent
      .from("parent_drivers")
      .select("parent_user_id, driver_user_id, added_via")
      .eq("driver_user_id", driverId);
    expect(rows?.length).toBe(1);
    expect(rows![0].parent_user_id).toBe(parentId);
    expect(rows![0].added_via).toBe("qr");
  });

  it("parent can now read the linked driver profile via RLS", async () => {
    const { data, error } = await parent
      .from("driver_profiles")
      .select("driver_user_id, full_name, status")
      .eq("driver_user_id", driverId)
      .single();
    expect(error).toBeNull();
    expect(data?.driver_user_id).toBe(driverId);
  });

  it("unrelated user still cannot read the driver profile", async () => {
    const { data } = await stranger.from("driver_profiles").select("driver_user_id").eq("driver_user_id", driverId);
    expect(data ?? []).toEqual([]);
  });

  it("invalid QR token is rejected by the RPC", async () => {
    const fake = "00000000-0000-0000-0000-000000000000";
    const { error } = await parent.rpc("link_driver_by_qr" as any, { _qr_token: fake });
    expect(error).not.toBeNull();
  });
});
