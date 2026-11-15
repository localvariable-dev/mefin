import { useEffect, useMemo, useState } from 'react'
import {
  db,
  type StoredAccount,
  type StoredBudget,
  type StoredGoal,
  type RecurringItem,
  type Workspace,
  type WorkspaceSnapshot,
  type SyncInfo,
  saveDB,
  pullRemoteDB,
  loginOrRegister,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  getAuthToken,
  getAuthUser,
  logout,
  subscribeSyncStatus,
  getSyncStatus,
  applySnapshotToDexie
} from './db'
import type { Tx } from './types'
import { NetWorthPage, RecurringPage, CalendarPage, InsightsPage, NotificationsPage, ReportsPage, PrivacyPage, HelpPage, ProfileWorkspacePage, type NoticeItem } from './ExtendedPages'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, ChartPie, Target, Settings, Search,
  Bell, Plus, ChevronDown, ChevronRight, Menu, X, ShieldCheck, ArrowUpRight,
  ArrowDownLeft, Ellipsis, Download, Sparkles, Landmark, SlidersHorizontal,
  CalendarDays, CircleHelp, ReceiptText, CircleDollarSign, Pencil, Trash2, Check,
  CloudDownload, Upload, FileSpreadsheet, LockKeyhole, LogOut, RefreshCw,
  Cloud, Mail, KeyRound
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'

