# well-known-walker-web

Web app for `well-known-walker` — paste any domain, see every [Kinetic Gain Protocol Suite](https://github.com/mizcausevic-dev/kinetic-gain-protocol-suite) disclosure document it publishes. Live at **[walker.kineticgain.com](https://walker.kineticgain.com)**.

**Client-side only.** No backend, no proxy. The browser fetches each `/.well-known/...` URL directly. Most cross-origin walks will hit CORS (the target domain didn't opt in to public discovery) — the UI surfaces that clearly and points at the future server-side CLI for full coverage.

## What gets probed

| Spec | Path | Detect via |
|---|---|---|
| AEO Protocol | `/.well-known/aeo.json` | `aeo_version` |
| Classroom AI AUP | `/.well-known/ai-aup.json` | `aup_version` |
| AI Incident Card index | `/.well-known/ai-incidents.json` | array of incident entries |

More paths will land as the Suite's specs add canonical well-known locations.

## Local dev

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Deploy

Pushes to `main` build with Vite and FTP-sync `dist/` to `/walker/` on Hostinger. Reuses the shared FTP secrets.

## License

Apache-2.0. Underlying spec family is AGPL-3.0.
