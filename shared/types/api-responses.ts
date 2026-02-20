/** Quick AI insights response (insights.post.ts) */
export interface InsightsResponse {
  success: true
  insights: {
    diagnostico: string
    acoes_imediatas: string[]
    alivio_futuro: string
    alertas?: string[]
  }
  metadata: {
    totalSpent: number
    transactionCount: number
    topCategories: { name: string; amount: number; percentage: string }[]
  }
}

/** Deep AI analysis response (deep-insights.post.ts) */
export interface DeepInsights {
  trend_analysis: {
    direction: 'crescente' | 'estável' | 'decrescente'
    monthly_change_pct: number
    categories_driving_change: { name: string; change_pct: number }[]
  }
  forecast: {
    next_month_prediction: number
    confidence: number
    factors: string[]
  }
  optimization_opportunities: {
    category: string
    current_spending: number
    potential_saving: number
    difficulty: 'fácil' | 'médio' | 'difícil'
    suggestion: string
  }[]
  health_score: {
    score: number
    factors: { label: string; impact: 'positive' | 'negative' }[]
  }
}

export interface DeepInsightsResponse {
  success: true
  insights: DeepInsights
  metadata: {
    periodStart: string
    periodEnd: string
    totalAnalyzed: number
    monthlyAverage: number
    monthlyData: { month: string; total: number; change_pct: number | null }[]
    categoryTrends: { name: string; sixMonthAvg: number; lastMonth: number; change_pct: number }[]
  }
}

/** Proactive advisor response (contextual.post.ts) */
export interface AdvisorResponse {
  message: string
  tone: 'curious' | 'warning' | 'congratulatory' | 'neutral'
  action?: {
    type: 'suggestion' | 'alert'
    text: string
  }
  should_display: boolean
  priority: 'low' | 'medium' | 'high'
}
