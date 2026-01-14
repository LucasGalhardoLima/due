import { z } from 'zod'
import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

const bodySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  cardId: z.string().uuid().optional() // Optional: Analyze specific card or global
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const { month, year, cardId } = result.data
  
  // 1. Define Range
  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)

  // 2. Fetch Installments (The core of the invoice)
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: { gte: startDate, lte: endDate },
      transaction: cardId ? { cardId } : undefined
    },
    include: {
      transaction: {
        include: { category: true }
      }
    }
  })

  if (installments.length === 0) {
    return {
      verdict: 'Neutral',
      title: 'Sem dados suficientes',
      message: 'Não há lançamentos suficientes nesta fatura para gerar uma análise.',
      action: 'Adicione gastos para ver a mágica.'
    }
  }

  // 3. Calculate Metrics
  const total = installments.reduce((sum, i) => sum + i.amount, 0)
  
  // Group by Category
  const categoryMap: Record<string, number> = {}
  installments.forEach(i => {
    const cat = i.transaction.category.name
    categoryMap[cat] = (categoryMap[cat] || 0) + i.amount
  })

  // Find Top Category
  let topCategory = { name: '', amount: 0 }
  Object.entries(categoryMap).forEach(([name, amount]) => {
    if (amount > topCategory.amount) topCategory = { name, amount }
  })
  
  const topCatPct = (topCategory.amount / total) * 100

  // Find Largest Single Transaction
  const largestTx = installments.reduce((max, curr) => curr.amount > max.amount ? curr : max, installments[0])
  const largestTxPct = (largestTx.amount / total) * 100

  // 4. "Ruthless Logic" Rules
  let verdict = 'Neutral'
  let title = 'Fatura sob controle'
  let message = `Seus gastos totalizam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}.`
  let action = 'Continue assim.'
  let severity = 'info' // info, warning, destiny (critical)

  // Rule 1: The Category Black Hole (> 40%)
  if (topCatPct > 40) {
    verdict = 'Critical'
    severity = 'critical'
    title = `Alerta: ${topCategory.name}`
    message = `Atenção: ${topCategory.name} está consumindo ${topCatPct.toFixed(0)}% da sua fatura. Isso é um sinal de desequilíbrio.`
    action = `Tente definir um teto para ${topCategory.name} no próximo mês.`
  } 
  // Rule 2: The Villain Transaction (> 30%)
  else if (largestTxPct > 30) {
    verdict = 'Warning'
    severity = 'warning'
    title = 'Compra de Alto Impacto'
    message = `O lançamento "${largestTx.transaction.description}" representa sozinho ${largestTxPct.toFixed(0)}% da fatura.`
    action = 'Evite novas compras grandes até quitar esta.'
  }
  // Rule 3: Death by a Thousand Cuts (Many small txs)
  else if (installments.length > 20 && (total / installments.length) < 50) {
    verdict = 'Concern'
    severity = 'warning'
    title = 'Muitos pequenos gastos'
    message = `Você tem ${installments.length} lançamentos com média baixa. O "cafézinho" está somando alto.`
    action = 'Revise suas assinaturas e gastos diários.'
  }

  return {
    verdict,
    severity,
    title,
    message,
    action,
    stats: {
        topCategory: topCategory.name,
        topCategoryPct: topCatPct,
        largestTx: largestTx.transaction.description
    }
  }
})
