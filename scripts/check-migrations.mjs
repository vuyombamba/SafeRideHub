#!/usr/bin/env node
// Static analysis of supabase/migrations to catch unsafe SQL before deployment.
// Exits 1 on any violation; prints a grouped report.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");
const RESERVED_SCHEMAS = ["auth", "storage", "realtime", "vault", "supabase_functions"];

/**
 * @param {string} sql
 * @param {string} file
 * @returns {{file:string,line:number,rule:string,message:string}[]}
 */
export function lintSql(sql, file = "<input>") {
  const issues = [];
  const stripped = sql
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");
  const lower = stripped.toLowerCase();

  const lineOf = (idx) => stripped.slice(0, idx).split("\n").length;

  // 1. CREATE TABLE public.X must have matching ENABLE ROW LEVEL SECURITY somewhere in the same file
  const tableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)/g;
  for (const m of lower.matchAll(tableRe)) {
    const name = m[1];
    const rlsRe = new RegExp(
      `alter\\s+table\\s+(?:only\\s+)?(?:public\\.)?${name}\\s+enable\\s+row\\s+level\\s+security`
    );
    if (!rlsRe.test(lower)) {
      issues.push({
        file, line: lineOf(m.index ?? 0), rule: "rls-required",
        message: `Table public.${name} created without ENABLE ROW LEVEL SECURITY`,
      });
    }
  }

  // 2. No CREATE POLICY ... USING (true) on writes
  const polRe = /create\s+policy\s+[^;]+?for\s+(insert|update|delete|all)[^;]*?(using|with\s+check)\s*\(\s*true\s*\)/g;
  for (const m of lower.matchAll(polRe)) {
    issues.push({
      file, line: lineOf(m.index ?? 0), rule: "no-permissive-write",
      message: `Permissive write policy with USING/WITH CHECK (true) on FOR ${m[1].toUpperCase()}`,
    });
  }

  // 3. SECURITY DEFINER without SET search_path
  const fnRe = /create\s+(?:or\s+replace\s+)?function\s+([\s\S]*?)(?:\$\$|\$function\$)/g;
  for (const m of lower.matchAll(fnRe)) {
    const body = m[1];
    if (body.includes("security definer") && !/set\s+search_path/.test(body)) {
      issues.push({
        file, line: lineOf(m.index ?? 0), rule: "definer-search-path",
        message: "SECURITY DEFINER function missing SET search_path",
      });
    }
  }

  // 4. Reserved schemas
  for (const schema of RESERVED_SCHEMAS) {
    const re = new RegExp(`(alter|create|drop)\\s+(table|policy|trigger|function|index)\\s+(?:if\\s+not\\s+exists\\s+)?${schema}\\.`, "g");
    for (const m of lower.matchAll(re)) {
      // storage.objects policies are allowed via INSERT/CREATE POLICY ON storage.objects pattern; allow that specific case
      if (schema === "storage" && /create\s+policy[^;]*on\s+storage\.objects/.test(lower.slice(Math.max(0, (m.index ?? 0) - 200), (m.index ?? 0) + 200))) continue;
      issues.push({
        file, line: lineOf(m.index ?? 0), rule: "reserved-schema",
        message: `Modifying reserved schema "${schema}" is not allowed`,
      });
    }
  }

  return issues;
}

function main() {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log("No supabase/migrations directory; skipping.");
    return;
  }
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const all = [];
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
    all.push(...lintSql(sql, f));
  }
  if (all.length === 0) {
    console.log(`migration-lint: ${files.length} file(s) clean`);
    return;
  }
  console.error(`migration-lint: ${all.length} issue(s)`);
  for (const i of all) {
    console.error(`  ${i.file}:${i.line}  [${i.rule}] ${i.message}`);
  }
  process.exit(1);
}

const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) main();
