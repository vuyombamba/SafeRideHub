import { describe, it, expect } from "vitest";
// @ts-expect-error - js module without types
import { lintSql } from "../scripts/check-migrations.mjs";

describe("migration linter", () => {
  it("flags table without RLS", () => {
    const issues = lintSql(`CREATE TABLE public.notes (id uuid primary key);`);
    expect(issues.some((i: any) => i.rule === "rls-required")).toBe(true);
  });

  it("accepts table with RLS enabled", () => {
    const sql = `
      CREATE TABLE public.notes (id uuid primary key);
      ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
    `;
    expect(lintSql(sql)).toEqual([]);
  });

  it("flags permissive write policy", () => {
    const sql = `
      CREATE TABLE public.x (id uuid primary key);
      ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
      CREATE POLICY p ON public.x FOR INSERT WITH CHECK (true);
    `;
    expect(lintSql(sql).some((i: any) => i.rule === "no-permissive-write")).toBe(true);
  });

  it("flags SECURITY DEFINER without search_path", () => {
    const sql = `
      CREATE OR REPLACE FUNCTION public.foo() RETURNS void
      LANGUAGE plpgsql SECURITY DEFINER
      AS $$ BEGIN NULL; END $$;
    `;
    expect(lintSql(sql).some((i: any) => i.rule === "definer-search-path")).toBe(true);
  });

  it("allows SECURITY DEFINER with search_path", () => {
    const sql = `
      CREATE OR REPLACE FUNCTION public.foo() RETURNS void
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
      AS $$ BEGIN NULL; END $$;
    `;
    expect(lintSql(sql)).toEqual([]);
  });

  it("flags reserved schema mutation", () => {
    const sql = `ALTER TABLE auth.users ADD COLUMN foo text;`;
    expect(lintSql(sql).some((i: any) => i.rule === "reserved-schema")).toBe(true);
  });

  it("allows storage.objects policies", () => {
    const sql = `CREATE POLICY p ON storage.objects FOR SELECT USING (bucket_id = 'x');`;
    expect(lintSql(sql).filter((i: any) => i.rule === "reserved-schema")).toEqual([]);
  });
});
