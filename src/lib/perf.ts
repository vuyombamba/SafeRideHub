// Lightweight startup perf marks. Dev-only logging; no external deps.
export function markAppInteractive() {
  if (typeof performance === "undefined") return;
  try {
    performance.mark("app-interactive");
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (import.meta.env.DEV && nav) {
      const t = performance.now();
      // eslint-disable-next-line no-console
      console.info(`[perf] app-interactive @ ${t.toFixed(0)}ms (TTFB ${nav.responseStart.toFixed(0)}ms)`);
    }
  } catch { /* noop */ }
}

export function idleCallback(cb: () => void, timeout = 1000) {
  if (typeof window === "undefined") return cb();
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(cb, { timeout });
  else setTimeout(cb, 0);
}
