export type SpecKey =
  | 'aeo'
  | 'ai-aup'
  | 'ai-incidents';

export type CheckStatus =
  | 'found'           // 2xx with valid JSON, version field matches
  | 'not_found'       // 4xx — no such document at this path
  | 'parse_error'     // 2xx but JSON parse failed
  | 'version_mismatch'// 2xx, parsed, but version field is wrong
  | 'cors_blocked'    // CORS prevented the fetch (very common for cross-origin)
  | 'network_error'   // request timed out / DNS / TLS / etc.
  | 'pending'         // not yet run
  | 'skipped';        // not run (e.g. requires extra args we don't have)

export interface CheckResult {
  spec: SpecKey;
  label: string;
  /** The path attempted, e.g. /.well-known/aeo.json */
  path: string;
  /** Full URL attempted */
  url: string;
  status: CheckStatus;
  http_status?: number;
  /** Top-level JSON detection field (e.g. aeo_version) */
  detect_field: string;
  /** Value of the detect field, when present. */
  detected_version?: string;
  /** Best-effort extracted identity for procurement reports */
  summary?: string[];
  /** Raw document parsed; null if not parsed */
  document?: unknown;
  /** Free-text error / explanation */
  message?: string;
}

export interface WalkReport {
  origin: string;
  ran_at: string;
  duration_ms: number;
  total_checks: number;
  found_count: number;
  /** Path-by-path findings. */
  results: CheckResult[];
}
