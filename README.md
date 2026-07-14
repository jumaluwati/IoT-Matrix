# Matrix (Cisco IoT Compete)

Matrix helps you answer customer questions quickly:

If a customer mentions a competitor, Matrix shows what Cisco product to lead with and why.

This guide is for non-software users.

## What you can do in Matrix

- Browse Cisco IoT products
- Compare Cisco products side by side
- Open battlecards with key points for customer calls

## Important: Live information needs personal Circuit keys

Matrix can run in two modes:

- Mock mode: shows built-in demo data
- Live mode: retrieves fresh information using Cisco Circuit

To use live retrieval, you must add your own personal Circuit credentials in `.env.local`.

Required keys:

- `CIRCUIT_CLIENT_ID`
- `CIRCUIT_CLIENT_SECRET`
- `CIRCUIT_APP_KEY`
- `USE_MOCK_BATTLECARDS=false`

If these are missing, pages can still load, but live retrieval will not work.

## Quick start

1. Install Node.js (LTS).
2. Open terminal in this folder.
3. Run:

```bash
npm install
npm run dev -- --port 3001
```

4. Open:

- http://localhost:3001
- http://localhost:3001/portfolio

## Normal daily use

Run:

```bash
npm run dev -- --port 3001
```

Then open http://localhost:3001 and use the menus.

## Common fixes

### npm not found

Install Node.js LTS, open a new terminal, then check:

```bash
node -v
npm -v
```

### Mac blocks next-swc file

Run:

```bash
xattr -dr com.apple.quarantine node_modules/@next
npm run dev -- --port 3001
```

### Port 3001 already in use

Run:

```bash
npm run dev -- --port 3002
```

Then open http://localhost:3002
