import type { CheckResult, SpecKey } from './types';

interface CheckDefinition {
  spec: SpecKey;
  label: string;
  /** Path relative to the origin (starts with /) */
  path: string;
  /** The top-level JSON field that proves it's the right kind of document */
  detect_field: string;
  /** Extract a short summary array from a parsed document */
  summarize: (doc: Record<string, unknown>) => string[];
}

function asStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function asObj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}
function asArr(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined;
}

export const CHECKS: CheckDefinition[] = [
  // AEO Protocol — entity declaration
  {
    spec: 'aeo',
    label: 'AEO Protocol',
    path: '/.well-known/aeo.json',
    detect_field: 'aeo_version',
    summarize: (doc) => {
      const lines: string[] = [];
      const entity = asObj(doc['entity']);
      if (entity) {
        const name = asStr(entity['name']);
        const type = asStr(entity['type']);
        if (name) lines.push(`entity: ${name}${type ? ` (${type})` : ''}`);
        const canonical = asStr(entity['canonical_url']);
        if (canonical) lines.push(`canonical: ${canonical}`);
      }
      const claims = asArr(doc['claims']);
      if (claims) lines.push(`${claims.length} claim${claims.length === 1 ? '' : 's'} declared`);
      const audit = asObj(doc['audit']);
      const auditMode = audit && asStr(audit['mode']);
      if (auditMode) lines.push(`audit mode: ${auditMode}`);
      return lines;
    },
  },

  // Classroom AI AUP — district / school / course policy
  {
    spec: 'ai-aup',
    label: 'Classroom AI AUP',
    path: '/.well-known/ai-aup.json',
    detect_field: 'aup_version',
    summarize: (doc) => {
      const lines: string[] = [];
      const policy_id = asStr(doc['policy_id']);
      const policy_name = asStr(doc['policy_name']);
      const version = asStr(doc['version']);
      if (policy_name) lines.push(policy_name + (version ? ` (v${version})` : ''));
      else if (policy_id) lines.push(`policy: ${policy_id}`);
      const scope = asObj(doc['scope']);
      if (scope) {
        const t = asStr(scope['type']);
        const inst = asStr(scope['institution_id']);
        if (t || inst) lines.push(`scope: ${t ?? '?'}${inst ? ` (${inst})` : ''}`);
      }
      const permitted = asObj(doc['permitted_use']);
      if (permitted) {
        const extent = asStr(permitted['assistance_extent_max']);
        const roles = asArr(permitted['permitted_roles']);
        if (extent) lines.push(`max extent: ${extent}`);
        if (roles) lines.push(`${roles.length} permitted role${roles.length === 1 ? '' : 's'}`);
      }
      return lines;
    },
  },

  // AI Incident Card index
  {
    spec: 'ai-incidents',
    label: 'AI Incident Card index',
    path: '/.well-known/ai-incidents.json',
    detect_field: '', // index is an array of {id, ...}; we'll detect heuristically
    summarize: (doc) => {
      // Index format is an array of entries; the detect logic in runner handles arrays.
      const arr = asArr((doc as unknown) as unknown);
      if (arr) {
        return [`${arr.length} incident card${arr.length === 1 ? '' : 's'} listed`];
      }
      return [];
    },
  },
];

const FETCH_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      // 'mode' defaults to cors; we want cross-origin fetches to surface CORS errors clearly.
      mode: 'cors',
      credentials: 'omit',
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function runCheck(origin: string, def: CheckDefinition): Promise<CheckResult> {
  const url = origin + def.path;
  const base: CheckResult = {
    spec: def.spec,
    label: def.label,
    path: def.path,
    url,
    status: 'pending',
    detect_field: def.detect_field,
  };
  let response: Response;
  try {
    response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  } catch (err) {
    // A network-level failure can be CORS, DNS, TLS, abort, or offline.
    // Browsers don't expose the distinction; surface as cors_blocked for cross-origin since
    // that's the most likely cause for a Kinetic Gain disclosure walk.
    const message = err instanceof Error ? err.message : String(err);
    const looksLikeCors = /cors|cross-origin|networkerror|failed to fetch/i.test(message);
    return {
      ...base,
      status: looksLikeCors ? 'cors_blocked' : 'network_error',
      message,
    };
  }

  if (response.status === 404) {
    return { ...base, status: 'not_found', http_status: 404 };
  }
  if (!response.ok) {
    return {
      ...base,
      status: 'network_error',
      http_status: response.status,
      message: `HTTP ${response.status} ${response.statusText}`,
    };
  }

  let text: string;
  try {
    text = await response.text();
  } catch (err) {
    return {
      ...base,
      status: 'network_error',
      http_status: response.status,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return {
      ...base,
      status: 'parse_error',
      http_status: response.status,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // Special-case: AI Incident index can be either a top-level array or an object with `incidents`.
  if (def.spec === 'ai-incidents') {
    const arr = Array.isArray(parsed) ? parsed : asObj(parsed)?.['incidents'];
    if (Array.isArray(arr)) {
      return {
        ...base,
        status: 'found',
        http_status: response.status,
        detected_version: undefined,
        summary: def.summarize(arr as unknown as Record<string, unknown>),
        document: arr,
      };
    }
    return {
      ...base,
      status: 'parse_error',
      http_status: response.status,
      message: 'Document is JSON but is not an array of incident-card index entries.',
    };
  }

  const obj = asObj(parsed);
  if (!obj) {
    return {
      ...base,
      status: 'parse_error',
      http_status: response.status,
      message: 'Document is JSON but is not an object.',
    };
  }

  const detected = obj[def.detect_field];
  if (typeof detected !== 'string' || !detected) {
    return {
      ...base,
      status: 'version_mismatch',
      http_status: response.status,
      message: `Top-level "${def.detect_field}" field is missing or non-string — does not look like a ${def.label} document.`,
    };
  }

  return {
    ...base,
    status: 'found',
    http_status: response.status,
    detected_version: detected,
    summary: def.summarize(obj),
    document: obj,
  };
}
