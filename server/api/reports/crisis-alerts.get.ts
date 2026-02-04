import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { ForecastUtils } from '../../utils/forecast'
import { getUser } from '../../utils/session'
import { moneyToNumber } from '../../utils/money'

interface Alert {
  type: 'future_shortage' | 'spending_trend_alert'
  title?: string
  message?: string
  severity?: 'warning' | 'critical'
  [key: string]: unknown
}

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const cardId = query.cardId as string
  
  const alerts: Alert[] = []
  
  // 1. Get Card
  const card = await prisma.creditCard.findFirst({
      where: { 
          userId,
          ...(cardId ? { id: cardId } : { isDefault: true })
      }
  })

  if (!card) return []

  const today = new Date()

  // ==========================================
  // A) FUTURE SHORTAGE DETECTOR
  // ==========================================
  
  // Look 3 months ahead
  const timeline = []
  for (let i = 1; i <= 3; i++) {
      const targetDate = addMonths(today, i)
      
      // 1. Get Fixed Installments for this future month
      // We query installments that have a dueDate in this month/year
      const installments = await prisma.installment.aggregate({
          _sum: { amount: true },
          where: {
             dueDate: {
                 gte: startOfMonth(targetDate),
                 lte: endOfMonth(targetDate)
             },
             transaction: { cardId: card.id }
          }
      })
      
      const fixedCommitment = installments._sum.amount ? moneyToNumber(installments._sum.amount) : 0
      
      // 2. Project Variable Spending
      // Get last 3 months of variable spending (non-installments, non-subscription) to project
      // For MVP we'll just grab total transactions amount of last 3 months / 3 as a baseline
      // A better query would be specifically identifying 'variable' spend.
      // Let's approximate: 
      const last3MonthsStart = subMonths(today, 3)
      const recentTransactions = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
              cardId: card.id,
              purchaseDate: { gte: last3MonthsStart },
              installmentsCount: 1, // Single payment usually means variable/variable-ish
              isSubscription: false
          }
      })
      
      const avgVariable = ((recentTransactions._sum.amount ? moneyToNumber(recentTransactions._sum.amount) : 0) / 3)
      const projectedTotal = fixedCommitment + avgVariable
      
      const usagePercent = (projectedTotal / moneyToNumber(card.limit)) * 100
      
      let status: 'ok' | 'warning' | 'critical' = 'ok'
      if (usagePercent > 70) status = 'warning'
      if (usagePercent > 90) status = 'critical'
      
      timeline.push({
          monthName: targetDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
          commitment: usagePercent,
          fixed: fixedCommitment,
          projected: projectedTotal,
          status
      })
      
      // Trigger Alert if critical
      if (status === 'critical' && !alerts.find(a => a.type === 'future_shortage')) {
          alerts.push({
              type: 'future_shortage',
              when: targetDate.toISOString().split('T')[0],
              countdown_days: Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
              probability: 0.85,
              title: `Risco Alto: Crise de Limite em ${targetDate.toLocaleString('pt-BR', { month: 'long' })}`,
              analysis: {
                  causes: [
                      `Parcelas acumuladas: R$ ${fixedCommitment.toFixed(2)}`,
                      `Padrão histórico variável: ~R$ ${avgVariable.toFixed(2)}`,
                      `Previsão total: R$ ${projectedTotal.toFixed(2)} (${usagePercent.toFixed(0)}% do limite)`
                  ],
                  trigger_event: 'Convergência de parcelas',
                  risk_factors: ['Limite comprometido', 'Tendência de gastos']
              },
              prevention: {
                  recommended: 'option_2',
                  option_1: { action: 'Evite compras parceladas por 45 dias', impact: 'Reduz risco para 30%', difficulty: 'Médio' },
                  option_2: { action: 'Antecipe parcelas agora', impact: 'Reduz risco imediatamente', difficulty: 'Alto' }
              },
              visualization: { timeline }
          })
      }
  }


  // ==========================================
  // B) SPENDING TREND DETECTOR
  // ==========================================
  
  // Get monthly totals for last 4 months
  const monthlyTotals = []
  for (let i = 3; i >= 0; i--) {
      const d = subMonths(today, i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      
      const sum = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
              cardId: card.id,
              purchaseDate: { gte: start, lte: end }
          }
      })
      
      monthlyTotals.push({
          month: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
          amount: sum._sum.amount ? moneyToNumber(sum._sum.amount) : 0
      })
  }
  
  const values = monthlyTotals.map(m => m.amount)
  const trendAnalysis = ForecastUtils.calculateTrend(values)
  
  if (trendAnalysis.trend === 'growing' && trendAnalysis.growth > 0.15) { // 15% growth thresh
      
      // Project next 3 months
      const projection = []
      const lastValue = trendAnalysis.nextValue // This is "Next Month" relative to input series
      for(let k=0; k<3; k++) {
          const m = addMonths(today, k+1)
          projection.push({
              month: m.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
              projected: Math.round(lastValue + (trendAnalysis.slope * k))
          })
      }
      
      alerts.push({
          type: 'spending_trend_alert',
          detected_pattern: {
              trend: 'crescente',
              duration_months: 4,
              data: monthlyTotals,
              monthly_increase_avg: Math.round(trendAnalysis.slope),
              percentage_growth: `+${(trendAnalysis.growth * 100).toFixed(0)}% em 4 meses`
          },
          projection: {
              next_3_months: projection,
              outcome: 'Você pode estourar seu orçamento em breve.'
          },
          recommendation: {
              message: 'Interrompa esta tendência AGORA',
              actions: ['Identifique gastos variáveis', 'Corte supérfluos']
          }
      })
  }
  
  return alerts
})
