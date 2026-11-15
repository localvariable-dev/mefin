# Mefin — setup and release steps

## 1. Requirements

Install Node.js 20+ and npm. Verify with:

```bash
node -v
npm -v
```

## 2. Run the app

Extract the ZIP, open a terminal in the `mefin` folder, and run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## 3. Verify the production build

```bash
npm run build
npm run preview
```

Fix any environment-specific build errors before deploying. A successful production build was not verified in the packaging environment because npm dependency installation timed out.

## 4. Deploy to Vercel

- Push the project to GitHub.
- Import the repository into Vercel.
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.

## 5. Keyboard shortcuts

- `⌘/Ctrl + K`: focus transaction search.
- `⌘/Ctrl + N`: open quick-add transaction.
- `Esc`: close modal or mobile navigation drawer.

## 6. Before entering real financial data

- Clear the labelled preview records.
- Create accounts and set their manually maintained balances.
- Create budgets and savings goals.
- Export a JSON backup regularly. Browser storage is local to this browser profile and is not encrypted by Mefin. CSV is export-only; use JSON backup/restore for full profile migration. CSV is export-only; use JSON backup/restore for full profile migration.
