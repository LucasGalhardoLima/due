export interface ChatIntent {
  isLongRunning: boolean
  isExpenseAdd: boolean
  isFilterIntent: boolean
}

export function detectChatIntent(message: string): ChatIntent {
  return {
    isLongRunning: /6 meses|análise profunda|semestral|análise completa/i.test(message),
    isExpenseAdd: /gastei|comprei|paguei|adquiri|comi|almocei|jantei/i.test(message)
      && /(R\$|\d+[,.]?\d*\s*(reais?|contos?|pilas?|real)|\d+)/i.test(message),
    isFilterIntent: /^(mostra|mostre|filtra|filtre|quero ver|me mostra|me mostre)\b/i.test(message)
      || /\b(gastos|transações|compras)\s+(com|de|acima|abaixo|em)\b/i.test(message)
      || /\bacima de\b|\babaixo de\b|\bmaior que\b|\bmenor que\b/i.test(message),
  }
}
