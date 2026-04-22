export interface ChatIntent {
  isLongRunning: boolean
  isExpenseAdd: boolean
}

export function detectChatIntent(message: string): ChatIntent {
  return {
    isLongRunning: /6 meses|análise profunda|semestral|análise completa/i.test(message),
    isExpenseAdd: /gastei|comprei|paguei|adquiri|comi|almocei|jantei/i.test(message)
      && /(R\$|\d+[,.]?\d*\s*(reais?|contos?|pilas?|real)|\d+)/i.test(message),
  }
}
