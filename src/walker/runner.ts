import { CHECKS, runCheck } from './checks';
import type { CheckResult, WalkReport } from './types';

/** Normalize a user-supplied domain into an origin (https://host). */
export function normalizeOrigin(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  let withScheme = trimmed;
  if (!/^https?:\/\//i.test(withScheme)) {
    withScheme = 'https://' + withScheme;
  }
  try {
    const u = new URL(withScheme);
    // Strip trailing slashes / paths / query / hash
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

export async function runWalk(originInput: string): Promise<WalkReport> {
  const origin = normalizeOrigin(originInput);
  if (!origin) {
    throw new Error('Invalid domain. Try something like "edu.kineticgain.com" or "https://example.org".');
  }
  const startedAt = Date.now();

  // Run checks in parallel — each is independent.
  const settled = await Promise.allSettled(CHECKS.map((def) => runCheck(origin, def)));
  const results: CheckResult[] = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const def = CHECKS[i]!;
    return {
      spec: def.spec,
      label: def.label,
      path: def.path,
      url: origin + def.path,
      status: 'network_error',
      detect_field: def.detect_field,
      message: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });

  return {
    origin,
    ran_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    total_checks: results.length,
    found_count: results.filter((r) => r.status === 'found').length,
    results,
  };
}
