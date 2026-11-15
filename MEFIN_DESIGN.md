# MEFIN --- MVP Design Specification

**Document status:** Draft for review\
**Product:** Mefin (My Finance)\
**Release scope:** Personal finance MVP\
**Primary visual reference:** User-provided ORVYN fintech
landing-page/dashboard image\
**Approved decisions:** Sidebar navigation · INR (₹) default currency ·
Quick-add plus dedicated transactions page\
**Design direction:** Minimal premium fintech with Apple-inspired
glassmorphism

------------------------------------------------------------------------

## 1. Product overview

Mefin is a personal finance management web application for tracking
money manually. Users enter their own income, expenses, account
balances, budgets and savings goals. The application turns those entries
into a clear financial overview with useful charts and summaries.

### Product principles

1.  **Manual-first:** no bank connections, payment integrations or
    automatic transaction imports in the MVP.
2.  **Local-first:** financial records are stored in the user's browser
    on their device. No application backend or hosted financial
    database.
3.  **Clarity over complexity:** prioritize a small number of useful
    features and clear information hierarchy.
4.  **Visual quality:** the interface should feel calm, spacious,
    refined and consistent.
5.  **Responsive:** core workflows must remain usable on desktop, tablet
    and mobile.
6.  **Honest financial presentation:** derived values must be calculated
    from entered data; no fabricated balances or financial advice.

### MVP success criteria

-   A user can add, edit, delete and find transactions.
-   Dashboard totals and charts reflect the saved transactions.
-   Users can manage accounts, budgets and savings goals manually.
-   Data remains available after refreshing or reopening the app in the
    same browser profile.
-   Users can export a backup and restore it.
-   The app can be deployed as a static site to Vercel or GitHub Pages
    without a backend.

------------------------------------------------------------------------

## 2. Visual direction

### Reference interpretation

Use the uploaded ORVYN reference for its visual language rather than
copying its exact content or page layout:

-   Soft aqua / sky-toned atmospheric background.
-   Blurred landscape and rolling green hills as restrained visual
    texture.
-   Large white or translucent interface surfaces.
-   Rounded dashboard panels with generous whitespace.
-   Minimal navigation and compact labels.
-   Strong, readable financial numbers.
-   Restrained lemon-yellow highlights.
-   Subtle borders, shadows and soft transitions.

Mefin should look like a finance product first. Decorative scenery must
never compete with data, labels or controls.

### Apple-inspired glassmorphism

Use an Apple-inspired glass surface treatment: translucent layers,
background blur, subtle highlights and fine borders. This is a visual
reference, not an attempt to reproduce Apple's interface.

**Glass surface recipe** - Light translucent fill, typically white with
approximately 65--82% opacity. -
`backdrop-filter: blur(...) saturate(...)` where supported. - Fine white
/ neutral border with low opacity. - Soft, diffuse shadow rather than a
hard drop shadow. - Rounded corners with a consistent radius scale. -
Maintain readable contrast over every background. - Use opaque or nearly
opaque surfaces for dense data tables and forms.

**Use glass on** - Sidebar and top-level navigation surfaces. - Header /
floating utility controls. - Hero or welcome panel. - Small summary
cards where the background remains controlled. - Modal overlays and
floating quick-action surfaces.

**Avoid glass on** - Long transaction tables with many rows. - Dense
settings forms. - Small text placed over busy imagery. - Every component
at once. Alternate glass panels with clean solid-white cards to preserve
hierarchy.

**Fallback:** when `backdrop-filter` is unsupported, use a more opaque
background and the same border/shadow treatment.

------------------------------------------------------------------------

## 3. Design tokens

Initial values are a starting point and may be tuned during
implementation while preserving the direction.

### Color palette

  -----------------------------------------------------------------------
  Token                   Suggested value         Use
  ----------------------- ----------------------- -----------------------
  `--color-aqua-50`       `#EFF9F7`               Soft page tint

  `--color-aqua-100`      `#DDF2EE`               Glass / highlighted
                                                  surfaces

  `--color-mint-200`      `#C6E5D8`               Supporting accents

  `--color-green-600`     `#568B75`               Primary positive accent

  `--color-green-800`     `#285B49`               Strong green text /
                                                  active states

  `--color-lemon`         `#F5ED78`               Small highlights and
                                                  primary accent details

  `--color-ink`           `#202824`               Main text

  `--color-muted`         `#7F8B83`               Secondary text

  `--color-border`        `#E7EDE8`               Dividers and card
                                                  borders

  `--color-surface`       `#FFFFFF`               Solid cards

  `--color-danger`        `#C66E62`               Expense / destructive
                                                  states

  `--color-income`        `#548D73`               Income values
  -----------------------------------------------------------------------

