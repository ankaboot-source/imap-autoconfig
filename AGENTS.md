# AGENTS.md — imap-autoconfig

Small library that, given an email address, discovers the IMAP host, port and
security settings for that provider. It tries AutoDiscover (including SRV
records), then DNS, then a settings guesser, and returns the first config that
accepts a live IMAP connection.

## Published package contract

- Package name: `@ankaboot.io/imap-autoconfig`
- Current version: `0.2.0` (`package.json`)
- Published on npm: `0.0.1` … `0.2.0`; `latest` is `0.2.0`. **No `1.x` has ever been published** — a `^1.0.0` dependency cannot resolve.
- Never retract a published version.
- Default export: `IMAPSettingsDetector` with `detect(email, password = "hello")`,
  returning `Promise<IMAPConnectionSettings | null>` where settings are
  `{ host, port, secure }` (`src/types.ts`).
- Build output: `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts`.

**README discrepancy:** the Usage example imports from `'imap-autoconfig'`
(README.md:16), but the published package name is
`'@ankaboot.io/imap-autoconfig'`. The Installation section is correct. Use the
scoped name.

## Build, test, publish

Only these scripts exist in `package.json`:

```bash
npm run lint    # eslint --fix src (currently errors on an unused var in src/lib/AutoDiscover.ts)
npm run build   # tsup -> dist/ (CJS + ESM + .d.ts)
npm run test    # jest -> tests/ (4 suites, 25 tests)
```

There is no `publish` script. Publish manually after `npm run build` and a
version bump. `dist/` is gitignored but not npmignored, so the tarball ships the
built output; `src/` is committed but npmignored.

## Hard rules

- This is a published package. A breaking change needs a **major** version bump
  **and** an update to downstream consumers.
- Do not change the exported surface (default export, `.default` interop,
  `detect` signature) without checking downstream consumers.
- Keep the README usage example in sync with the scoped package name.
