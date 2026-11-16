import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Sparkles, X, RotateCcw, AlertCircle, ArrowUp } from 'lucide-react'
import { getAuthToken } from '../db'
import type { Tx } from '../types'
import type { StoredAccount, StoredBudget, StoredGoal } from '../db'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isError?: boolean
}

interface FinanceChatProps {
  isOpen: boolean
  onClose: () => void
  transactions: Tx[]
  accounts: StoredAccount[]
  budgets: StoredBudget[]
  goals: StoredGoal[]
}

const STARTER_PROMPTS = [
  'Where did I spend the most this month?',
  'Summarize my cash flow',
  'How can I cut unnecessary expenses?'
]

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+?\*\*|`[^`]+?`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="ai-md-strong">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="ai-md-code">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = (key: string) => {
    if (!currentList) return
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`${key}-ul`} className="ai-md-list">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="ai-md-list-item">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
    } else {
      elements.push(
        <ol key={`${key}-ol`} className="ai-md-list ai-md-ol">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="ai-md-list-item">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      )
    }
    currentList = null
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList(`flush-${lineIdx}`)
      return
    }

    // Bullet point: "* ", "- ", "• "
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.*)$/)
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(`flush-${lineIdx}`)
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(bulletMatch[1])
      return
    }

    // Numbered list item: "1. ", "2. "
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(`flush-${lineIdx}`)
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(numMatch[2])
      return
    }

    // End active list for any regular block
    flushList(`flush-${lineIdx}`)

    // Heading: "### ", "## ", "# "
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/)
    if (headingMatch) {
      elements.push(
        <div key={`h-${lineIdx}`} className="ai-md-heading">
          {parseInlineMarkdown(headingMatch[2])}
        </div>
      )
      return
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className="ai-md-p">
        {parseInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList('final')
  return elements
}

export const FinanceChat: React.FC<FinanceChatProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  budgets,
  goals
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isOpen])

  // Build lightweight, token-optimized context summary
  const financialContext = useMemo(() => {
    // 1. Account balances (base + net transactions)
    const calculatedAccounts = accounts.map(account => {
      const net = transactions
        .filter(t => t.account === account.name)
        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
      return {
        name: account.name,
        type: account.type,
        currentBalance: Math.round((account.balance + net) * 100) / 100
      }
    })

    const totalBalance = calculatedAccounts.reduce((sum, a) => sum + a.currentBalance, 0)

    // 2. Current month metrics
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const monthTxs = transactions.filter(t => t.date && t.date.startsWith(currentMonthKey))
    const monthlyIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthlyExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const spendingByCategory: Record<string, number> = {}
    for (const t of monthTxs) {
      if (t.type === 'expense') {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount
      }
    }

    // 3. Budgets with current usage
    const budgetStatus = budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.name.toLowerCase() && t.date?.startsWith(currentMonthKey))
        .reduce((s, t) => s + t.amount, 0)
      return {
        category: b.name,
        limit: b.limit,
        spentSoFarThisMonth: spent,
        remaining: Math.max(0, b.limit - spent),
        exceeded: spent > b.limit
      }
    })

    // 4. Last 15-20 transactions sorted recent-first
    const recentTransactions = [...transactions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 18)
      .map(t => ({
        date: t.date,
        title: t.title,
        category: t.category,
        account: t.account,
        type: t.type,
        amount: t.amount
      }))

    return {
      totalNetWorth: totalBalance,
      accounts: calculatedAccounts,
      thisMonthOverview: {
        month: currentMonthKey,
        totalIncome: monthlyIncome,
        totalExpenses: monthlyExpense,
        netSavings: monthlyIncome - monthlyExpense,
        topSpendingCategories: spendingByCategory
      },
      budgets: budgetStatus,
      goals: goals.map(g => ({ title: g.name, current: g.current, target: g.target })),
      recentTransactions
    }
  }, [transactions, accounts, budgets, goals])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const token = getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // History payload: last 6 turns
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          financialContext
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}`)
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || 'No response returned.',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err.message || 'Unable to connect to Mefin AI. Please try again.',
        timestamp: Date.now(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    setMessages([])
    setInput('')
  }

  if (!isOpen) return null

  return (
    <div className="ai-chat-backdrop" onClick={onClose}>
      <div className="ai-chat-drawer" onClick={e => e.stopPropagation()}>
        {/* Chat Header */}
        <header className="ai-chat-header">
          <div className="ai-chat-brand">
            <div className="ai-chat-avatar">
              <Sparkles size={16} />
            </div>
            <div className="ai-chat-title-wrap">
              <span className="ai-chat-name">Mefin AI</span>
              <span className="ai-chat-sub">Private Personal Finance Assistant</span>
            </div>
          </div>
          <div className="ai-chat-controls">
            {messages.length > 0 && (
              <button
                className="ai-chat-btn-clear"
                onClick={handleClearHistory}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              className="ai-chat-btn-close"
              onClick={onClose}
              title="Close chat"
              aria-label="Close chat"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="ai-chat-messages">
          {messages.length === 0 ? (
            <div className="ai-chat-empty">
              <div className="ai-chat-empty-icon">
                <Sparkles size={28} />
              </div>
              <h3>Ask Mefin AI</h3>
              <p>
                Insights powered by Gemini. Ask about your balances, spending trends, or budgeting suggestions.
              </p>

              <div className="ai-starter-chips">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="ai-starter-chip"
                    onClick={() => handleSend(prompt)}
                  >
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.role === 'user' ? 'ai-user-row' : 'ai-bot-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="ai-bot-avatar-tiny">
                    <Sparkles size={12} />
                  </div>
                )}
                <div
                  className={`ai-bubble ${
                    msg.role === 'user'
                      ? 'ai-bubble-user'
                      : msg.isError
                      ? 'ai-bubble-error'
                      : 'ai-bubble-bot'
                  }`}
                >
                  {msg.isError && (
                    <div className="ai-error-indicator">
                      <AlertCircle size={14} />
                      <span>Notice</span>
                    </div>
                  )}
                  <div className="ai-bubble-text">
                    {msg.role === 'assistant' ? renderFormattedText(msg.content) : msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="ai-message-row ai-bot-row">
              <div className="ai-bot-avatar-tiny">
                <Sparkles size={12} />
              </div>
              <div className="ai-bubble ai-bubble-bot ai-bubble-loading">
                <span className="ai-loading-dot"></span>
                <span className="ai-loading-dot"></span>
                <span className="ai-loading-dot"></span>
                <span className="ai-loading-label">Mefin is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="ai-chat-footer">
          <div className="ai-input-wrap">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Mefin about your finances..."
              disabled={loading}
              className="ai-input-field"
            />
            <button
              className={`ai-send-btn ${input.trim() && !loading ? 'active' : ''}`}
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <ArrowUp size={16} />
            </button>
          </div>
          <div className="ai-footer-note">
            Answers are generated privately with your aggregated financial overview.
          </div>
        </div>
      </div>
    </div>
  )
}