Use green for positive financial movement and muted coral for expenses.
Do not rely on color alone; pair it with labels, signs and icons.

### Typography

-   Preferred family: **Manrope** for headings and prominent figures;
    **DM Sans** for body text and controls.
-   Use a system sans-serif fallback.
-   Headings: medium / semibold, restrained letter spacing.
-   Financial values: semibold, tabular numerals where possible.
-   Labels: compact but readable; avoid excessively tiny uppercase text.
-   Maintain accessible body text sizing, normally 14--16px.

### Shape, spacing and elevation

-   Card radius: 16--22px.
-   Inputs and buttons: 10--12px radius.
-   Small chips: pill or 8px radius.
-   Use a consistent spacing scale based on 4px / 8px increments.
-   Shadows should be soft and low contrast.
-   Use fine borders to define glass surfaces rather than strong
    outlines.

### Motion

-   Short, subtle transitions for hover, focus, opening panels and
    navigation.
-   Avoid parallax, excessive floating animations or motion that
    distracts from financial tasks.
-   Respect `prefers-reduced-motion`.

------------------------------------------------------------------------

## 4. Application information architecture

### Primary navigation

Persistent left sidebar on desktop:

1.  Overview
2.  Transactions
3.  Accounts
4.  Budgets
5.  Savings Goals
6.  Settings

The sidebar should include: - Mefin logo and wordmark. - Active
navigation state. - Compact user / workspace area. - Privacy note such
as "Stored on this device". - A clear collapse or mobile-drawer
behavior.

On mobile, use a drawer or compact navigation pattern that does not
consume the main content width.

### Global header

-   Current page title / breadcrumb.
-   Search entry point (search transactions in MVP; global search can be
    deferred).
-   Optional date-period selector where relevant.
-   Quick-add transaction action.
-   Settings or profile access where appropriate.

------------------------------------------------------------------------

## 5. MVP pages and features

### 5.1 Overview dashboard

**Purpose:** answer "Where does my money stand?" at a glance.

**Content hierarchy** 1. Welcome / page heading and current period. 2.
Primary summary cards: - Total balance across tracked accounts. - Income
for selected period. - Expenses for selected period. - Net savings /
savings rate. 3. Income versus expenses visualization. 4. Spending by
category visualization. 5. Budget progress summary. 6. Recent
transactions. 7. Savings-goal progress summary.

**Dashboard interactions** - Period filter: this month, last month, last
3 months, this year, custom range (custom range may be deferred if it
complicates MVP). - Quick-add opens a transaction form. - "View all"
links to the relevant full page. - Clicking a chart category may filter
transactions by that category if practical.

**Calculation definitions** - Period income = sum of income transactions
within the selected date range. - Period expenses = sum of expense
transactions within the selected date range. - Net cash flow = period
income minus period expenses. - Savings rate = net cash flow / period
income × 100; display as unavailable when period income is zero. - Total
balance = sum of current account balances. Account balances are manually
maintained or derived consistently from an opening balance plus linked
transactions; choose one model during implementation and use it
everywhere. - Do not label net cash flow as "savings" unless the
product's calculation and copy make that distinction clear.

### 5.2 Transactions

**Purpose:** maintain a complete, searchable record of money movement.

**Transaction fields** - Type: income or expense. - Amount in INR. -
Description / merchant / source. - Category. - Account. - Date. -
Optional note.

**Actions** - Add transaction. - Edit transaction. - Delete transaction
with confirmation. - Search by description. - Filter by type, category,
account and date range. - Sort newest / oldest and amount. - Empty state
with a clear "Add your first transaction" action.

**Entry experience** - A global quick-add action available from the main
application. - A dedicated Transactions page with the complete list and
filters. - Use a modal or side panel for quick entry; use the same
reusable form on the Transactions page. - Validate positive amounts,
required type, date and category. - Clearly distinguish income and
expense in text and styling.

### 5.3 Accounts

**Purpose:** organize the places where the user keeps money.

**MVP account types** - Cash. - Savings account. - Current account. -
Other / custom.

