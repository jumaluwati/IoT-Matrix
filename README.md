# Matrix (Cisco IoT Compete)

Matrix is a simple web app that helps Cisco sellers answer one question fast:

"If the customer asks about a competitor, what should we recommend from Cisco, and why?"

This guide is written for non-software users.

## What Matrix does

- Shows Cisco IoT products in a clean catalog
- Lets you compare Cisco options
- Builds competitor battlecards with:
  - key specs
  - talk track
  - proof points
  - known issues
  - reference wins

## Who this is for

- Sales teams
- Solutions engineers
- Product marketing
- Anyone preparing customer conversations

## Quick start (first time)

1. Install Node.js (LTS) on your Mac/PC.
2. Open a terminal in this project folder.
3. Run:

```bash
npm install
npm run dev -- --port 3001
```

4. Open your browser:

- App home: `http://localhost:3001`
- Cisco IoT portfolio: `http://localhost:3001/portfolio`

Note: We use port `3001` because many machines already use `3000` for other apps.

## Day-to-day use

1. Start the app:

```bash
npm run dev -- --port 3001
```

2. Open `http://localhost:3001`.
3. Pick a competitor.
4. Pick the product line.
5. Review the battlecard and use it in your call.

## Main pages

- `/` → Competitor picker
- `/portfolio` → Cisco IoT product catalog
- `/portfolio/compare` → Compare two Cisco products
- `/use-cases` → Use-case views
- `/about` → How Matrix builds battlecards

## Common issues (and easy fixes)

### 1) "npm: command not found"

Node.js is missing from your terminal.

Fix:

- Install Node.js LTS
- Open a new terminal window
- Run `node -v` and `npm -v` to confirm

### 2) Mac says Next SWC file may be unsafe

You may see a message about `next-swc.darwin-arm64.node`.

Fix (run in project folder):

```bash
xattr -dr com.apple.quarantine node_modules/@next
npm run dev -- --port 3001
```

### 3) "Port already in use"

Use a different port:

```bash
npm run dev -- --port 3002
```

Then open `http://localhost:3002`.

## Updating content (non-code view)

The app content is stored in data files. If a technical teammate helps with updates, these are the key files:

- `src/data/competitors.ts`
- `src/data/cisco-iiot.ts`
- `src/data/battlecards.ts`
- `src/data/use-cases.ts`

## Helpful commands

```bash
npm run dev -- --port 3001   # start app
npm run typecheck             # check project types
npm run build                 # production build
```

## Privacy and safety notes

- This repo does not ship vendor logos/artwork.
- If live data sources are enabled later, treat internal data carefully and follow your company policy.

## Need help quickly?

If the app does not open:

1. Make sure the terminal is still running `npm run dev`.
2. Try another port (`3002`).
3. Restart terminal and run the command again.
4. Share the error text with your support/engineering contact.
