/**
 * Realtime GPS stream integration test.
 *
 * Verifies that a driver-side UPDATE to `vehicles` (lat/lng) is delivered to a
 * subscribed parent-side Supabase Realtime channel within the 2s budget — the
 * core SLA of the parent live map.
 *
 * Gated behind RUN_INTEGRATION=1 to keep CI/unit runs hermetic. Run with:
 *   RUN_INTEGRATION=1 bunx vitest run src/test/gps-realtime.integration.test.ts
 *
 * Requires service-role access (RLS bypass) for ephemeral fixture setup.
 * Provide via env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const RUN = process.env.RUN_INTEGRATION === "1";
const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

(RUN ? describe : describe.skip)("GPS realtime stream", () => {
  it("propagates a vehicle position update to subscribers under 2s", async () => {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const listener = createClient(url, anonKey, { auth: { persistSession: false } });

    // Seed a vehicle row (service role bypasses RLS).
    const plate = `TEST-${Date.now()}`;
    const { data: vehicle, error: insertErr } = await admin
      .from("vehicles")
      .insert({ plate_number: plate, driver_name: "Realtime Test", lat: 0, lng: 0 })
      .select()
      .single();
    expect(insertErr).toBeNull();
    expect(vehicle?.id).toBeTruthy();

    try {
      // Subscribe and wait for the change.
      const received = new Promise<{ lat: number; lng: number; deltaMs: number }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timed out waiting for realtime UPDATE")), 5000);
        const sentAt = { current: 0 };

        const channel = listener
          .channel(`vehicle:${vehicle!.id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "vehicles", filter: `id=eq.${vehicle!.id}` },
            (payload) => {
              clearTimeout(timeout);
              const row = payload.new as { lat: number; lng: number };
              resolve({ lat: row.lat, lng: row.lng, deltaMs: Date.now() - sentAt.current });
            },
          )
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              sentAt.current = Date.now();
              const { error } = await admin
                .from("vehicles")
                .update({ lat: -26.2041, lng: 28.0473, status: "en_route" })
                .eq("id", vehicle!.id);
              if (error) reject(error);
            }
          });

        // Cleanup channel after the promise settles.
        Promise.race([received]).finally(() => listener.removeChannel(channel));
      });

      const result = await received;
      expect(result.lat).toBeCloseTo(-26.2041, 4);
      expect(result.lng).toBeCloseTo(28.0473, 4);
      // Sub-2s SLA per project memory (tech/stack-and-performance).
      expect(result.deltaMs).toBeLessThan(2000);
    } finally {
      await admin.from("vehicles").delete().eq("id", vehicle!.id);
    }
  }, 15000);
});
