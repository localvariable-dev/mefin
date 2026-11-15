import Dexie, { type Table } from 'dexie'
import type { Tx } from './types'

export interface StoredAccount { name: string; type: string; balance: number }
export interface StoredBudget { name: string; spent: number; limit: number; color: string }
export interface StoredGoal { name: string; current: number; target: number; date: string }
export interface Workspace { id: string; name: string; kind: 'personal' | 'workspace'; createdAt: string }
export interface WorkspaceSnapshot {
  id: string
  transactions: Tx[]
  accounts: StoredAccount[]
  budgets: StoredBudget[]
  goals: StoredGoal[]
  recurring: RecurringItem[]
  dismissedNoticeIds: string[]
  updatedAt: string
}
export interface RecurringItem {
  id: number
  title: string
  amount: number
  category: string
  account: string
  type: 'income' | 'expense'
  frequency: 'weekly' | 'monthly' | 'yearly'
  nextDate: string
  active: boolean
}
export interface DismissedNotice { id: string; dismissedAt: string }

export interface MefinDB {
  workspaces: Workspace[]
  activeWorkspaceId: string
  transactions: Tx[]
  accounts: StoredAccount[]
  budgets: StoredBudget[]
  goals: StoredGoal[]
  recurring: RecurringItem[]
  dismissedNoticeIds: string[]
  workspaceSnapshots?: WorkspaceSnapshot[]
  updatedAt?: string
}

class MefinDatabase extends Dexie {
  transactions!: Table<Tx, number>
  accounts!: Table<StoredAccount, string>
  budgets!: Table<StoredBudget, string>
  goals!: Table<StoredGoal, string>
  meta!: Table<{ key: string; value: unknown }, string>
  workspaces!: Table<Workspace, string>
  workspaceSnapshots!: Table<WorkspaceSnapshot, string>
  recurring!: Table<RecurringItem, number>
  dismissedNotices!: Table<DismissedNotice, string>

  constructor() {
    super('mefin-local')
    this.version(1).stores({
      transactions: 'id, date, type, category, account',
      accounts: 'name',
      budgets: 'name',
      goals: 'name',
      meta: 'key',
    })
    this.version(2).stores({
      transactions: 'id, date, type, category, account',
      accounts: 'name',
      budgets: 'name',
      goals: 'name',
      meta: 'key',
      workspaces: 'id, kind',
      workspaceSnapshots: 'id, updatedAt',
      recurring: '++id, nextDate, active, type',
      dismissedNotices: 'id, dismissedAt',
    })
  }
}

export const db = new MefinDatabase()

/* Cloud Sync & Authentication */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export interface SyncInfo {
  status: SyncStatus
  lastSyncedAt: number | null
  error?: string
}

const TOKEN_KEY = 'mefin_token'
const USER_KEY = 'mefin_user'
const CACHE_KEY = 'mefin_cache'
const LAST_SYNC_KEY = 'mefin_last_synced'

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null
const syncListeners = new Set<(info: SyncInfo) => void>()

let currentSyncInfo: SyncInfo = {
  status: 'idle',
  lastSyncedAt: (() => {
    try {
      const v = localStorage.getItem(LAST_SYNC_KEY)
      return v ? parseInt(v, 10) : null
    } catch {
      return null
    }
  })(),
}

function updateSyncInfo(partial: Partial<SyncInfo>) {
  currentSyncInfo = { ...currentSyncInfo, ...partial }
  if (partial.lastSyncedAt !== undefined && partial.lastSyncedAt !== null) {
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(partial.lastSyncedAt))
    } catch {}
  }
  syncListeners.forEach(fn => fn(currentSyncInfo))
}

export function subscribeSyncStatus(listener: (info: SyncInfo) => void): () => void {
  syncListeners.add(listener)
  listener(currentSyncInfo)
  return () => {
    syncListeners.delete(listener)
  }
}

export function getSyncStatus(): SyncInfo {
  return currentSyncInfo
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getAuthUser(): { id: string; email: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {}
  updateSyncInfo({ status: 'idle', error: undefined })
}

export async function loginOrRegister(
  mode: 'login' | 'register',
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string } }> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, email, password }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed. Please check your credentials.')
  }

  if (data.token) {
    try {
      localStorage.setItem(TOKEN_KEY, data.token)
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      }
    } catch (e) {
      console.warn('Could not save auth token to localStorage', e)
    }
  }

  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken()
  const user = getAuthUser()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mode: 'change-password',
      email: user?.email,
      currentPassword,
      newPassword,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to change password.')
  }
  return data
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'request-reset', email }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request password reset.')
  }
  return data
}

