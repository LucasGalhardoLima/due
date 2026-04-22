export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  card?: ResponseCard
  followUpChips?: string[]
  isTyping?: boolean
  notificationPrompt?: boolean
  parsedExpense?: ParsedExpenseResult
}

export interface ResponseCard {
  type: 'spending-analysis' | 'expense-confirm' | 'budget-status' | 'generic'
  title: string
  items?: CardItem[]
  verdict?: string
  actions?: ChatAction[]
}

export interface CardItem {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  barPercent?: number
}

export interface ChatAction {
  label: string
  action: 'open-drawer' | 'navigate' | 'dismiss'
  payload?: Record<string, unknown>
}

export interface ParsedExpenseResult {
  description: string
  amount: number
  date: string
  installments: number
  cardId: string | null
  categoryId: string | null
}

export interface ChatContext {
  route: string
  tabContext: string
}

export interface ContextualSuggestion {
  label: string
  message: string
}

export interface ChatStreamMetadata {
  longRunning?: boolean
  parsedExpense?: ParsedExpenseResult
}