**Fields** - Account name. - Account type. - Opening balance. - Current
balance. - Optional color or icon.

Keep account management manual. Do not imply that balances are synced
with banks.

### 5.4 Budgets

**Purpose:** help users set and monitor spending limits.

**Features** - Monthly budget amount. - Category-level budget limits. -
Spent amount and remaining amount. - Progress bar and clear over-budget
state. - Budget period / month selection.

Budget spent amount is calculated from expense transactions in the
selected category and period.

### 5.5 Savings goals

**Purpose:** make savings targets visible and measurable.

**Fields** - Goal name. - Target amount. - Current saved amount. -
Optional target date. - Optional icon / accent.

**Features** - Progress percentage. - Remaining amount. - Add
contribution / update saved amount. - Edit and delete goal.

For MVP, goal contributions can be tracked as goal records without
requiring automatic movement between bank accounts. Avoid
double-counting them as expenses unless the user explicitly records a
corresponding transaction.

### 5.6 Settings

**MVP settings** - Currency: INR (₹) default. - Date display preference
if needed. - Theme: light default; dark mode optional and can be
deferred. - Export all data as JSON backup. - Import / restore JSON
backup with validation and confirmation. - Export transactions as CSV. -
Clear local data with a strong confirmation step. - Privacy explanation:
records are stored in this browser on this device.

------------------------------------------------------------------------

## 6. Data visualization rules

Charts should be useful, legible and consistent with the calm design
system.

  -----------------------------------------------------------------------
  Chart                   Recommended form        Information
  ----------------------- ----------------------- -----------------------
  Income vs expenses      Two-series line / area  Trend over selected
                          chart                   months

  Spending categories     Donut chart             Expense share by
                                                  category

  Budget usage            Horizontal progress     Spent versus limit
                          bars                    

  Savings goals           Progress bars / compact Current versus target
                          rings                   

  Monthly cash flow       Bar chart               Income, expenses and
                                                  net flow
  -----------------------------------------------------------------------

**Visualization rules** - Use green for income / positive movement. -
Use muted coral for expenses. - Use lemon yellow sparingly for selected
data or key highlights. - Provide labels, legends and hover tooltips. -
Format values using Indian numbering and INR, e.g. `₹1,25,000`. - Ensure
charts have useful empty states when there is no data. - Never show
sample figures as if they were real user data. Demo data must be clearly
marked and removable. - Avoid 3D charts, unnecessary gradients and
excessive gridlines.

------------------------------------------------------------------------

## 7. Local-first data and privacy

### Storage

Use **IndexedDB**, accessed through **Dexie.js**, for structured local
records. Do not use a hosted database or backend for MVP financial data.

Suggested entities: - `transactions` - `accounts` - `budgets` -
`goals` - `settings`

### Persistence expectations

-   Data survives refresh and browser restarts in the same browser
    profile.
-   Data is not automatically synchronized across browsers or devices.
-   Clearing browser site data may remove the records.
-   Users must be able to export and restore a complete JSON backup.
-   CSV export is for transaction analysis and is not a full restore
    format.

### Privacy messaging

Be precise: local-first storage means financial records are not sent to
a Mefin backend. It does not mean browser storage is encrypted or immune
to device compromise. Encourage users to protect their device and keep
backups.

------------------------------------------------------------------------

## 8. Recommended technology

  -----------------------------------------------------------------------
  Layer                   Choice                  Reason
  ----------------------- ----------------------- -----------------------
  Framework               React + TypeScript      Component-driven UI and
                                                  type safety

  Build tool              Vite                    Lightweight static
                                                  build and simple
                                                  deployment

  Styling                 Tailwind CSS + CSS      Fast layout work and
                          variables               consistent design
                                                  tokens

  Charts                  Recharts                Responsive charts
                                                  integrated with React

  Icons                   Lucide React            Consistent lightweight
                                                  icon set

  Routing                 React Router            Page navigation

  Local database          Dexie.js + IndexedDB    Structured persistent
                                                  browser storage

  Forms / validation      React Hook Form + Zod   Reliable input handling
                                                  and validation

  Hosting                 Vercel or GitHub Pages  Static frontend hosting
  -----------------------------------------------------------------------

No Java/Spring backend is required for this local-only MVP. The
architecture should remain simple enough to maintain as a solo project.

------------------------------------------------------------------------

## 9. Suggested project structure

