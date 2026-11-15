export type TransactionType = 'income' | 'expense'

export interface Tx {
  id: number
  title: string
  category: string
  account: string
  date: string
  amount: number
  type: TransactionType
}