export async function confirmPasswordReset(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ token: string; user: { id: string; email: string }; snapshot?: MefinDB }> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'confirm-reset',
      email,
      otp,
      newPassword,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset password.')
  }

  if (data.token) {
    try {
      localStorage.setItem(TOKEN_KEY, data.token)
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      }
    } catch {}
  }
  return data
}

export function getLocalCachedDB(): MefinDB | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDB(data: MefinDB): void {
  // 1. Keep localStorage as an instant cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('Failed to save MefinDB to localStorage cache', err)
  }

  // 2. Debounce PUT /api/sync (800ms)
  const token = getAuthToken()
  if (!token) return

  updateSyncInfo({ status: 'syncing', error: undefined })

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer)
  }

  syncDebounceTimer = setTimeout(async () => {
    syncDebounceTimer = null
    try {
      const res = await fetch('/api/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ snapshot: data }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          logout()
          updateSyncInfo({ status: 'error', error: 'Session expired' })
          return
        }
        throw new Error(`Sync failed with status ${res.status}`)
      }

      const resJson = await res.json().catch(() => ({}))
      const syncedAt = resJson.updatedAt || Date.now()
      updateSyncInfo({ status: 'synced', lastSyncedAt: syncedAt, error: undefined })
    } catch (err: any) {
      console.warn('Sync error:', err)
      updateSyncInfo({ status: 'error', error: err?.message || 'Sync failed' })
    }
  }, 800)
}

export async function pullRemoteDB(): Promise<MefinDB | null> {
  const token = getAuthToken()
  if (!token) {
    return getLocalCachedDB()
  }

  updateSyncInfo({ status: 'syncing', error: undefined })
  try {
    const res = await fetch('/api/sync', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      if (res.status === 401) {
        logout()
        updateSyncInfo({ status: 'error', error: 'Session expired' })
        return null
      }
      throw new Error(`Pull failed with status ${res.status}`)
    }

    const json = await res.json()
    const snapshot = (json.snapshot || json.data) as MefinDB | null

    if (snapshot && typeof snapshot === 'object' && Object.keys(snapshot).length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
      } catch {}
      const syncedAt = json.updatedAt || Date.now()
      updateSyncInfo({ status: 'synced', lastSyncedAt: syncedAt, error: undefined })
      return snapshot
    }

    updateSyncInfo({ status: 'synced', error: undefined })
    return null
  } catch (err: any) {
    console.warn('pullRemoteDB error, falling back to cache:', err)
    updateSyncInfo({ status: 'error', error: err?.message || 'Offline' })
    return getLocalCachedDB()
  }
}

export async function applySnapshotToDexie(snapshot: MefinDB): Promise<void> {
  await db.transaction('rw', [
    db.transactions,
    db.accounts,
    db.budgets,
    db.goals,
    db.recurring,
    db.workspaces,
    db.workspaceSnapshots,
    db.meta,
  ], async () => {
    if (Array.isArray(snapshot.workspaces) && snapshot.workspaces.length > 0) {
      await db.workspaces.clear()
      await db.workspaces.bulkPut(snapshot.workspaces)
    }
    if (snapshot.activeWorkspaceId) {
      await db.meta.put({ key: 'activeWorkspaceId', value: snapshot.activeWorkspaceId })
    }
    if (Array.isArray(snapshot.transactions)) {
      await db.transactions.clear()
      await db.transactions.bulkPut(snapshot.transactions)
    }
    if (Array.isArray(snapshot.accounts)) {
      await db.accounts.clear()
      await db.accounts.bulkPut(snapshot.accounts)
    }
    if (Array.isArray(snapshot.budgets)) {
      await db.budgets.clear()
      await db.budgets.bulkPut(snapshot.budgets)
    }
    if (Array.isArray(snapshot.goals)) {
      await db.goals.clear()
      await db.goals.bulkPut(snapshot.goals)
    }
    if (Array.isArray(snapshot.recurring)) {
      await db.recurring.clear()
      await db.recurring.bulkPut(snapshot.recurring)
    }
    if (Array.isArray(snapshot.workspaceSnapshots) && snapshot.workspaceSnapshots.length > 0) {
      await db.workspaceSnapshots.clear()
      await db.workspaceSnapshots.bulkPut(snapshot.workspaceSnapshots)
    }
    await db.meta.put({ key: 'initialized', value: true })
  })
}