``` text
mefin/
├── public/
│   ├── assets/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   └── feedback/
│   ├── layouts/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── features/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── goals/
│   │   └── settings/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── calculations.ts
│   │   ├── currency.ts
│   │   └── backup.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   └── globals.css
│   ├── types/
│   └── main.tsx
├── MEFIN_DESIGN.md
├── README.md
├── package.json
└── vite.config.ts
```

------------------------------------------------------------------------

## 10. Responsive behavior

### Desktop

-   Persistent sidebar.
-   Multi-column dashboard cards.
-   Charts and transaction panels side by side where space permits.
-   Comfortable max-width and generous spacing.

### Tablet

-   Narrow or collapsible sidebar.
-   Two-column metric cards where practical.
-   Charts stack when width is constrained.

### Mobile

-   Sidebar becomes a drawer or compact navigation.
-   Metric cards use a two-column grid or single column on narrow
    screens.
-   Charts use full width.
-   Transaction rows simplify to prioritize description, date and
    amount.
-   Quick-add remains easy to reach.
-   Modals become near-full-screen sheets where appropriate.

No horizontal page scrolling should be required at common mobile widths.

------------------------------------------------------------------------

## 11. Accessibility and interaction requirements

-   Semantic page landmarks and correctly ordered headings.
-   Keyboard-accessible navigation, forms, dialogs and controls.
-   Visible focus states.
-   Accessible labels for icon-only buttons.
-   Sufficient text and control contrast over translucent surfaces.
-   Do not communicate status by color alone.
-   Respect reduced-motion preferences.
-   Forms must show clear inline validation and error messages.
-   Confirm destructive actions such as deletion and clearing all data.

------------------------------------------------------------------------

## 12. Explicit MVP boundaries

### Included

-   Manual entry and editing of transactions.
-   Accounts and manually maintained balances.
-   Category budgets.
-   Savings goals.
-   Dashboard summaries and charts.
-   Local persistence.
-   JSON backup / restore and CSV transaction export.
-   Responsive layout.
-   Static hosting.

### Excluded from MVP

-   Bank account linking and open banking.
-   UPI, payment processing or automatic SMS parsing.
-   Cloud sync, user accounts, login or multi-user sharing.
-   Backend APIs and hosted database.
-   Investment portfolio tracking and live market prices.
-   Tax filing, loan amortization and complex financial planning.
-   AI financial advisor or automated recommendations.
-   Notifications requiring a server.

These may be reconsidered after the MVP is stable.

------------------------------------------------------------------------

## 13. Delivery phases

### Phase 1 --- Design system and application shell

-   Establish brand, tokens, typography and glass surface patterns.
-   Implement responsive sidebar and global header.
-   Build page shells and the dashboard visual layout.
-   Establish reusable cards, buttons, inputs, modals and chart
    containers.
-   Use clearly labeled placeholder/demo values only for visual
    development.
-   Review visual fidelity before connecting real data.

### Phase 2 --- Functional MVP modules

-   Implement transaction CRUD and filtering.
-   Implement accounts, budgets and savings goals.
-   Connect dashboard metrics and visualizations to application state.
-   Add validation, empty states and useful feedback.

### Phase 3 --- Persistence, reliability and deployment

-   Add Dexie / IndexedDB persistence.
-   Add JSON backup / restore and CSV export.
-   Test calculations, data integrity, responsive behavior and refresh
    persistence.
-   Configure Vercel / GitHub Pages deployment.
-   Deliver setup instructions and final project ZIP.

------------------------------------------------------------------------

## 14. Acceptance checklist

The MVP is ready for release when:

-   [ ] The UI follows the approved ORVYN-inspired visual direction.
-   [ ] Apple-inspired glass surfaces are used selectively and remain
    readable.
-   [ ] Sidebar navigation works at desktop and mobile sizes.
-   [ ] INR is the default currency and formatting uses Indian number
    grouping.
-   [ ] Quick-add and the dedicated Transactions page share the same
    transaction form logic.
-   [ ] Transaction create, read, update and delete operations work.
-   [ ] Dashboard totals and charts derive from actual stored entries.
-   [ ] Accounts, budgets and goals work without a backend.
-   [ ] Data persists locally after refresh.
-   [ ] JSON backup and restore work and handle invalid files safely.
-   [ ] CSV export produces usable transaction data.
-   [ ] Empty states, validation, loading and error states are designed.
-   [ ] No financial records are sent to a Mefin server.
-   [ ] The production build succeeds and deployment instructions are
    documented.

