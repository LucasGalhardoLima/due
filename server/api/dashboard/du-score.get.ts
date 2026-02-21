import { endOfMonth, getDaysInMonth } from 'date-fns'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

interface ScoreComponent {
  name: string
  score: number
  maxScore: number
  tip: string
}

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)
  const dayOfMonth = now.getDate()
  const daysInMonth = getDaysInMonth(now)

  // --- Fetch all data in parallel ---
  const [incomes, installments, categoryBudgets, cards, prevMonthsInstallments] = await Promise.all([
    // Incomes for current month
    prisma.income.findMany({
      where: {
        userId,
        OR: [
          { month, year },
          { isRecurring: true, OR: [{ year: { lt: year } }, { year, month: { lte: month } }] },
        ],
      },
    }),
    // Current month installments
    prisma.installment.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
        transaction: { userId },
      },
      select: { amount: true, dueDate: true },
    }),
    // Category budgets
    prisma.categoryBudget.findMany({
      where: { userId },
      select: { amount: true },
    }),
    // Credit cards
    prisma.creditCard.findMany({
      where: { userId },
      select: { limit: true },
    }),
    // Previous 3 months installments (for consistency)
    prisma.installment.findMany({
      where: {
        dueDate: {
          gte: new Date(month <= 3 ? year - 1 : year, (month - 4 + 12) % 12, 1),
          lt: startDate,
        },
        transaction: { userId },
      },
      select: { amount: true, dueDate: true },
    }),
  ])

  // --- Calculate base metrics ---
  const totalIncome = incomes.reduce((sum, inc) => sum + moneyToNumber(inc.amount), 0)
  const totalSpending = installments.reduce((sum, inst) => sum + moneyToNumber(inst.amount), 0)
  const totalBudget = categoryBudgets.reduce((sum, cb) => sum + moneyToNumber(cb.amount), 0)
  const totalLimit = cards.reduce((sum, c) => sum + moneyToNumber(c.limit), 0)

  const components: ScoreComponent[] = []

  // --- 1. Budget Adherence (20pts) ---
  let budgetScore = 20
  let budgetTip = 'Seus gastos estão dentro do orçamento.'
  if (totalBudget > 0) {
    const ratio = totalSpending / totalBudget
    if (ratio <= 1) {
      budgetScore = 20
    } else {
      // Scale down proportionally, min 0
      budgetScore = Math.max(0, Math.round(20 * (2 - ratio)))
      budgetTip = 'Você ultrapassou o orçamento. Revise seus limites por categoria.'
    }
  } else {
    budgetScore = 10 // No budget set — neutral
    budgetTip = 'Defina orçamentos por categoria para melhorar sua pontuação.'
  }
  components.push({ name: 'Orçamento', score: budgetScore, maxScore: 20, tip: budgetTip })

  // --- 2. Savings Rate (20pts) ---
  let savingsScore = 0
  let savingsTip = 'Cadastre sua renda para calcular sua taxa de poupança.'
  if (totalIncome > 0) {
    const savingsRate = (totalIncome - totalSpending) / totalIncome
    if (savingsRate >= 0.2) {
      savingsScore = 20
      savingsTip = 'Excelente! Você está poupando 20% ou mais da sua renda.'
    } else if (savingsRate > 0) {
      savingsScore = Math.round((savingsRate / 0.2) * 20)
      savingsTip = `Tente aumentar sua poupança para 20% da renda (hoje: ${Math.round(savingsRate * 100)}%).`
    } else {
      savingsScore = 0
      savingsTip = 'Seus gastos ultrapassaram sua renda este mês.'
    }
  }
  components.push({ name: 'Poupança', score: savingsScore, maxScore: 20, tip: savingsTip })

  // --- 3. Spending Pace (20pts) ---
  let paceScore = 20
  let paceTip = 'Seu ritmo de gastos está saudável.'
  if (totalBudget > 0 && dayOfMonth > 1) {
    const expectedPace = (totalBudget / daysInMonth) * dayOfMonth
    const paceRatio = totalSpending / expectedPace
    if (paceRatio <= 1) {
      paceScore = 20
    } else if (paceRatio <= 1.2) {
      paceScore = 15
      paceTip = 'Você está um pouco acima do ritmo ideal de gastos.'
    } else if (paceRatio <= 1.5) {
      paceScore = 10
      paceTip = 'Atenção: seu ritmo de gastos está acelerado para este ponto do mês.'
    } else {
      paceScore = Math.max(0, Math.round(20 * (2 - paceRatio)))
      paceTip = 'Alerta: ritmo de gastos muito acima do esperado. Desacelere!'
    }
  } else if (totalBudget === 0) {
    paceScore = 10
    paceTip = 'Defina orçamentos para acompanhar seu ritmo de gastos.'
  }
  components.push({ name: 'Ritmo', score: paceScore, maxScore: 20, tip: paceTip })

  // --- 4. Credit Utilization (20pts) ---
  let creditScore = 20
  let creditTip = 'Utilização do cartão está baixa — ótimo!'
  if (totalLimit > 0) {
    const utilization = totalSpending / totalLimit
    if (utilization < 0.3) {
      creditScore = 20
    } else if (utilization < 0.5) {
      creditScore = 15
      creditTip = 'Utilização do cartão entre 30-50%. Tente manter abaixo de 30%.'
    } else if (utilization < 0.7) {
      creditScore = 10
      creditTip = 'Utilização do cartão alta (50-70%). Cuidado com o limite.'
    } else if (utilization < 0.9) {
      creditScore = 5
      creditTip = 'Utilização do cartão muito alta (70-90%). Risco de estouro.'
    } else {
      creditScore = 0
      creditTip = 'Cartão quase no limite! Priorize reduzir gastos.'
    }
  } else {
    creditScore = 10
    creditTip = 'Cadastre seus cartões para acompanhar a utilização.'
  }
  components.push({ name: 'Cartão', score: creditScore, maxScore: 20, tip: creditTip })

  // --- 5. Consistency (20pts) ---
  let consistencyScore = 20
  let consistencyTip = 'Seus gastos estão consistentes com os meses anteriores.'

  // Group prev months by month
  const monthlyTotals: Record<string, number> = {}
  for (const inst of prevMonthsInstallments) {
    const d = inst.dueDate
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    if (!monthlyTotals[key]) monthlyTotals[key] = 0
    monthlyTotals[key] += moneyToNumber(inst.amount)
  }

  const prevMonthValues = Object.values(monthlyTotals)
  if (prevMonthValues.length >= 1) {
    const avgPrev = prevMonthValues.reduce((a, b) => a + b, 0) / prevMonthValues.length
    if (avgPrev > 0) {
      const variance = Math.abs(totalSpending - avgPrev) / avgPrev
      if (variance <= 0.1) {
        consistencyScore = 20
      } else if (variance <= 0.25) {
        consistencyScore = 15
        consistencyTip = 'Seus gastos variaram um pouco em relação à média recente.'
      } else if (variance <= 0.5) {
        consistencyScore = 10
        consistencyTip = 'Gastos deste mês estão bem diferentes da sua média.'
      } else {
        consistencyScore = Math.max(0, Math.round(20 * (1 - variance)))
        consistencyTip = 'Grande variação nos gastos este mês. Verifique compras atípicas.'
      }
    }
  } else {
    consistencyScore = 10
    consistencyTip = 'Precisamos de mais meses de dados para avaliar consistência.'
  }
  components.push({ name: 'Consistência', score: consistencyScore, maxScore: 20, tip: consistencyTip })

  // --- Final score ---
  const score = components.reduce((sum, c) => sum + c.score, 0)

  // --- Trend (compare to previous month) ---
  // Simple heuristic: if we have last month data, compute a rough score difference
  const lastMonthKey = `${month === 1 ? year - 1 : year}-${month === 1 ? 12 : month - 1}`
  const lastMonthSpending = monthlyTotals[lastMonthKey]
  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (lastMonthSpending !== undefined && totalIncome > 0) {
    const lastSavingsRate = (totalIncome - lastMonthSpending) / totalIncome
    const currentSavingsRate = (totalIncome - totalSpending) / totalIncome
    const diff = currentSavingsRate - lastSavingsRate
    if (diff > 0.03) trend = 'up'
    else if (diff < -0.03) trend = 'down'
  }

  return { score, components, trend }
})
