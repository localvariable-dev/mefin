import Dexie, { type Table } from 'dexie'
import type { Tx } from './types'

export interface StoredAccount { name: string; type: string; balance: number }
export interface StoredBudget { name: string; spent: number; limit: number; color: string }
export interface StoredGoal { name: string; current: number; target: number; date: string }
export interface Workspace { id: string; name: string; kind: 'personal' | 'workspace'; createdAt: string }
export interface WorkspaceSnapshot { id: string; transactions: Tx[]; accounts: StoredAccount[]; budgets: StoredBudget[]; goals: StoredGoal[]; recurring: RecurringItem[]; dismissedNoticeIds: string[]; updatedAt: string }
export interface RecurringItem { id: number; title: string; amount: number; category: string; account: string; type: 'income' | 'expense'; frequency: 'weekly' | 'monthly' | 'yearly'; nextDate: string; active: boolean }
export interface DismissedNotice { id: string; dismissedAt: string }

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
    this.version(1).stores({ transactions: 'id, date, type, category, account', accounts: 'name', budgets: 'name', goals: 'name', meta: 'key' })
    this.version(2).stores({
      transactions: 'id, date, type, category, account', accounts: 'name', budgets: 'name', goals: 'name', meta: 'key',
      workspaces: 'id, kind', workspaceSnapshots: 'id, updatedAt', recurring: '++id, nextDate, active, type', dismissedNotices: 'id, dismissedAt',
    })
  }
}
export const db = new MefinDatabase()
