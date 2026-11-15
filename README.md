# Mefin — My Finance

A responsive, local-first personal finance workspace built with React, TypeScript, Vite, Recharts, Lucide and Dexie/IndexedDB. Mefin is designed for manual tracking: it has no bank connections, hosted finance backend, user sign-in or cloud sync.

## Visual direction

The final interface uses the supplied **Mossy Hollow** palette throughout:

| Role | Hex |
|---|---|
| Primary olive | `#636B2F` |
| Muted sage | `#BAC095` |
| Soft lime | `#D4DE95` |
| Deep olive | `#3D4127` |

Glassmorphism is balanced rather than pervasive. The landscape hero, translucent shell and selected summary panels use glass surfaces; tables and forms prioritize legibility.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Features

- **Overview:** period-based metrics, six-month cash flow, expense category breakdown, recent activity, budgets and savings goals.
- **Transactions:** create, edit, delete, search, filter and export CSV. CSV import is intentionally not included in this release.
- **Accounts:** add/remove accounts and manually edit balances.
- **Budgets:** set category limits, edit limits, navigate months and see actual spending calculated from expense entries.
- **Savings goals:** set targets, optional target month, add contributions and track progress.
- **Settings:** export/restore a JSON backup, export transactions as CSV and clear all local records.
- **Keyboard:** `⌘/Ctrl + K` focuses search; `⌘/Ctrl + N` opens quick-add; `Esc` closes overlays.

## Data and privacy

Records persist in browser IndexedDB through Dexie. They stay in the current browser profile and do not sync to other devices. Browser storage is not encrypted by Mefin and may be removed if site data is cleared. Export backups regularly and store them somewhere secure. Restoring a backup replaces the current records after confirmation.

Account balances start from the manually maintained opening balance and adjust by recorded income and expense transactions. Budget spend is derived from expense transactions for the selected month. Goal contributions update goal progress but do not create expenses or transfers.

The first launch includes clearly labelled illustrative preview records. Use **Clear preview data** before entering your own finances, or **Load sample data** to replace the active profile with a larger set of testing records. The Settings page also includes a complete local-data reset.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. Import the repository in Vercel.
3. Select Vite, build command `npm run build`, output directory `dist`.
4. Deploy.

## Deploy to GitHub Pages

1. Create an empty repository on GitHub and upload/push this project to its `main` branch. Do not commit `node_modules` or `dist`.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist`.
4. Find the published URL under **Settings → Pages**.

The workflow handles repository project sites (for example, `https://USERNAME.github.io/REPOSITORY/`) automatically. For a user site (`USERNAME.github.io`) or custom domain, change `PAGES_BASE_PATH` in the workflow build step to `/` before deploying.

### Upload with Git

From the project folder, after creating an empty GitHub repository, run:

```bash
git init
git add .
git commit -m "Prepare Mefin for GitHub Pages"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Replace `USERNAME` and `REPOSITORY` with your GitHub account and repository name.

## Verification note

The TSX/TS sources passed a syntax transpilation check. Dependency installation timed out in the build environment, so a complete `npm run build` has not yet been verified. Install dependencies locally and run the production build before deployment.

## Extended local-workspace release

The current release expands the original local-first MVP without adding a Mefin backend:

- **Profiles & Workspace:** create and switch between a Personal profile and separate local workspaces. Each scope stores its own transactions, accounts, budgets, goals, recurring schedules and dismissed reminders in IndexedDB snapshots.
- **Privacy & Control:** inspect local-storage boundaries, export/import a profile JSON backup, clear the active profile, delete a non-primary workspace, or erase all local Mefin data.
- **Help Center:** searchable offline guides and FAQs.
- **Net Worth:** manually calculated assets minus liability accounts. Account types containing `credit`, `loan`, `debt` or `liability` are treated as liabilities.
- **Recurring:** configure, pause, resume or delete weekly, monthly or yearly items. They do not post automatically; use **Record now** to create a transaction and advance the next date with month-end date clamping.
- **Calendar:** inspect transactions and recurring due dates by day.
- **Insights:** descriptive month-to-date spending and budget calculations, not financial advice or forecasts.
- **Notifications:** in-app reminders for budgets at 80%+, recurring items due within seven days (including overdue items), and completed savings goals. Dismissals are stored locally.
- **Reports:** period summaries, category totals, CSV export and browser Print / Save PDF. CSV import is intentionally deferred.

### Local workspace limitations

Profiles and workspaces are local containers in one browser profile. They are not login identities, do not sync across devices, and cannot be shared with other people. Shared collaboration, roles, cloud backup, encryption-at-rest, PIN lock and remote device/session controls are not implemented. IndexedDB is not encrypted by Mefin; secure the device and maintain backups.

### Data migration

The Dexie database is upgraded to schema version 2. Existing version-1 financial records are preserved and migrated into the Personal workspace snapshot on first launch after upgrading. Backups from version 1 remain importable; version 2 backups also include recurring schedules.