------------------------------------------------------------------------

## 15. Review decisions

The following decisions are approved and should be treated as project
constraints:

-   **Navigation:** sidebar.
-   **Default currency:** INR (₹).
-   **Transaction entry:** global quick-add plus dedicated Transactions
    page.
-   **Storage:** local browser storage only; no Mefin backend or
    database.
-   **Product scope:** personal finance MVP.
-   **Visual reference:** user-provided ORVYN screenshot.
-   **Visual treatment:** Balanced Apple-inspired glassmorphism combined with
    clean solid surfaces.
-   **Dashboard background:** Aqua sky and soft green landscape treatment; keep it restrained outside the hero.

Any changes to these decisions should be made during design review
before implementation.


## Final visual-system update — Mossy Hollow palette

The final approved palette supplied by the user supersedes the earlier aqua/green color direction. Apply these colors consistently to all navigation, surfaces, chart series, progress indicators, form states, buttons and responsive layouts:

- Primary olive: `#636B2F`
- Muted sage: `#BAC095`
- Soft lime: `#D4DE95`
- Deep olive: `#3D4127`

Use deep olive for primary text and dark actions, primary olive for active navigation and key chart accents, sage for secondary surfaces and subdued data series, and soft lime for selected states and highlights. Keep glassmorphism balanced and preserve high contrast for financial values and form controls.

## 16. Approved extended local-workspace scope — 15 November 2026

The user has explicitly approved an expanded release while retaining the local-first architecture. This section supersedes the original MVP feature exclusions only for the features listed below. The no-backend, no-bank-linking and manual-first constraints remain in force.

### Profile and workspace model

- Provide a primary Personal profile and allow additional local Personal profiles and Workspaces.
- The sidebar workspace selector and Profile & Workspace page allow creating, switching and renaming spaces; non-primary spaces can be deleted.
- Each space has an independent IndexedDB snapshot for transactions, accounts, budgets, savings goals, recurring schedules and dismissed in-app reminders.
- Switching spaces must not merge records or expose one space's records in another.
- These are local data scopes, not authenticated identities, shared workspaces or cross-device synchronization.

### Additional approved modules

- **Privacy & Control:** local-storage explanation, profile backup/restore, active-profile clearing and workspace deletion. Be explicit that IndexedDB is not encrypted by Mefin.
- **Help Center:** searchable offline guides and FAQs.
- **Net Worth:** manually calculated assets less liabilities, using account type classification; no live investment pricing.
- **Recurring Transactions:** weekly, monthly and yearly schedules. A user must confirm Record now; do not post transactions automatically.
- **Financial Calendar:** calendar view of recorded transactions and configured recurring due dates.
- **Insights:** descriptive calculations derived from entered transactions, budgets and goals; not forecasts or personalized financial advice.
- **Notifications:** in-app budget threshold, recurring due-date and completed-goal reminders. No server push notifications.
- **Reports:** date-period summaries, category totals, CSV export and browser print-to-PDF.

### Updated visual decisions

- Preserve the balanced glassmorphism treatment.
- Preserve the landscape-inspired hero, but recolor its atmosphere and hills using the Mossy Hollow palette above; do not retain the former aqua color system.
- The four approved palette values remain the authoritative design tokens.

### Explicitly not included in this release

Authentication, cloud sync, multi-user sharing, role-based permissions, remote device/session management, bank/UPI integration, automatic payment posting, server notifications, encrypted-at-rest database storage, PIN/app lock and live investment prices. Do not present these as implemented capabilities.

### Release-specific data exchange decision

- JSON backup/restore is the complete profile portability format.
- Transaction CSV is export-only in this release. CSV import is intentionally deferred; do not add CSV parsing or CSV import UI to this milestone.
- JSON backup schema v3 includes transactions, accounts, budgets, goals, recurring schedules and dismissed in-app reminder IDs. Version 1 and 2 JSON backups remain supported for restore.

### Release-specific data exchange decision

- JSON backup/restore is the complete profile portability format.
- Transaction CSV is export-only in this release. CSV import is intentionally deferred; do not add CSV parsing or CSV import UI to this milestone.
- JSON backup schema v3 includes transactions, accounts, budgets, goals, recurring schedules and dismissed in-app reminder IDs. Version 1 and 2 JSON backups remain supported for restore.