type Page = 'Overview' | 'Transactions' | 'Accounts' | 'Budgets' | 'Savings Goals' | 'Net Worth' | 'Recurring' | 'Calendar' | 'Insights' | 'Notifications' | 'Reports' | 'Profile & Workspace' | 'Privacy & Control' | 'Help Center' | 'Settings'
const localDateString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const offsetDate = (days: number) => { const d = new Date(); d.setDate(d.getDate()+days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
const demoTransactions: Tx[] = [
  { id: 101, title: 'Monthly salary', category: 'Salary', account: 'HDFC Savings', date: offsetDate(-1), amount: 72000, type: 'income' },
  { id: 102, title: 'Freelance design project', category: 'Freelance', account: 'HDFC Savings', date: offsetDate(-4), amount: 12500, type: 'income' },
  { id: 103, title: 'Apartment rent', category: 'Home & bills', account: 'HDFC Savings', date: offsetDate(-2), amount: 22000, type: 'expense' },
  { id: 104, title: 'Netflix subscription', category: 'Subscriptions', account: 'HDFC Savings', date: offsetDate(-3), amount: 649, type: 'expense' },
  { id: 105, title: 'Spotify Premium', category: 'Subscriptions', account: 'HDFC Savings', date: offsetDate(-8), amount: 119, type: 'expense' },
  { id: 106, title: 'Prime Video', category: 'Subscriptions', account: 'HDFC Savings', date: offsetDate(-15), amount: 299, type: 'expense' },
  { id: 107, title: 'Weekly groceries', category: 'Food & groceries', account: 'Cash', date: offsetDate(-1), amount: 1845, type: 'expense' },
  { id: 108, title: 'Vegetable market', category: 'Food & groceries', account: 'Cash', date: offsetDate(-6), amount: 680, type: 'expense' },
  { id: 109, title: 'Online shopping – headphones', category: 'Shopping', account: 'HDFC Savings', date: offsetDate(-5), amount: 3299, type: 'expense' },
  { id: 110, title: 'Clothing store', category: 'Shopping', account: 'HDFC Savings', date: offsetDate(-18), amount: 2450, type: 'expense' },
  { id: 111, title: 'Fuel', category: 'Transport', account: 'Cash', date: offsetDate(-2), amount: 1600, type: 'expense' },
  { id: 112, title: 'Metro card recharge', category: 'Transport', account: 'Cash', date: offsetDate(-9), amount: 500, type: 'expense' },
  { id: 113, title: 'Electricity bill', category: 'Home & bills', account: 'HDFC Savings', date: offsetDate(-11), amount: 2180, type: 'expense' },
  { id: 114, title: 'Internet bill', category: 'Home & bills', account: 'HDFC Savings', date: offsetDate(-12), amount: 999, type: 'expense' },
  { id: 115, title: 'Dinner with friends', category: 'Food & groceries', account: 'Cash', date: offsetDate(-7), amount: 1320, type: 'expense' },
  { id: 116, title: 'Coffee', category: 'Food & groceries', account: 'Cash', date: offsetDate(-10), amount: 260, type: 'expense' },
  { id: 117, title: 'Pharmacy', category: 'Health', account: 'Cash', date: offsetDate(-14), amount: 735, type: 'expense' },
  { id: 118, title: 'Movie tickets', category: 'Entertainment', account: 'HDFC Savings', date: offsetDate(-16), amount: 900, type: 'expense' },
  { id: 119, title: 'Cab ride', category: 'Transport', account: 'Cash', date: offsetDate(-20), amount: 420, type: 'expense' },
  { id: 120, title: 'Water bill', category: 'Home & bills', account: 'HDFC Savings', date: offsetDate(-22), amount: 540, type: 'expense' },
  { id: 121, title: 'Online course', category: 'Shopping', account: 'HDFC Savings', date: offsetDate(-25), amount: 1999, type: 'expense' },
  { id: 122, title: 'Dinner delivery', category: 'Food & groceries', account: 'Cash', date: offsetDate(-27), amount: 780, type: 'expense' },
  { id: 123, title: 'Reimbursement', category: 'Other', account: 'SBI Current', date: offsetDate(-13), amount: 2350, type: 'income' },
  { id: 124, title: 'Bookstore', category: 'Shopping', account: 'Cash', date: offsetDate(-29), amount: 1150, type: 'expense' },
]
const nav = [
  { label: 'Overview' as Page, icon: LayoutDashboard },
  { label: 'Transactions' as Page, icon: ArrowLeftRight },
  { label: 'Accounts' as Page, icon: Wallet },
  { label: 'Budgets' as Page, icon: ChartPie },
  { label: 'Savings Goals' as Page, icon: Target },
  { label: 'Net Worth' as Page, icon: Landmark },
  { label: 'Recurring' as Page, icon: CalendarDays },
  { label: 'Calendar' as Page, icon: CalendarDays },
  { label: 'Insights' as Page, icon: Sparkles },
  { label: 'Reports' as Page, icon: FileSpreadsheet },
]
const seed: Tx[] = demoTransactions
const budgets = [
  { name: 'Home & bills', spent: 9200, limit: 12000, color: '#636B2F' },
  { name: 'Food & groceries', spent: 5200, limit: 7000, color: '#BAC095' },
  { name: 'Transport', spent: 1850, limit: 2500, color: '#D4DE95' },
]
const money = (v: number) => '₹' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const signedMoney = (v: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${money(v)}`
const dateLabel = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function Brand({ small = false }: { small?: boolean }) {
  return <div className="brand"><span className="brand-symbol"><i/><i/><i/><i/><i/></span>{!small && <span className="brand-name">mefin<span>.</span></span>}</div>
}
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-card ${className}`}>{children}</section>
}
function EmptyState({ icon: Icon, title, text, action }: { icon: typeof ReceiptText; title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22}/></div><h3>{title}</h3><p>{text}</p>{action}</div>
}

function SyncIndicator({ syncInfo, onManualSync }: { syncInfo: SyncInfo; onManualSync: () => void }) {
  const label =
    syncInfo.status === 'syncing'
      ? 'Syncing…'
      : syncInfo.status === 'synced'
      ? 'Synced'
      : syncInfo.status === 'error'
      ? 'Offline'
      : 'Cloud'

  const timeLabel = syncInfo.lastSyncedAt
    ? `Synced ${new Date(syncInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Cloud sync ready'

  return (
    <button
      type="button"
      className="sync-pill sync-pill-btn"
      onClick={onManualSync}
      title={`${timeLabel} · Click to sync now`}
      aria-label={label}
    >
      {syncInfo.status === 'syncing' ? (
        <RefreshCw size={12} className="spin-icon" />
      ) : (
        <span
          className={`sync-dot ${
            syncInfo.status === 'synced'
              ? 'sync-dot-synced'
              : syncInfo.status === 'error'
              ? 'sync-dot-error'
              : 'sync-dot-syncing'
          }`}
        />
      )}
      <span>{label}</span>
    </button>
  )
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: { id: string; email: string }) => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [resetStep, setResetStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (mode === 'reset') {
      if (resetStep === 1) {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.')
          return
        }
        setLoading(true)
        try {
          const res = await requestPasswordReset(email.trim())
          setInfo(res.message || 'A 6-digit recovery code was sent.')
          setResetStep(2)
        } catch (err: any) {
          setError(err?.message || 'Failed to request reset code.')
        } finally {
          setLoading(false)
        }
      } else {
        if (!resetOtp.trim()) {
          setError('Please enter the 6-digit reset code.')
          return
        }
        if (!newPassword || newPassword.length < 6) {
          setError('New password must be at least 6 characters.')
          return
        }
        setLoading(true)
        try {
          const res = await confirmPasswordReset(email.trim(), resetOtp.trim(), newPassword)
          onAuthenticated(res.user)
        } catch (err: any) {
          setError(err?.message || 'Failed to reset password.')
        } finally {
          setLoading(false)
        }
      }
      return
    }

    if (!email.trim() || !password) {
      setError('Please provide your email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await loginOrRegister(mode, email.trim(), password)
      onAuthenticated(res.user)
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="landscape landscape-a" />
      <div className="landscape landscape-b" />

      <div className="auth-card">
        <div className="auth-header">
          <Brand />
          <h1 className="auth-title">
            {mode === 'reset'
              ? 'Reset Password'
              : mode === 'login'
              ? 'Sign in to Mefin'
              : 'Create your private vault'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'reset'
              ? resetStep === 1
                ? 'Enter your account email to receive a 6-digit verification code.'
                : 'Enter the 6-digit code sent to your email and your new password.'
              : mode === 'login'
              ? 'Enter your credentials to access and sync your encrypted financial vault.'
              : 'Sign up to sync your workspaces and records seamlessly across devices with Cloudflare D1.'}
          </p>
        </div>

        {mode !== 'reset' ? (
          <div className="auth-segmented" role="tablist">
            <button
              type="button"
              className={`auth-segment-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setInfo('') }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-segment-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); setInfo('') }}
            >
              Create Account
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inline-link"
            style={{ alignSelf: 'center', fontSize: '13px', cursor: 'pointer' }}
            onClick={() => { setMode('login'); setResetStep(1); setError(''); setInfo('') }}
          >
            ← Back to Sign In
          </button>
        )}

        {error && (
          <div className="auth-error" role="alert">
            <LockKeyhole size={16} />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="notice" role="status">
            <span>{info}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'reset' ? (
            resetStep === 1 ? (
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="reset-email">Account Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="auth-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="auth-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="auth-label" htmlFor="reset-otp">6-Digit Code</label>
                    <button
                      type="button"
                      className="inline-link"
                      style={{ fontSize: '11.5px', cursor: 'pointer' }}
                      onClick={() => { setResetStep(1); setError(''); setInfo('') }}
                    >
                      Resend code
                    </button>
                  </div>
                  <div className="auth-input-wrap">
                    <KeyRound size={16} />
                    <input
                      id="reset-otp"
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="123456"
                      className="auth-input"
                      value={resetOtp}
                      onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label" htmlFor="reset-new-password">New Password</label>
                  <div className="auth-input-wrap">
                    <KeyRound size={16} />
                    <input
                      id="reset-new-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Min 6 characters"
                      className="auth-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )
          ) : (
            <>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="auth-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="auth-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label" htmlFor="auth-password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="inline-link"
                      style={{ fontSize: '11.5px', cursor: 'pointer' }}
                      onClick={() => { setMode('reset'); setResetStep(1); setError(''); setInfo('') }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <KeyRound size={16} />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="auth-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>
                  {mode === 'reset'
                    ? resetStep === 1 ? 'Sending code…' : 'Resetting password…'
                    : mode === 'login' ? 'Signing in…' : 'Creating vault…'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'reset'
                    ? resetStep === 1 ? 'Send 6-Digit Code' : 'Reset Password & Sign In'
                    : mode === 'login' ? 'Sign In to Mefin' : 'Create Vault & Get Started'}
                </span>
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-badge">
          <ShieldCheck size={14} />
          <span>Web Crypto PBKDF2 hashing · Cloudflare D1 Cloud Sync</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(() => getAuthUser())
  const [syncInfo, setSyncInfo] = useState<SyncInfo>(() => getSyncStatus())

  const [page, setPage] = useState<Page>('Overview')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('personal')
  const [workspaceMenu, setWorkspaceMenu] = useState(false)
  const [recurring, setRecurring] = useState<RecurringItem[]>([])
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [transactions, setTransactions] = useState<Tx[]>(seed)
  const [hydrated, setHydrated] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Tx | null>(null)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [range, setRange] = useState('This month')
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food & groceries', account: 'Cash', date: localDateString(), type: 'expense' as 'income'|'expense' })
  const [accounts, setAccounts] = useState<StoredAccount[]>([{ name: 'HDFC Savings', type: 'Savings account', balance: 64250 }, { name: 'Cash', type: 'Cash', balance: 8500 }, { name: 'SBI Current', type: 'Current account', balance: 11500 }])
  const [budgetItems, setBudgetItems] = useState<StoredBudget[]>(budgets)
  const [goals, setGoals] = useState<StoredGoal[]>([{ name: 'Emergency fund', current: 18000, target: 50000, date: 'Mar 2027' }, { name: 'New laptop', current: 24000, target: 65000, date: 'Jun 2027' }])
  const [showDemo, setShowDemo] = useState(true)

  // Subscribe to live sync status updates
  useEffect(() => {
    return subscribeSyncStatus(setSyncInfo)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector<HTMLInputElement>('.search input')?.focus() }
      if (event.key === 'Escape') { setModal(false); setMobileOpen(false); setMoreSheetOpen(false) }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); openAdd() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [accounts])

  // Initial load: pull latest D1 state if token is present, else load local Dexie
  useEffect(() => {
    if (!token) return
    let active = true

    const loadData = async () => {
      try {
        const remote = await pullRemoteDB()
        if (!active) return

        if (remote && Array.isArray(remote.transactions)) {
          // Hydrate state from remote D1
          const defaultProfiles: Workspace[] = [{ id: 'personal', name: 'Personal', kind: 'personal', createdAt: new Date().toISOString() }]
          const profiles: Workspace[] = (remote.workspaces && remote.workspaces.length > 0)
            ? remote.workspaces
            : defaultProfiles
          const activeId = remote.activeWorkspaceId && profiles.some(w => w.id === remote.activeWorkspaceId)
            ? remote.activeWorkspaceId
            : profiles[0].id

          setWorkspaces(profiles)
          setActiveWorkspaceId(activeId)
          setTransactions(remote.transactions || [])
          setAccounts(remote.accounts || [])
          setBudgetItems(remote.budgets || [])
          setGoals(remote.goals || [])
          setRecurring(remote.recurring || [])
          setDismissedNoticeIds(remote.dismissedNoticeIds || [])
          if (remote.transactions.length > 0 || remote.accounts.length > 0) setShowDemo(false)
          await applySnapshotToDexie(remote)
        } else {
          // Remote vault is empty or initial; read local Dexie records
          let profiles = await db.workspaces.toArray()
          if (!profiles.length) {
            profiles = [{ id: 'personal', name: 'Personal', kind: 'personal', createdAt: new Date().toISOString() }]
            await db.workspaces.bulkPut(profiles)
          }
          const storedActive = await db.meta.get('activeWorkspaceId')
          const activeId = typeof storedActive?.value === 'string' && profiles.some(w => w.id === storedActive.value)
            ? storedActive.value
            : (profiles.find(w => w.kind === 'personal')?.id || profiles[0].id)
          let snapshot = await db.workspaceSnapshots.get(activeId)
          if (!snapshot) {
            const [savedTransactions, savedAccounts, savedBudgets, savedGoals, initialized, savedRecurring] = await Promise.all([
              db.transactions.toArray(), db.accounts.toArray(), db.budgets.toArray(), db.goals.toArray(), db.meta.get('initialized'), db.recurring.toArray()
            ])
            const hasSavedData = savedTransactions.length + savedAccounts.length + savedBudgets.length + savedGoals.length + savedRecurring.length > 0
            if (!hasSavedData && !initialized && activeId === profiles[0].id) {
              await db.transaction('rw', db.transactions, db.accounts, db.budgets, db.goals, db.meta, async () => {
                await Promise.all([
                  db.transactions.bulkPut(seed),
                  db.accounts.bulkPut([{ name: 'HDFC Savings', type: 'Savings account', balance: 64250 }, { name: 'Cash', type: 'Cash', balance: 8500 }, { name: 'SBI Current', type: 'Current account', balance: 11500 }]),
                  db.budgets.bulkPut(budgets),
                  db.goals.bulkPut([{ name: 'Emergency fund', current: 18000, target: 50000, date: 'Mar 2027' }, { name: 'New laptop', current: 24000, target: 65000, date: 'Jun 2027' }]),
                  db.meta.put({ key: 'initialized', value: true })
                ])
              })
              snapshot = { id: activeId, transactions: seed, accounts: [{ name: 'HDFC Savings', type: 'Savings account', balance: 64250 }, { name: 'Cash', type: 'Cash', balance: 8500 }, { name: 'SBI Current', type: 'Current account', balance: 11500 }], budgets, goals: [{ name: 'Emergency fund', current: 18000, target: 50000, date: 'Mar 2027' }, { name: 'New laptop', current: 24000, target: 65000, date: 'Jun 2027' }], recurring: [], dismissedNoticeIds: [], updatedAt: new Date().toISOString() }
              setShowDemo(true)
            } else {
              snapshot = { id: activeId, transactions: savedTransactions, accounts: savedAccounts, budgets: savedBudgets, goals: savedGoals, recurring: savedRecurring, dismissedNoticeIds: [], updatedAt: new Date().toISOString() }
            }
            await db.workspaceSnapshots.put(snapshot)
          }
          if (!active) return
          setWorkspaces(profiles)
          setActiveWorkspaceId(activeId)
          setTransactions(snapshot.transactions)
          setAccounts(snapshot.accounts)
          setBudgetItems(snapshot.budgets)
          setGoals(snapshot.goals)
          setRecurring(snapshot.recurring || [])
          setDismissedNoticeIds(snapshot.dismissedNoticeIds || [])
          if (snapshot.transactions.length + snapshot.accounts.length + snapshot.budgets.length + snapshot.goals.length > 0 && snapshot.id !== profiles[0].id) setShowDemo(false)
          await db.meta.put({ key: 'activeWorkspaceId', value: activeId })

          // Push local state to D1 so cloud vault is populated
          saveDB({
            workspaces: profiles,
            activeWorkspaceId: activeId,
            transactions: snapshot.transactions,
            accounts: snapshot.accounts,
            budgets: snapshot.budgets,
            goals: snapshot.goals,
            recurring: snapshot.recurring || [],
            dismissedNoticeIds: snapshot.dismissedNoticeIds || [],
            updatedAt: new Date().toISOString()
          })
        }
      } catch {
        if (active) setNotice('Local database could not be opened. Check browser storage permissions.')
      } finally {
        if (active) setHydrated(true)
      }
    }

    void loadData()
    return () => { active = false }
  }, [token])

  // Pull latest D1 state on document visibility change (e.g. switching back to tab/app)
  useEffect(() => {
    if (!token) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void pullRemoteDB().then(remote => {
          if (remote && Array.isArray(remote.transactions)) {
            if (remote.workspaces && remote.workspaces.length > 0) setWorkspaces(remote.workspaces)
            if (remote.activeWorkspaceId) setActiveWorkspaceId(remote.activeWorkspaceId)
            setTransactions(remote.transactions)
            setAccounts(remote.accounts || [])
            setBudgetItems(remote.budgets || [])
            setGoals(remote.goals || [])
            setRecurring(remote.recurring || [])
            setDismissedNoticeIds(remote.dismissedNoticeIds || [])
            void applySnapshotToDexie(remote)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [token])

  // Save to Dexie + localStorage cache and debounce PUT /api/sync (800ms)
  useEffect(() => {
    if (!hydrated || !token) return
    const snapshot: WorkspaceSnapshot = {
      id: activeWorkspaceId,
      transactions,
      accounts,
      budgets: budgetItems,
      goals,
      recurring,
      dismissedNoticeIds,
      updatedAt: new Date().toISOString()
    }

    void db.transaction('rw', [db.transactions, db.accounts, db.budgets, db.goals, db.recurring, db.workspaceSnapshots, db.meta], async () => {
      await Promise.all([
        db.transactions.clear().then(() => db.transactions.bulkPut(transactions)),
        db.accounts.clear().then(() => db.accounts.bulkPut(accounts)),
        db.budgets.clear().then(() => db.budgets.bulkPut(budgetItems)),
        db.goals.clear().then(() => db.goals.bulkPut(goals)),
        db.recurring.clear().then(() => db.recurring.bulkPut(recurring)),
        db.workspaceSnapshots.put(snapshot),
        db.meta.put({ key: 'activeWorkspaceId', value: activeWorkspaceId })
      ])
    }).catch(() => setNotice('Could not save changes to this browser. Export a backup before closing the page.'))

    // Save to localStorage instant cache + debounced D1 cloud sync (800ms)
    saveDB({
      workspaces,
      activeWorkspaceId,
      transactions,
      accounts,
      budgets: budgetItems,
      goals,
      recurring,
      dismissedNoticeIds,
      updatedAt: new Date().toISOString()
    })
  }, [transactions, accounts, budgetItems, goals, recurring, dismissedNoticeIds, activeWorkspaceId, workspaces, hydrated, token])

  useEffect(() => {
    if (hydrated) void db.workspaces.clear().then(() => db.workspaces.bulkPut(workspaces))
  }, [workspaces, hydrated])

  const handleLogout = () => {
    if (confirm('Sign out of your Mefin Cloud vault?')) {
      logout()
      setToken(null)
      setCurrentUser(null)
      setHydrated(false)
      setNotice('Signed out successfully.')
    }
  }

  const handleManualSync = async () => {
    setNotice('Syncing with Cloudflare D1…')
    try {
      const remote = await pullRemoteDB()
      if (remote && Array.isArray(remote.transactions)) {
        if (remote.workspaces && remote.workspaces.length > 0) setWorkspaces(remote.workspaces)
        if (remote.activeWorkspaceId) setActiveWorkspaceId(remote.activeWorkspaceId)
        setTransactions(remote.transactions)
        setAccounts(remote.accounts || [])
        setBudgetItems(remote.budgets || [])
        setGoals(remote.goals || [])
        setRecurring(remote.recurring || [])
        setDismissedNoticeIds(remote.dismissedNoticeIds || [])
        await applySnapshotToDexie(remote)
        setNotice('Synced with Cloudflare D1.')
      } else {
        saveDB({
          workspaces,
          activeWorkspaceId,
          transactions,
          accounts,
          budgets: budgetItems,
          goals,
          recurring,
          dismissedNoticeIds,
          updatedAt: new Date().toISOString()
        })
        setNotice('Cloud vault updated.')
      }
    } catch {
      setNotice('Could not complete sync. Check network connection.')
    }
  }

  const clearPreviewData = () => {
    if (!confirm('Clear all preview records? This will leave Mefin empty so you can start with your own data.')) return
    setTransactions([])
    setAccounts([])
    setBudgetItems([])
    setGoals([])
    setRecurring([])
    setDismissedNoticeIds([])
    setShowDemo(false)
    setNotice('Preview data cleared. Add your own accounts and transactions to begin.')
  }

  const loadDemoData = () => {
    if (!confirm('Replace the active profile records with sample data?')) return
    const demoAccounts: StoredAccount[] = [
      { name: 'HDFC Savings', type: 'Savings account', balance: 64250 },
      { name: 'Cash', type: 'Cash', balance: 8500 },
      { name: 'SBI Current', type: 'Current account', balance: 11500 },
    ]
    const demoRecurring: RecurringItem[] = [
      { id: 201, title: 'Netflix subscription', amount: 649, category: 'Subscriptions', account: 'HDFC Savings', type: 'expense', frequency: 'monthly', nextDate: offsetDate(12), active: true },
      { id: 202, title: 'Apartment rent', amount: 22000, category: 'Home & bills', account: 'HDFC Savings', type: 'expense', frequency: 'monthly', nextDate: offsetDate(5), active: true },
      { id: 203, title: 'Spotify Premium', amount: 119, category: 'Subscriptions', account: 'HDFC Savings', type: 'expense', frequency: 'monthly', nextDate: offsetDate(18), active: true },
      { id: 204, title: 'Monthly salary', amount: 72000, category: 'Salary', account: 'HDFC Savings', type: 'income', frequency: 'monthly', nextDate: offsetDate(24), active: true },
    ]
    setTransactions(demoTransactions)
    setAccounts(demoAccounts)
    setBudgetItems(budgets)
    setGoals([{ name: 'Emergency fund', current: 18000, target: 50000, date: 'Mar 2027' }, { name: 'New laptop', current: 24000, target: 65000, date: 'Jun 2027' }])
    setRecurring(demoRecurring)
    setDismissedNoticeIds([])
    setShowDemo(true)
    setNotice('Sample data loaded into the active profile.')
  }

  const clearAllData = () => {
    if (!confirm('Permanently clear all Mefin records from this browser? Export a backup first if you may need this data.')) return
    setTransactions([]); setAccounts([]); setBudgetItems([]); setGoals([]); setRecurring([]); setDismissedNoticeIds([]); setShowDemo(false)
    setNotice('All records in the active profile cleared. Your other profiles are unchanged.')
  }

  const totals = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const threeMonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const start = range === 'Last month' ? previousMonthStart : range === 'Last 3 months' ? threeMonthsStart : range === 'This year' ? yearStart : monthStart
    const end = range === 'Last month' ? monthStart : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const inPeriod = transactions.filter(t => {
      const date = new Date(`${t.date}T12:00:00`)
      return date >= start && date < end
    })
    const income = inPeriod.filter(t => t.type === 'income').reduce((sum,t) => sum+t.amount, 0)
    const expense = inPeriod.filter(t => t.type === 'expense').reduce((sum,t) => sum+t.amount, 0)
    const balance = accounts.reduce((sum, account) => {
      const accountChange = transactions
        .filter(t => t.account === account.name)
        .reduce((net, t) => net + (t.type === 'income' ? t.amount : -t.amount), 0)
      return sum + account.balance + accountChange
    }, 0)
    return { income, expense, net: income-expense, balance }
  }, [transactions, accounts, range])

  const filtered = transactions.filter(t => {
    const matches = (t.title + ' ' + t.category + ' ' + t.account).toLowerCase().includes(query.toLowerCase())
    return matches && (filter === 'All' || t.type === filter.toLowerCase())
  }).sort((a,b)=>b.date.localeCompare(a.date))

  const go = (p: Page) => { setPage(p); setMobileOpen(false); setMoreSheetOpen(false); setNotice('') }
  const openAdd = (tx?: Tx) => {
    setEditing(tx || null)
    setForm(tx ? { title: tx.title, amount: String(tx.amount), category: tx.category, account: tx.account, date: tx.date, type: tx.type } : { title:'', amount:'', category:'Food & groceries', account: accounts[0]?.name || 'Cash', date:localDateString(), type:'expense' })
    setModal(true)
  }
  const saveTx = () => {
    const amount = Number(form.amount)
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) { setNotice('Enter a description, a valid amount and a date.'); return }
    const tx: Tx = { ...form, title: form.title.trim(), amount, id: editing?.id ?? Date.now() }
    if (editing) setTransactions(old => old.map(t => t.id === editing.id ? tx : t))
    else setTransactions(old => [tx, ...old])
    setModal(false); setNotice(editing ? 'Transaction updated.' : 'Transaction added.')
  }
  const deleteTx = (id: number) => { if (confirm('Delete this transaction?')) { setTransactions(old=>old.filter(t=>t.id!==id)); setNotice('Transaction deleted.') } }

  const switchWorkspace = async (id:string) => {
    if(id===activeWorkspaceId)return
    await db.workspaceSnapshots.put({id:activeWorkspaceId,transactions,accounts,budgets:budgetItems,goals,recurring,dismissedNoticeIds,updatedAt:new Date().toISOString()})
    let snapshot=await db.workspaceSnapshots.get(id)
    if(!snapshot){snapshot={id,transactions:[],accounts:[],budgets:[],goals:[],recurring:[],dismissedNoticeIds:[],updatedAt:new Date().toISOString()};await db.workspaceSnapshots.put(snapshot)}
    setActiveWorkspaceId(id);setTransactions(snapshot.transactions);setAccounts(snapshot.accounts);setBudgetItems(snapshot.budgets);setGoals(snapshot.goals);setRecurring(snapshot.recurring||[]);setDismissedNoticeIds(snapshot.dismissedNoticeIds||[]);setShowDemo(false);setWorkspaceMenu(false);setMoreSheetOpen(false);setPage('Overview');setNotice('Switched to '+(workspaces.find(w=>w.id===id)?.name||'workspace')+'.')
  }
  const createWorkspace = (name:string,kind:'personal'|'workspace') => {
    if(!name.trim()||workspaces.some(w=>w.name.trim().toLowerCase()===name.trim().toLowerCase())){setNotice('Choose a unique, non-empty profile or workspace name.');return}
    const item:Workspace={id:`${kind}-${Date.now()}`,name,kind,createdAt:new Date().toISOString()};void (async()=>{await db.workspaceSnapshots.put({id:item.id,transactions:[],accounts:[],budgets:[],goals:[],recurring:[],dismissedNoticeIds:[],updatedAt:new Date().toISOString()});setWorkspaces(old=>[...old,item]);await switchWorkspace(item.id)})()
  }
  const renameWorkspace = (id:string,name:string) => {const clean=name.trim();if(!clean||workspaces.some(w=>w.id!==id&&w.name.trim().toLowerCase()===clean.toLowerCase())){setNotice('Choose a unique, non-empty name.');return}setWorkspaces(old=>old.map(w=>w.id===id?{...w,name:clean}:w))}
  const recordRecurring = (item:RecurringItem) => {setTransactions(old=>[{id:Date.now(),title:item.title,category:item.category,account:item.account,date:item.nextDate,amount:item.amount,type:item.type},...old]);setNotice(`${item.title} recorded as a transaction.`)}
  const clearActiveWorkspace = () => {if(!confirm('Clear all financial records in this profile?'))return;setTransactions([]);setAccounts([]);setBudgetItems([]);setGoals([]);setRecurring([]);setDismissedNoticeIds([]);setShowDemo(false);setNotice('Active profile records cleared.')}
  const eraseAllLocalData = async () => {if(!confirm('Erase ALL Mefin profiles, workspaces and financial records from this browser? Export backups first. This cannot be undone.'))return;await db.transaction('rw',[db.transactions,db.accounts,db.budgets,db.goals,db.recurring,db.workspaceSnapshots,db.workspaces,db.meta],async()=>{await Promise.all([db.transactions.clear(),db.accounts.clear(),db.budgets.clear(),db.goals.clear(),db.recurring.clear(),db.workspaceSnapshots.clear(),db.workspaces.clear(),db.meta.clear()])});const personal:Workspace={id:'personal',name:'Personal',kind:'personal',createdAt:new Date().toISOString()};await db.workspaces.put(personal);await db.meta.put({key:'activeWorkspaceId',value:'personal'});await db.meta.put({key:'initialized',value:true});setWorkspaces([personal]);setActiveWorkspaceId('personal');setTransactions([]);setAccounts([]);setBudgetItems([]);setGoals([]);setRecurring([]);setDismissedNoticeIds([]);setShowDemo(false);setPage('Overview');setNotice('All Mefin data and local profiles were erased.')}
  const deleteActiveWorkspace = async () => {const current=workspaces.find(w=>w.id===activeWorkspaceId);if(!current||current.id==='personal'){setNotice('The primary Personal profile cannot be deleted.');return}if(!confirm(`Delete ${current.name} and all its local records?`))return;const personal=workspaces.find(w=>w.kind==='personal');if(!personal)return;await db.workspaceSnapshots.delete(activeWorkspaceId);setWorkspaces(old=>old.filter(w=>w.id!==activeWorkspaceId));const snapshot=await db.workspaceSnapshots.get(personal.id);setActiveWorkspaceId(personal.id);setTransactions(snapshot?.transactions||[]);setAccounts(snapshot?.accounts||[]);setBudgetItems(snapshot?.budgets||[]);setGoals(snapshot?.goals||[]);setRecurring(snapshot?.recurring||[]);setDismissedNoticeIds(snapshot?.dismissedNoticeIds||[]);setPage('Overview');setNotice('Workspace deleted. Returned to Personal.') }
  const notices:NoticeItem[] = useMemo(()=>{
    const todayDate=new Date(localDateString()+'T12:00:00');const result:NoticeItem[]=[]
    budgetItems.forEach(b=>{const spent=transactions.filter(t=>t.type==='expense'&&t.category===b.name&&t.date.startsWith(localDateString().slice(0,7))).reduce((s,t)=>s+t.amount,0);if(b.limit>0&&spent/b.limit>=.8)result.push({id:`budget-${b.name}`,title:`${b.name} budget is ${Math.round(spent/b.limit*100)}% used`,detail:`${money(spent)} spent of ${money(b.limit)}`,date:'This month',kind:'budget'})})
    recurring.filter(r=>r.active).forEach(r=>{const due=new Date(r.nextDate+'T12:00:00');const diff=Math.ceil((due.getTime()-todayDate.getTime())/86400000);if(diff<=7)result.push({id:`recurring-${r.id}`,title:`${r.title} ${diff<0?`is overdue by ${Math.abs(diff)} day${Math.abs(diff)===1?'':'s'}`:diff===0?'is due today':`is due in ${diff} day${diff===1?'':'s'}`}`,detail:`${money(r.amount)} · ${r.frequency}`,date:r.nextDate,kind:'recurring'})})
    goals.filter(g=>g.target>0&&g.current>=g.target).forEach(g=>result.push({id:`goal-${g.name}`,title:`${g.name} goal completed`,detail:`Target reached at ${money(g.current)}`,date:'Milestone',kind:'goal'}))
    return result.filter(n=>!dismissedNoticeIds.includes(n.id))
  },[budgetItems,transactions,recurring,goals,dismissedNoticeIds])

  const exportCSV = () => {
    const rows = [['Date','Description','Type','Category','Account','Amount'], ...transactions.map(t=>[t.date,t.title,t.type,t.category,t.account,String(t.amount)])]
    const csv = rows.map(r=>r.map(v=>{const raw=String(v);const safe=/^[\s]*[=+@\-]/.test(raw)?`'${raw}`:raw;return '"'+safe.replace(/"/g,'""')+'"'}).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); const a=document.createElement('a'); a.href=url; a.download='mefin-transactions.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const exportJSON = () => {
    const payload = { version: 3, exportedAt: new Date().toISOString(), workspace: activeWorkspaceId, transactions, accounts, budgets: budgetItems, goals, recurring, dismissedNoticeIds }
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='mefin-backup.json'; a.click(); URL.revokeObjectURL(url)
  }
  const importJSON = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (![1,2,3].includes(data.version) || (data.version>=2 && !Array.isArray(data.recurring)) || !Array.isArray(data.transactions) || !Array.isArray(data.accounts) || !Array.isArray(data.budgets) || !Array.isArray(data.goals)) throw new Error('Invalid backup')
        const validTransactions = data.transactions.every((t: Tx) => Number.isSafeInteger(t.id) && typeof t.title === 'string' && !!t.title.trim() && typeof t.category === 'string' && typeof t.account === 'string' && Number.isFinite(t.amount) && t.amount > 0 && (t.type === 'income' || t.type === 'expense') && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
        const validAccounts = data.accounts.every((a: StoredAccount) => typeof a.name === 'string' && !!a.name.trim() && typeof a.type === 'string' && Number.isFinite(a.balance) && a.balance >= 0)
        const validBudgets = data.budgets.every((b: StoredBudget) => typeof b.name === 'string' && !!b.name.trim() && Number.isFinite(b.limit) && b.limit > 0)
        const validGoals = data.goals.every((g: StoredGoal) => typeof g.name === 'string' && !!g.name.trim() && Number.isFinite(g.target) && g.target > 0 && Number.isFinite(g.current) && g.current >= 0)
        const validRecurring = !Array.isArray(data.recurring) || data.recurring.every((r:RecurringItem)=>Number.isSafeInteger(r.id)&&typeof r.title==='string'&&!!r.title.trim()&&Number.isFinite(r.amount)&&r.amount>0&&(r.type==='income'||r.type==='expense')&&['weekly','monthly','yearly'].includes(r.frequency)&&/^\d{4}-\d{2}-\d{2}$/.test(r.nextDate)&&typeof r.category==='string'&&typeof r.account==='string'&&typeof r.active==='boolean')
        const validDismissed = data.dismissedNoticeIds===undefined || (Array.isArray(data.dismissedNoticeIds)&&data.dismissedNoticeIds.every((id:unknown)=>typeof id==='string'))
        if (!validTransactions || !validAccounts || !validBudgets || !validGoals || !validRecurring || !validDismissed) throw new Error('Invalid backup records')
        if (!confirm('Restore this backup? It will replace the records currently stored in this browser.')) return
        setTransactions(data.transactions); setAccounts(data.accounts); setBudgetItems(data.budgets); setGoals(data.goals); setRecurring(Array.isArray(data.recurring)?data.recurring:[]); setDismissedNoticeIds(Array.isArray(data.dismissedNoticeIds)?data.dismissedNoticeIds:[]); setShowDemo(false)
        void db.meta.put({ key: 'initialized', value: true })
        setNotice('Backup restored to this browser.')
      } catch { setNotice('That backup file is not valid for Mefin.') }
    }
    reader.readAsText(file)
  }

  // Gate the entire app behind the Apple-styled authentication screen when token is absent
  if (!token) {
    return (
      <AuthScreen
        onAuthenticated={(user) => {
          setCurrentUser(user)
          setToken(getAuthToken())
          setHydrated(false)
          setNotice(`Welcome, ${user.email}!`)
        }}
      />
    )
  }

  return (
    <div className="app-root">
      <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
      <div className="landscape landscape-a"/><div className="landscape landscape-b"/>

      {/* Desktop Sidebar (strictly hidden on <=768px) */}
      <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
        <div className="sidebar-top">
          <Brand/>
          <button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation">
            <X size={18}/>
          </button>
        </div>

        <button className="workspace-select" onClick={()=>setWorkspaceMenu(v=>!v)}>
          <span className="workspace-avatar">{(workspaces.find(w=>w.id===activeWorkspaceId)?.name||'P').slice(0,1).toUpperCase()}</span>
          <span className="workspace-text">
            <b>{workspaces.find(w=>w.id===activeWorkspaceId)?.name||'Personal'}</b>
            <small>{workspaces.find(w=>w.id===activeWorkspaceId)?.kind==='workspace'?'Workspace':'Personal profile'}</small>
          </span>
          <ChevronDown size={15}/>
        </button>

        {workspaceMenu && (
          <div className="workspace-menu">
            {workspaces.map(w=>(
              <button key={w.id} className={w.id===activeWorkspaceId?'selected':''} onClick={()=>void switchWorkspace(w.id)}>
                <span>{w.name}</span>
                <small>{w.kind==='personal'?'Personal':'Workspace'}</small>
              </button>
            ))}
            <button className="workspace-manage" onClick={()=>{setWorkspaceMenu(false);go('Profile & Workspace')}}>
              Manage profiles and workspaces
            </button>
          </div>
        )}

        <div className="nav-caption">WORKSPACE</div>
        <nav className="nav-list">
          {nav.map(({label,icon:Icon})=>(
            <button key={label} className={`nav-link ${page===label?'active':''}`} onClick={()=>go(label)}>
              <Icon size={17}/>
              <span>{label}</span>
              {label==='Transactions'&&<small>{transactions.length}</small>}
            </button>
          ))}
        </nav>

        <div className="nav-caption preferences-caption">MANAGE</div>
        <nav className="nav-list">
          {[
            {label:'Notifications' as Page,icon:Bell},
            {label:'Profile & Workspace' as Page,icon:Landmark}
          ].map(({label,icon:Icon})=>(
            <button key={label} className={`nav-link ${page===label?'active':''}`} onClick={()=>go(label)}>
              <Icon size={17}/>
              <span>{label}</span>
              {label==='Notifications'&&notices.length>0&&<small>{notices.length}</small>}
            </button>
          ))}
        </nav>

        <div className="nav-caption preferences-caption">PREFERENCES & SUPPORT</div>
        <nav className="nav-list">
          {[
            {label:'Privacy & Control' as Page,icon:ShieldCheck},
            {label:'Help Center' as Page,icon:CircleHelp},
            {label:'Settings' as Page,icon:Settings}
          ].map(({label,icon:Icon})=>(
            <button key={label} className={`nav-link ${page===label?'active':''}`} onClick={()=>go(label)}>
              <Icon size={17}/>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-fill"/>
        <div className="privacy-card">
          <div className="privacy-icon"><LockKeyhole size={16}/></div>
          <b>Your money. Your vault.</b>
          <p>Authenticated with Web Crypto PBKDF2 and synced to Cloudflare D1.</p>
          <span><i/> Cloud-synced vault</span>
        </div>

        <div className="user-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, textAlign: 'left', minWidth: 0 }} onClick={()=>go('Profile & Workspace')}>
            <div className="user-avatar">{(workspaces.find(w=>w.id===activeWorkspaceId)?.name||currentUser?.email||'P').slice(0,1).toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <b>{workspaces.find(w=>w.id===activeWorkspaceId)?.name||'Personal'}</b>
              <small style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentUser?.email || 'Cloud vault'}</small>
            </div>
          </button>
          <button className="logout-icon-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <LogOut size={16}/>
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}

      {/* Main scroll container */}
      <main className="main">
        {/* Desktop Topbar (strictly hidden on <=768px) */}
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open navigation">
              <Menu size={19}/>
            </button>
            <div className="crumb">
              <span>Workspace</span>
              <ChevronRight size={13}/>
              <b>{page}</b>
            </div>
          </div>

          <div className="top-actions">
            <SyncIndicator syncInfo={syncInfo} onManualSync={handleManualSync} />
            <label className="search">
              <Search size={15}/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search transactions..."/>
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-btn" aria-label="Notifications" onClick={()=>go('Notifications')}>
              <Bell size={17}/>
              {notices.length>0&&<i/>}
            </button>
            <div className="top-user-group">
              <button className="top-user" onClick={()=>go('Profile & Workspace')} aria-label="Open profile" title={currentUser?.email}>
                {(workspaces.find(w=>w.id===activeWorkspaceId)?.name||currentUser?.email||'P').slice(0,1).toUpperCase()}
              </button>
              <button className="logout-icon-btn" onClick={handleLogout} title={`Sign out (${currentUser?.email || 'Mefin'})`} aria-label="Sign out">
                <LogOut size={16}/>
              </button>
            </div>
          </div>
        </header>

        <div className="content">
          {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
          {page==='Overview'&&<Overview totals={totals} transactions={transactions} budgets={budgetItems} goals={goals} range={range} setRange={setRange} openAdd={()=>openAdd()} go={go} demo={showDemo} setDemo={setShowDemo} clearPreviewData={clearPreviewData} loadDemoData={loadDemoData}/>}
          {page==='Transactions'&&<TransactionsPage transactions={filtered} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} openAdd={()=>openAdd()} edit={openAdd} remove={deleteTx} exportCSV={exportCSV}/>}
          {page==='Accounts'&&<AccountsPage accounts={accounts.map(account=>({...account,balance:account.balance+transactions.filter(t=>t.account===account.name).reduce((net,t)=>net+(t.type==='income'?t.amount:-t.amount),0)}))} setAccounts={setAccounts}/>}
          {page==='Budgets'&&<BudgetsPage items={budgetItems} setItems={setBudgetItems} transactions={transactions}/>}
          {page==='Savings Goals'&&<GoalsPage goals={goals} setGoals={setGoals}/>}
          {page==='Settings'&&<SettingsPage exportJSON={exportJSON} importJSON={importJSON} exportCSV={exportCSV} clearAllData={clearAllData} currentUser={currentUser} syncInfo={syncInfo} onManualSync={handleManualSync} onLogout={handleLogout}/>}
          {page==='Net Worth'&&<NetWorthPage accounts={accounts.map(account=>({...account,balance:account.balance+transactions.filter(t=>t.account===account.name).reduce((net,t)=>net+(t.type==='income'?t.amount:-t.amount),0)}))}/>}
          {page==='Recurring'&&<RecurringPage items={recurring} setItems={setRecurring} accounts={accounts.map(a=>a.name)} onRecord={recordRecurring}/>}
          {page==='Calendar'&&<CalendarPage transactions={transactions} recurring={recurring}/>}
          {page==='Insights'&&<InsightsPage transactions={transactions} budgets={budgetItems} goals={goals}/>}
          {page==='Notifications'&&<NotificationsPage items={notices} dismiss={id=>setDismissedNoticeIds(old=>[...old,id])}/>}
          {page==='Reports'&&<ReportsPage transactions={transactions} accounts={accounts.map(account=>({...account,balance:account.balance+transactions.filter(t=>t.account===account.name).reduce((net,t)=>net+(t.type==='income'?t.amount:-t.amount),0)}))} budgets={budgetItems} goals={goals} exportCSV={exportCSV}/>}
          {page==='Privacy & Control'&&<PrivacyPage exportJSON={exportJSON} importJSON={importJSON} clearAll={clearActiveWorkspace} deleteWorkspace={deleteActiveWorkspace} eraseAll={eraseAllLocalData}/>}
          {page==='Help Center'&&<HelpPage/>}
          {page==='Profile & Workspace'&&<ProfileWorkspacePage workspaces={workspaces} activeId={activeWorkspaceId} onSwitch={switchWorkspace} onCreate={createWorkspace} onRename={renameWorkspace}/>}
          <footer className="footer"><div><Brand small/><span>Money, made more meaningful.</span></div><span>Designed for clarity <i>·</i> Cloud-synced with D1</span></footer>
        </div>
      </main>

      {/* Fixed Glassmorphic Bottom Tab Bar on mobile (<=768px) */}
      <nav className="mobile-tab-bar" aria-label="Bottom Navigation">
        {[
          { label: 'Overview' as Page, icon: LayoutDashboard },
          { label: 'Transactions' as Page, icon: ArrowLeftRight, badge: transactions.length },
          { label: 'Accounts' as Page, icon: Wallet },
          { label: 'Budgets' as Page, icon: ChartPie },
          { label: 'More' as const, icon: Ellipsis, badge: notices.length > 0 ? notices.length : undefined }
        ].map(({ label, icon: Icon, badge }) => {
          const isMoreActive = label === 'More' && !['Overview','Transactions','Accounts','Budgets'].includes(page)
          const isActive = page === label || isMoreActive
          return (
            <button
              key={label}
              className={`mobile-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => label === 'More' ? setMoreSheetOpen(v => !v) : go(label)}
              aria-label={label}
            >
              <span className="mobile-tab-icon-wrap">
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                {badge !== undefined && badge > 0 && <span className="mobile-tab-badge">{badge}</span>}
              </span>
              <span className="mobile-tab-label">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Mobile Slide-Up Bottom Sheet for More Navigation */}
      {moreSheetOpen && (
        <div className="sheet-scrim" onMouseDown={e => { if (e.target === e.currentTarget) setMoreSheetOpen(false) }}>
          <div className="bottom-sheet glass-card" role="dialog" aria-modal="true" aria-label="More navigation">
            <div className="sheet-drag-pill" />
            <div className="sheet-header">
              <div>
                <span className="eyebrow">NAVIGATION</span>
                <h2 className="sheet-title">More features</h2>
              </div>
              <button className="icon-btn" onClick={() => setMoreSheetOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="sheet-body">
              <div className="mobile-workspace-card">
                <div className="workspace-avatar">{(workspaces.find(w=>w.id===activeWorkspaceId)?.name||'P').slice(0,1).toUpperCase()}</div>
                <div className="mobile-workspace-info">
                  <b>{workspaces.find(w=>w.id===activeWorkspaceId)?.name||'Personal'}</b>
                  <small>{currentUser?.email || (workspaces.find(w=>w.id===activeWorkspaceId)?.kind==='workspace'?'Workspace':'Personal profile')}</small>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="button button-light button-small" onClick={() => { setMoreSheetOpen(false); go('Profile & Workspace') }}>
                    Switch
                  </button>
                  <button className="button button-light button-small" onClick={handleLogout} title="Sign out">
                    <LogOut size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 4px 14px' }}>
                <SyncIndicator syncInfo={syncInfo} onManualSync={handleManualSync} />
                <button className="button button-light button-small" onClick={handleLogout}>
                  <LogOut size={13} /> Sign out
                </button>
              </div>

              <div className="sheet-section-title">FINANCIAL PLANNING</div>
              <div className="sheet-nav-grid">
                {[
                  { label: 'Savings Goals' as Page, icon: Target },
                  { label: 'Net Worth' as Page, icon: Landmark },
                  { label: 'Recurring' as Page, icon: CalendarDays },
                  { label: 'Calendar' as Page, icon: CalendarDays },
                  { label: 'Insights' as Page, icon: Sparkles },
                  { label: 'Reports' as Page, icon: FileSpreadsheet },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className={`sheet-nav-item ${page === label ? 'active' : ''}`}
                    onClick={() => go(label)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="sheet-section-title">PREFERENCES & CONTROLS</div>
              <div className="sheet-nav-list">
                {[
                  { label: 'Notifications' as Page, icon: Bell, badge: notices.length },
                  { label: 'Profile & Workspace' as Page, icon: Landmark },
                  { label: 'Privacy & Control' as Page, icon: ShieldCheck },
                  { label: 'Help Center' as Page, icon: CircleHelp },
                  { label: 'Settings' as Page, icon: Settings },
                ].map(({ label, icon: Icon, badge }) => (
                  <button
                    key={label}
                    className={`sheet-list-item ${page === label ? 'active' : ''}`}
                    onClick={() => go(label)}
                  >
                    <div className="sheet-list-item-left">
                      <Icon size={17} />
                      <span>{label}</span>
                    </div>
                    <div className="sheet-list-item-right">
                      {badge !== undefined && badge > 0 && <span className="sheet-chip">{badge}</span>}
                      <ChevronRight size={15} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal (slide-up bottom sheet on <=768px) */}
      {modal && <TransactionModal form={form} setForm={setForm} close={()=>setModal(false)} save={saveTx} editing={!!editing} accounts={accounts.map(a=>a.name)}/>}
    </div>
  )
}

function PageHeading({eyebrow,title,subtitle,action}:{eyebrow:string;title:React.ReactNode;subtitle:string;action?:React.ReactNode}) {
  return <div className="page-heading"><div><div className="eyebrow"><i/>{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action&&<div className="heading-action">{action}</div>}</div>
}
function Metric({label,value,kind,icon:Icon}:{label:string;value:string;kind:'balance'|'income'|'expense'|'savings';icon:typeof Wallet}) {
  return <article className={`metric metric-${kind}`}><div className="metric-head"><span>{label}</span><i><Icon size={17}/></i></div><strong>{value}</strong><div className="metric-bottom"><span className="change">Calculated</span><span>from recorded entries</span></div></article>
}
function Overview({totals,transactions,budgets,goals,range,setRange,openAdd,go,demo,setDemo,clearPreviewData,loadDemoData}:{totals:{income:number;expense:number;net:number;balance:number};transactions:Tx[];budgets:StoredBudget[];goals:{name:string;current:number;target:number;date:string}[];range:string;setRange:(v:string)=>void;openAdd:()=>void;go:(p:Page)=>void;demo:boolean;setDemo:(v:boolean)=>void;clearPreviewData:()=>void;loadDemoData:()=>void}) {
  const data = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
    const monthTransactions = transactions.filter(t => t.date.startsWith(key))
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      income: monthTransactions.filter(t => t.type === 'income').reduce((sum,t)=>sum+t.amount,0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum,t)=>sum+t.amount,0),
    }
  })
  const palette = ['#636B2F','#BAC095','#D4DE95','#3D4127','#8B9255','#A4AC78']
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1)
  const threeMonthsStart = new Date(now.getFullYear(), now.getMonth()-2, 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const selectedStart = range === 'Last month' ? previousMonthStart : range === 'Last 3 months' ? threeMonthsStart : range === 'This year' ? yearStart : monthStart
  const selectedEnd = range === 'Last month' ? monthStart : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const selectedTransactions = transactions.filter(t => {
    const date = new Date(`${t.date}T12:00:00`)
    return date >= selectedStart && date < selectedEnd
  })
  const categoryTotals = selectedTransactions.filter(t=>t.type==='expense').reduce<Record<string,number>>((acc,t)=>{acc[t.category]=(acc[t.category]||0)+t.amount;return acc},{})
  const categorySum = Object.values(categoryTotals).reduce((sum,value)=>sum+value,0)
  const spendData = Object.entries(categoryTotals).map(([name,amount],index)=>({name,amount,value:categorySum ? Math.round(amount/categorySum*100) : 0,color:palette[index%palette.length]})).sort((a,b)=>b.amount-a.amount).slice(0,5)
  const currentMonth = localDateString().slice(0,7)
  const dashboardBudgets = budgets.map((item,index) => ({...item, color:['#636B2F','#BAC095','#D4DE95'][index%3], spent: transactions.filter(t=>t.type==='expense' && t.category===item.name && t.date.startsWith(currentMonth)).reduce((sum,t)=>sum+t.amount,0)}))
  const recent = [...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4)
  return <>
    <PageHeading eyebrow="YOUR MONEY, IN PERSPECTIVE" title={<>A clearer view of <em>your money.</em></>} subtitle="Understand what you have, what you spend, and what comes next." action={<><button className="button button-light" onClick={()=>go('Settings')}><Download size={15}/> Backup</button><button className="button button-dark" onClick={openAdd}><Plus size={16}/> Add transaction</button></>}/>
    {demo&&<div className="demo-banner"><Sparkles size={14}/><span>Preview records are illustrative, not your financial data.</span><button className="demo-clear" onClick={loadDemoData}>Load sample data</button><button className="demo-clear" onClick={clearPreviewData}>Clear preview data</button><button onClick={()=>setDemo(false)} aria-label="Dismiss demo notice"><X size={14}/></button></div>}
    <section className="hero glass-surface"><div className="hero-copy"><span className="hero-tag"><Sparkles size={12}/> YOUR FINANCIAL SNAPSHOT</span><h2>Make room for<br/><em>what matters.</em></h2><p>Small, intentional money habits add up. Keep your finances in view and your next move in focus.</p><button className="hero-cta" onClick={()=>go('Budgets')}>Explore your budget <ArrowUpRight size={14}/></button></div><div className="hero-landscape"><div className="hero-sun"/><div className="hero-hill hill-1"/><div className="hero-hill hill-2"/><div className="hero-hill hill-3"/><div className="mini-glass"><span>NET CASH FLOW</span><b>{signedMoney(totals.net)}</b><small>For the selected period</small><div className="mini-bars">{[28,38,33,48,42,65,53,76,68,92,80,100].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div></div></section>
    <div className="section-title"><div><h2>Your overview</h2><p>A quick look at your financial picture.</p></div><label className="period"><CalendarDays size={14}/><select value={range} onChange={e=>setRange(e.target.value)}><option>This month</option><option>Last month</option><option>Last 3 months</option><option>This year</option></select><ChevronDown size={13}/></label></div>
    <section className="metric-grid"><Metric label="Total balance" value={money(totals.balance)} kind="balance" icon={Wallet}/><Metric label="Income" value={money(totals.income)} kind="income" icon={ArrowDownLeft}/><Metric label="Expenses" value={money(totals.expense)} kind="expense" icon={ArrowUpRight}/><Metric label="Net cash flow" value={signedMoney(totals.net)} kind="savings" icon={Target}/></section>
    <section className="analytics-grid">
      <GlassCard className="chart-card">
        <div className="panel-head"><div><h3>Cash flow</h3><p>Income and expenses over time</p></div><button className="select-quiet">Last 6 months <ChevronDown size={13}/></button></div>
        <div className="chart-legend"><span><i className="legend-income"/>Income</span><span><i className="legend-expense"/>Expenses</span></div>
        <div className="chart-scroll-wrap">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{top:8,right:8,left:-18,bottom:0}}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#636B2F" stopOpacity={.23}/><stop offset="100%" stopColor="#636B2F" stopOpacity={0}/></linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#BAC095" stopOpacity={.2}/><stop offset="100%" stopColor="#BAC095" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(99,107,47,.14)" strokeDasharray="3 5" vertical={false}/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#777b60',fontSize:11}} dy={9}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#777b60',fontSize:10}} tickFormatter={v=>`₹${v/1000}k`}/>
                <Tooltip formatter={(v)=>money(Number(v))} contentStyle={{border:'1px solid rgba(99,107,47,.18)',borderRadius:12,fontSize:12,boxShadow:'0 10px 30px rgba(61,65,39,.12)'}}/>
                <Area type="monotone" dataKey="income" stroke="#636B2F" strokeWidth={2.4} fill="url(#incomeFill)"/>
                <Area type="monotone" dataKey="expense" stroke="#BAC095" strokeWidth={2.2} fill="url(#expenseFill)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>
      <GlassCard className="spending-card">
        <div className="panel-head"><div><h3>Spending breakdown</h3><p>Where your money goes</p></div><button className="icon-quiet" aria-label="Spending options"><Ellipsis size={19}/></button></div>
        <div className="spending-total"><b>{money(totals.expense)}</b><span>in selected period</span></div>
        <div className="donut-wrap"><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendData} dataKey="value" innerRadius="70%" outerRadius="94%" paddingAngle={3} stroke="none">{spendData.map((s,i)=><Cell key={i} fill={s.color}/>)}</Pie><Tooltip formatter={(v)=>`${v}%`}/></PieChart></ResponsiveContainer></div><div className="donut-center"><b>{spendData.length}</b><span>categories</span></div><div className="spend-legend">{spendData.length===0?<span className="no-spend">No expense entries yet</span>:spendData.map(s=><div key={s.name}><i style={{background:s.color}}/><span>{s.name}</span><b>{s.value}%</b></div>)}</div></div>
        <button className="inline-link" onClick={()=>go('Transactions')}>Explore transactions <ArrowUpRight size={14}/></button>
      </GlassCard>
    </section>
    <section className="bottom-grid">
      <GlassCard className="recent-card"><div className="panel-head"><div><h3>Recent transactions</h3><p>Your latest money movements</p></div><button className="inline-link" onClick={()=>go('Transactions')}>View all <ArrowUpRight size={14}/></button></div>{recent.length===0?<EmptyState icon={ReceiptText} title="No transactions yet" text="Add your first entry to see activity here." action={<button className="button button-dark" onClick={openAdd}><Plus size={14}/> Add transaction</button>}/>:<div className="recent-list">{recent.map(t=><TransactionRow key={t.id} tx={t}/>)}</div>}</GlassCard>
      <GlassCard className="budget-preview"><div className="panel-head"><div><h3>Budget overview</h3><p>Stay close to your monthly plan</p></div><button className="icon-quiet" onClick={()=>go('Budgets')} aria-label="Open budgets"><ArrowUpRight size={17}/></button></div><div className="budget-top"><div><span>Total allocated</span><b>{money(dashboardBudgets.reduce((s,b)=>s+b.limit,0))}</b></div><div className="budget-ring"><span>{dashboardBudgets.length ? `${Math.round(dashboardBudgets.reduce((sum,b)=>sum+b.spent,0)/Math.max(1,dashboardBudgets.reduce((sum,b)=>sum+b.limit,0))*100)}%` : '—'}</span></div></div>{dashboardBudgets.slice(0,3).map(b=><div className="budget-line" key={b.name}><div><span>{b.name}</span><b>{money(b.spent)} <small>/ {money(b.limit)}</small></b></div><div className="progress"><i style={{width:`${Math.min(100,b.spent/b.limit*100)}%`,background:b.color}}/></div></div>)}<button className="inline-link" onClick={()=>go('Budgets')}>Manage budgets <ArrowUpRight size={14}/></button></GlassCard>
    </section>
    <section className="goal-strip"><div><span className="goal-kicker">A LITTLE PROGRESS, EVERY DAY</span><h3>Savings goals</h3><p>Keep your future plans within reach.</p></div><div className="goal-mini-list">{goals.slice(0,2).map(g=><div className="goal-mini" key={g.name}><span>{g.name}</span><b>{Math.round(g.current/g.target*100)}%</b><div className="progress"><i style={{width:`${Math.min(100,g.current/g.target*100)}%`}}/></div></div>)}</div><button className="inline-link" onClick={()=>go('Savings Goals')}>View goals <ArrowUpRight size={14}/></button></section>
  </>
}
function TransactionRow({tx}:{tx:Tx}) {
  const Icon=tx.type==='income'?ArrowDownLeft:ArrowUpRight
  return <div className="transaction-row">
    <div className={`transaction-icon ${tx.type}`}><Icon size={17}/></div>
    <div className="transaction-main">
      <b>{tx.title}</b>
      <span>{tx.category} · {dateLabel(tx.date)}</span>
      <small className="mobile-only-account">{tx.account}</small>
    </div>
    <time className="desktop-time">{dateLabel(tx.date)}</time>
    <div className="transaction-right">
      <strong className={tx.type}>{tx.type==='income'?'+':'−'}{money(tx.amount)}</strong>
      <span className={`mobile-badge-tiny ${tx.type}`}>{tx.type==='income'?'Income':'Expense'}</span>
    </div>
  </div>
}
function TransactionsPage({transactions,query,setQuery,filter,setFilter,openAdd,edit,remove,exportCSV}:{transactions:Tx[];query:string;setQuery:(v:string)=>void;filter:string;setFilter:(v:string)=>void;openAdd:()=>void;edit:(tx:Tx)=>void;remove:(id:number)=>void;exportCSV:()=>void}) {
  return <>
    <PageHeading
      eyebrow="YOUR ACTIVITY"
      title={<>Every move, <em>accounted for.</em></>}
      subtitle="A complete record of your income and expenses."
      action={<>
        <button className="button button-light" onClick={exportCSV}><Download size={15}/> Export CSV</button>
        <button className="button button-dark" onClick={openAdd}><Plus size={16}/> Add transaction</button>
      </>}
    />
    <GlassCard className="table-card">
      <div className="table-toolbar">
        <label className="table-search">
          <Search size={15}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search transactions..."/>
        </label>
        <div className="filter-scroll-wrap">
          <div className="filter-group">
            <SlidersHorizontal size={15}/>
            {['All','Income','Expense'].map(v=><button key={v} className={filter===v?'chosen':''} onClick={()=>setFilter(v)}>{v}</button>)}
          </div>
        </div>
      </div>

      {/* Desktop table (hidden on <=768px via CSS) */}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>TRANSACTION</th>
              <th>DATE</th>
              <th>ACCOUNT</th>
              <th>AMOUNT</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t=>(
              <tr key={t.id}>
                <td>
                  <div className="table-title">
                    <span className={`transaction-icon ${t.type}`}>{t.type==='income'?<ArrowDownLeft size={16}/>:<ArrowUpRight size={16}/>}</span>
                    <span><b>{t.title}</b><small>{t.category}</small></span>
                  </div>
                </td>
                <td>{dateLabel(t.date)}</td>
                <td>{t.account}</td>
                <td><b className={t.type}>{t.type==='income'?'+':'−'}{money(t.amount)}</b></td>
                <td>
                  <div className="row-actions">
                    <button onClick={()=>edit(t)} aria-label="Edit transaction"><Pencil size={15}/></button>
                    <button onClick={()=>remove(t.id)} aria-label="Delete transaction"><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Apple-Style List Cards (<=768px) */}
      <div className="mobile-transaction-cards">
        {transactions.map(t=>(
          <article className="mobile-transaction-card" key={`mobile-${t.id}`}>
            <div className="mobile-card-row">
              <div className="mobile-card-left">
                <div className="mobile-card-title-row">
                  <span className={`transaction-icon-inline ${t.type}`}>
                    {t.type==='income'?<ArrowDownLeft size={14}/>:<ArrowUpRight size={14}/>}
                  </span>
                  <b className="mobile-card-title">{t.title}</b>
                </div>
                <span className="mobile-card-sub">{t.category} · {dateLabel(t.date)}</span>
                <small className="mobile-card-account">{t.account}</small>
              </div>
              <div className="mobile-card-right">
                <strong className={`mobile-card-amount ${t.type}`}>
                  {t.type==='income'?'+':'−'}{money(t.amount)}
                </strong>
                <span className={`mobile-card-badge ${t.type}`}>
                  {t.type==='income'?'Income':'Expense'}
                </span>
              </div>
            </div>
            <div className="mobile-card-actions">
              <button className="button button-light button-small" onClick={()=>edit(t)} aria-label={`Edit ${t.title}`}>
                <Pencil size={14}/> Edit
              </button>
              <button className="button button-light button-small button-danger-text" onClick={()=>remove(t.id)} aria-label={`Delete ${t.title}`}>
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {transactions.length===0&&<EmptyState icon={ReceiptText} title="No matching transactions" text="Try another search or add a new transaction." action={<button className="button button-dark" onClick={openAdd}><Plus size={14}/> Add transaction</button>}/>}
    </GlassCard>
  </>
}
function AccountsPage({accounts,setAccounts}:{accounts:{name:string;type:string;balance:number}[];setAccounts:React.Dispatch<React.SetStateAction<{name:string;type:string;balance:number}[]>>}) {
  const [adding,setAdding]=useState(false),[name,setName]=useState(''),[balance,setBalance]=useState(''),[accountType,setAccountType]=useState('Savings account')
  const add=()=>{if(name.trim()&&balance.trim()!==''&&Number.isFinite(Number(balance))&&Number(balance)>=0&&!accounts.some(a=>a.name.toLowerCase()===name.trim().toLowerCase())){setAccounts(a=>[...a,{name:name.trim(),type:accountType,balance:Number(balance)}]);setName('');setBalance('');setAccountType('Savings account');setAdding(false)}}
  return <><PageHeading eyebrow="YOUR MONEY, ORGANIZED" title={<>Your accounts, <em>one view.</em></>} subtitle="Manually keep track of the places where you hold money." action={<button className="button button-dark" onClick={()=>setAdding(true)}><Plus size={16}/> Add account</button>}/><div className="account-grid">{accounts.map((a,i)=><GlassCard className="account-card" key={a.name}><div className="account-card-head"><div className={`account-icon account-${i%3}`}>{i===0?<Landmark size={20}/>:i===1?<Wallet size={20}/>:<CircleDollarSign size={20}/>}</div><div className="row-actions"><button onClick={()=>{const value=prompt(`Set the manually maintained balance for ${a.name}`,String(a.balance));if(value!==null&&value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0)setAccounts(old=>old.map(x=>x.name===a.name?{...x,balance:Number(value)}:x))}} aria-label={`Edit ${a.name} balance`}><Pencil size={14}/></button><button onClick={()=>{if(confirm(`Remove ${a.name}? Existing transactions will remain unchanged.`))setAccounts(old=>old.filter(x=>x.name!==a.name))}} aria-label="Remove account"><Trash2 size={15}/></button></div></div><span>{a.type}</span><h3>{a.name}</h3><b>{money(a.balance)}</b><small>Manually maintained balance</small></GlassCard>)}</div>{accounts.length===0&&<GlassCard><EmptyState icon={Wallet} title="No accounts yet" text="Add an account to keep your balances organized." action={<button className="button button-dark" onClick={()=>setAdding(true)}><Plus size={14}/> Add account</button>}/></GlassCard>}{adding&&<div className="inline-form glass-card"><h3>New account</h3><input value={name} onChange={e=>setName(e.target.value)} placeholder="Account name"/><select className="field account-type" value={accountType} onChange={e=>setAccountType(e.target.value)}><option>Savings account</option><option>Current account</option><option>Cash</option><option>Credit card</option><option>Loan liability</option><option>Other</option></select><input value={balance} onChange={e=>setBalance(e.target.value)} type="number" min="0" placeholder="Opening balance (₹)"/><button className="button button-dark" onClick={add}>Save account</button><button className="button button-light" onClick={()=>setAdding(false)}>Cancel</button></div>}</>
}
function BudgetsPage({items,setItems,transactions}:{items:StoredBudget[];setItems:React.Dispatch<React.SetStateAction<StoredBudget[]>>;transactions:Tx[]}) {
  const [adding,setAdding]=useState(false),[name,setName]=useState(''),[limit,setLimit]=useState('')
  const [month,setMonth]=useState(()=>localDateString().slice(0,7))
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN',{month:'long',year:'numeric'})
  const actualItems = items.map((item,index) => ({ ...item, color:['#636B2F','#BAC095','#D4DE95'][index%3], spent: transactions.filter(t => t.type === 'expense' && t.category === item.name && t.date.startsWith(month)).reduce((sum,t)=>sum+t.amount,0) }))
  const totalLimit=actualItems.reduce((s,b)=>s+b.limit,0), totalSpent=actualItems.reduce((s,b)=>s+b.spent,0)
  const add=()=>{if(name.trim()&&Number.isFinite(Number(limit))&&Number(limit)>0&&!items.some(x=>x.name.toLowerCase()===name.trim().toLowerCase())){setItems(old=>[...old,{name:name.trim(),spent:0,limit:Number(limit),color:'#636B2F'}]);setName('');setLimit('');setAdding(false)}}
  const shiftMonth=(offset:number)=>{const d=new Date(`${month}-01T12:00:00`);d.setMonth(d.getMonth()+offset);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)}
  return <><PageHeading eyebrow="SPEND WITH INTENTION" title={<>A plan for <em>your spending.</em></>} subtitle="Set category limits and keep an eye on what remains." action={<button className="button button-dark" onClick={()=>setAdding(true)}><Plus size={16}/> Create budget</button>}/>
    <div className="budget-period-scroll"><div className="budget-period glass-card"><button className="icon-quiet" onClick={()=>shiftMonth(-1)} aria-label="Previous month"><ChevronRight className="flip-chevron" size={17}/></button><div><span>TRACKING PERIOD</span><b>{monthLabel}</b></div><button className="icon-quiet" onClick={()=>shiftMonth(1)} aria-label="Next month"><ChevronRight size={17}/></button><button className="button button-light" onClick={()=>setMonth(localDateString().slice(0,7))}>This month</button></div></div>
    <div className="budget-summary-card glass-card"><div><span>Monthly budget</span><h2>{money(totalLimit)}</h2><p>Across {actualItems.length} categories</p></div><div><span>Tracked spending</span><h2>{money(totalSpent)}</h2><p className={totalSpent>totalLimit?'over-budget-text':''}>{totalSpent>totalLimit?`${money(totalSpent-totalLimit)} over budget`:`${money(totalLimit-totalSpent)} remaining`}</p></div></div>
    {actualItems.length===0?<GlassCard><EmptyState icon={ChartPie} title="No budgets set up" text="Create a category budget to start tracking your monthly spending." action={<button className="button button-dark" onClick={()=>setAdding(true)}><Plus size={14}/> Create budget</button>}/></GlassCard>:<div className="budget-list">{actualItems.map((b)=><GlassCard className="budget-item" key={b.name}><div className="budget-item-head"><div><h3>{b.name}</h3><span className={b.spent>b.limit?'over-budget-text':''}>{Math.round(b.spent/b.limit*100)}% used{b.spent>b.limit?' · Over limit':''}</span></div><div className="row-actions"><button onClick={()=>{const value=prompt(`Set monthly limit for ${b.name}`,String(b.limit));if(value!==null&&value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>0)setItems(old=>old.map(x=>x.name===b.name?{...x,limit:Number(value)}:x))}} aria-label={`Edit ${b.name} budget`}><Pencil size={14}/></button><button onClick={()=>{if(confirm(`Delete the ${b.name} budget?`))setItems(old=>old.filter(x=>x.name!==b.name))}} aria-label="Delete budget"><Trash2 size={15}/></button></div></div><div className="budget-numbers"><b>{money(b.spent)} <small>spent</small></b><span>of {money(b.limit)}</span></div><div className="progress large"><i style={{width:`${Math.min(100,b.spent/b.limit*100)}%`,background:b.spent>b.limit?'#3D4127':b.color}}/></div><p>{b.spent>b.limit?`${money(b.spent-b.limit)} over budget`:`${money(b.limit-b.spent)} left in this category`}</p></GlassCard>)}</div>}
    {adding&&<div className="inline-form glass-card"><h3>Create category budget</h3><input value={name} onChange={e=>setName(e.target.value)} placeholder="Category name"/><input value={limit} onChange={e=>setLimit(e.target.value)} type="number" min="1" placeholder="Monthly limit (₹)"/><button className="button button-dark" onClick={add}>Create budget</button><button className="button button-light" onClick={()=>setAdding(false)}>Cancel</button></div>}</>
}
function GoalsPage({goals,setGoals}:{goals:{name:string;current:number;target:number;date:string}[];setGoals:React.Dispatch<React.SetStateAction<{name:string;current:number;target:number;date:string}[]>>}) {
  const [adding,setAdding]=useState(false),[name,setName]=useState(''),[target,setTarget]=useState(''),[deadline,setDeadline]=useState('')
  const [contributing,setContributing]=useState<string|null>(null),[contribution,setContribution]=useState('')
  const add=()=>{if(name.trim()&&Number.isFinite(Number(target))&&Number(target)>0&&!goals.some(g=>g.name.toLowerCase()===name.trim().toLowerCase())){setGoals(old=>[...old,{name:name.trim(),current:0,target:Number(target),date:deadline?new Date(`${deadline}-01T12:00:00`).toLocaleDateString('en-IN',{month:'short',year:'numeric'}):'No deadline'}]);setName('');setTarget('');setDeadline('');setAdding(false)}}
  const addContribution=(goalName:string)=>{const value=Number(contribution);if(Number.isFinite(value)&&value>0){setGoals(old=>old.map(g=>g.name===goalName?{...g,current:g.current+value}:g));setContribution('');setContributing(null)}}
  return <><PageHeading eyebrow="FUTURE, IN FOCUS" title={<>Give your goals <em>some momentum.</em></>} subtitle="Track the milestones you are saving towards." action={<button className="button button-dark" onClick={()=>setAdding(true)}><Plus size={16}/> New savings goal</button>}/>
    {goals.length===0?<GlassCard><EmptyState icon={Target} title="No savings goals yet" text="Create a goal and track your progress as you contribute." action={<button className="button button-dark" onClick={()=>setAdding(true)}><Plus size={14}/> Create a goal</button>}/></GlassCard>:<div className="goal-grid">{goals.map((g,i)=><GlassCard className="goal-card" key={g.name}><div className="goal-card-head"><div className={`goal-symbol goal-${i%3}`}><Target size={20}/></div><button className="icon-quiet" onClick={()=>{if(confirm(`Delete the ${g.name} goal?`))setGoals(old=>old.filter(x=>x.name!==g.name))}} aria-label="Delete goal"><Trash2 size={15}/></button></div><span>SAVINGS GOAL</span><h3>{g.name}</h3><b className="goal-amount">{money(g.current)} <small>of {money(g.target)}</small></b><div className="progress large"><i style={{width:`${Math.min(100,g.current/g.target*100)}%`}}/></div><div className="goal-foot"><span>{Math.round(g.current/g.target*100)}% completed</span><span>{g.date}</span></div>{g.current>=g.target?<div className="goal-complete">Goal reached</div>:contributing===g.name?<div className="contribution-form"><input aria-label="Contribution amount" value={contribution} onChange={e=>setContribution(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Amount in ₹"/><button className="button button-dark" onClick={()=>addContribution(g.name)}>Add</button><button className="button button-light" onClick={()=>{setContributing(null);setContribution('')}}>Cancel</button></div>:<button className="button button-light contribution" onClick={()=>setContributing(g.name)}>Add contribution</button>}</GlassCard>)}</div>}
    {adding&&<div className="inline-form glass-card"><h3>Create savings goal</h3><input value={name} onChange={e=>setName(e.target.value)} placeholder="Goal name"/><input value={target} onChange={e=>setTarget(e.target.value)} type="number" min="1" placeholder="Target amount (₹)"/><input value={deadline} onChange={e=>setDeadline(e.target.value)} type="month" aria-label="Target month (optional)"/><button className="button button-dark" onClick={add}>Create goal</button><button className="button button-light" onClick={()=>setAdding(false)}>Cancel</button></div>}</>
}
function SecurityPasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      setStatus({ text: 'Please fill in both fields.', error: true })
      return
    }
    if (newPassword.length < 6) {
      setStatus({ text: 'New password must be at least 6 characters.', error: true })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const res = await changePassword(currentPassword, newPassword)
      setStatus({ text: res.message || 'Password updated successfully.', error: false })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      setStatus({ text: err?.message || 'Failed to update password.', error: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="settings-card">
      <div className="settings-icon"><KeyRound size={20} /></div>
      <h3>Security & Password</h3>
      <p>Change the master password protecting your synced Cloudflare D1 vault.</p>
      {status && (
        <div className={status.error ? 'auth-error' : 'notice'} style={{ marginTop: '8px', padding: '8px 12px', fontSize: '13px' }}>
          <span>{status.text}</span>
        </div>
      )}
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <input
          type="password"
          placeholder="Current password"
          className="field"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password (min 6 characters)"
          className="field"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" className="button button-dark" style={{ alignSelf: 'flex-start', marginTop: '4px' }} disabled={loading}>
          {loading ? <RefreshCw size={13} className="spin-icon" /> : null}
          Update Password
        </button>
      </form>
    </GlassCard>
  )
}

function SettingsPage({
  exportJSON,
  importJSON,
  exportCSV,
  clearAllData,
  currentUser,
  syncInfo,
  onManualSync,
  onLogout
}:{
  exportJSON:()=>void;
  importJSON:(f?:File)=>void;
  exportCSV:()=>void;
  clearAllData:()=>void;
  currentUser: { id: string; email: string } | null;
  syncInfo: SyncInfo;
  onManualSync: () => void;
  onLogout: () => void;
}) {
  return <>
    <PageHeading eyebrow="YOUR SPACE, YOUR RULES" title={<>A little more <em>your way.</em></>} subtitle="Manage your data and application preferences."/>
    <div className="settings-grid">
      <GlassCard className="settings-card">
        <div className="settings-icon"><Cloud size={20}/></div>
        <h3>Cloudflare D1 Cloud Sync</h3>
        <p>Your financial records are secured with Web Crypto PBKDF2 hashing and synced to your private Cloudflare D1 cloud vault.</p>
        <div className="settings-cloud-row">
          <div>
            <b>{currentUser?.email || 'Authenticated User'}</b>
            <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>
              {syncInfo.lastSyncedAt
                ? `Last synced at ${new Date(syncInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Ready to sync'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="button button-light button-small" onClick={onManualSync}>
              <RefreshCw size={13} className={syncInfo.status === 'syncing' ? 'spin-icon' : ''} /> Sync now
            </button>
            <button className="button button-light button-small" onClick={onLogout}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </GlassCard>

      <SecurityPasswordCard />

      <GlassCard className="settings-card">
        <div className="settings-icon"><ShieldCheck size={20}/></div>
        <h3>Privacy & local storage cache</h3>
        <p>Mefin maintains an instant local cache in your browser so pages load with zero latency, then transparently synchronizes snapshot diffs with Cloudflare D1.</p>
        <span className="local-status"><i/> Local cache + D1 cloud sync</span>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-icon"><CloudDownload size={20}/></div>
        <h3>Backup & restore</h3>
        <p>Download a JSON backup of this profile’s accounts, transactions, budgets, goals, recurring schedules and reminder preferences. Import a previous Mefin JSON backup to restore it.</p>
        <div className="settings-actions">
          <button className="button button-dark" onClick={exportJSON}><Download size={14}/> Export backup</button>
          <label className="button button-light upload-button">
            <Upload size={14}/> Import backup
            <input type="file" accept="application/json" onChange={e=>importJSON(e.target.files?.[0])}/>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-icon"><FileSpreadsheet size={20}/></div>
        <h3>Transaction export</h3>
        <p>Export your transaction list as a CSV file for spreadsheets and personal analysis.</p>
        <button className="button button-light" onClick={exportCSV}><Download size={14}/> Export transactions</button>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-icon"><CircleDollarSign size={20}/></div>
        <h3>Currency</h3>
        <p>Default currency for this MVP.</p>
        <div className="currency-pill">₹ <b>Indian Rupee (INR)</b><Check size={15}/></div>
      </GlassCard>
    </div>

    <GlassCard className="settings-card data-danger">
      <div className="settings-icon"><Trash2 size={20}/></div>
      <h3>Clear local workspace</h3>
      <p>Remove transactions, accounts, budgets, savings goals and recurring schedules from the active profile only. Other profiles remain unchanged.</p>
      <button className="button button-light" onClick={clearAllData}>Clear active profile</button>
    </GlassCard>

    <div className="settings-footnote">
      <ShieldCheck size={15}/> Protected with Web Crypto PBKDF2 & HMAC-SHA256 bearer authentication. Synced to your Cloudflare D1 vault.
    </div>
  </>
}
function TransactionModal({form,setForm,close,save,editing,accounts}:{form:{title:string;amount:string;category:string;account:string;date:string;type:'income'|'expense'};setForm:React.Dispatch<React.SetStateAction<typeof form>>;close:()=>void;save:()=>void;editing:boolean;accounts:string[]}) {
  return <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
    <div className="modal glass-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="sheet-drag-pill" />
      <div className="modal-head">
        <div>
          <span className="eyebrow">QUICK ENTRY</span>
          <h2 id="modal-title">{editing?'Edit transaction':'Add a transaction'}</h2>
          <p>Record a money movement manually.</p>
        </div>
        <button className="icon-btn" onClick={close} aria-label="Close"><X size={18}/></button>
      </div>
      <div className="type-switch">
        <button className={form.type==='expense'?'selected':''} onClick={()=>setForm(f=>({...f,type:'expense'}))}>
          <ArrowUpRight size={15}/> Expense
        </button>
        <button className={form.type==='income'?'selected income-selected':''} onClick={()=>setForm(f=>({...f,type:'income'}))}>
          <ArrowDownLeft size={15}/> Income
        </button>
      </div>
      <label className="field-label">Amount</label>
      <div className="amount-field">
        <span>₹</span>
        <input autoFocus type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00"/>
      </div>
      <label className="field-label">Description</label>
      <input className="field" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Groceries, salary..."/>
      <div className="form-two">
        <div>
          <label className="field-label">Category</label>
          <select className="field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            {['Food & groceries','Home & bills','Transport','Shopping','Health','Entertainment','Subscriptions','Salary','Freelance','Other'].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Account</label>
          <select className="field" value={form.account} onChange={e=>setForm(f=>({...f,account:e.target.value}))}>
            {accounts.length===0&&<option value="Cash">Cash (manual)</option>}
            {accounts.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <label className="field-label">Date</label>
      <input className="field" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
      <div className="modal-privacy"><ShieldCheck size={15}/> Your entries are securely synchronized to your private Cloudflare D1 vault.</div>
      <div className="modal-actions">
        <button className="button button-light" onClick={close}>Cancel</button>
        <button className="button button-dark" onClick={save}>{editing?'Save changes':'Add transaction'} <ChevronRight size={15}/></button>
      </div>
    </div>
  </div>
}
