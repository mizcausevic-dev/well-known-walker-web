// Pre-canned demo report — shown when the user hits "Run demo" so they can
// see what a successful walk looks like even before pointing at a real domain
// (most real domains will be CORS-blocked for cross-origin fetches anyway).
import type { WalkReport } from './types';

export const DEMO_REPORT: WalkReport = {
  origin: 'https://edu.kineticgain.com',
  ran_at: '2026-05-12T21:00:00Z',
  duration_ms: 1247,
  total_checks: 3,
  found_count: 3,
  results: [
    {
      spec: 'aeo',
      label: 'AEO Protocol',
      path: '/.well-known/aeo.json',
      url: 'https://edu.kineticgain.com/.well-known/aeo.json',
      status: 'found',
      http_status: 200,
      detect_field: 'aeo_version',
      detected_version: '0.1',
      summary: [
        'entity: Kinetic Gain Edu (Organization)',
        'canonical: https://edu.kineticgain.com/',
        '5 claims declared',
        'audit mode: signature',
      ],
    },
    {
      spec: 'ai-aup',
      label: 'Classroom AI AUP',
      path: '/.well-known/ai-aup.json',
      url: 'https://edu.kineticgain.com/.well-known/ai-aup.json',
      status: 'found',
      http_status: 200,
      detect_field: 'aup_version',
      detected_version: '0.1',
      summary: [
        'Lincoln High District 42 — Classroom AI AUP (v1.2.0)',
        'scope: district (lincoln-high-district-42)',
        'max extent: minor',
        '4 permitted roles',
      ],
    },
    {
      spec: 'ai-incidents',
      label: 'AI Incident Card index',
      path: '/.well-known/ai-incidents.json',
      url: 'https://edu.kineticgain.com/.well-known/ai-incidents.json',
      status: 'found',
      http_status: 200,
      detect_field: '',
      summary: ['2 incident cards listed'],
    },
  ],
};
