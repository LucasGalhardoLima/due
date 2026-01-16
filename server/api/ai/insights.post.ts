import { z } from 'zod'
import OpenAI from 'openai'
import prisma from '../../utils/prisma'

const querySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { month, year } = querySchema.parse(query)
  
  const now = new Date()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  const targetYear = year ? parseInt(year) : now.getFullYear()

  // Fetch all transactions for the target month
  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: {
      purchaseDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      card: { select: { name: true } },
      category: { select: { name: true } },
      installments: {
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          amount: true,
          number: true
        }
      }
    },
    orderBy: {
      purchaseDate: 'desc'
    }
  })

  // Calculate category spending
  const categorySpending: Record<string, number> = {}
  let totalSpent = 0

  for (const tx of transactions) {
    const categoryName = tx.category.name
    const installmentTotal = tx.installments.reduce((sum, inst) => sum + inst.amount, 0)
    
    if (!categorySpending[categoryName]) {
      categorySpending[categoryName] = 0
    }
    categorySpending[categoryName] += installmentTotal
    totalSpent += installmentTotal
  }

  // Get future installments (upcoming fixed costs)
  const futureInstallments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gt: endDate
      }
    },
    include: {
      transaction: {
        include: {
          category: { select: { name: true } }
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    },
    take: 50
  })

  // Prepare data for AI
  const categoryArray = Object.entries(categorySpending)
    .map(([name, amount]) => ({ name, amount, percentage: (amount / totalSpent * 100).toFixed(1) }))
    .sort((a, b) => b.amount - a.amount)

  const aiPrompt = `Você é um consultor financeiro pessoal. Analise os dados abaixo e forneça insights PRÁTICOS e ACIONÁVEIS.

DADOS DO MÊS (${targetMonth}/${targetYear}):
- Total gasto: R$ ${totalSpent.toFixed(2)}
- Transações: ${transactions.length}

GASTOS POR CATEGORIA:
${categoryArray.map(c => `- ${c.name}: R$ ${c.amount.toFixed(2)} (${c.percentage}%)`).join('\n')}

PARCELAS FUTURAS (próximos meses):
${futureInstallments.slice(0, 10).map(inst => 
  `- ${inst.transaction.category.name}: R$ ${inst.amount.toFixed(2)} parcela ${inst.number} em ${new Date(inst.dueDate).toLocaleDateString('pt-BR')}`
).join('\n')}

MISSÃO: Responda à pergunta crucial: "Por que minha fatura está alta e como reduzi-la no próximo mês?"

Forneça EXATAMENTE 4 seções (use JSON):
{
  "diagnostico": "Uma frase explicando o que mais contribuiu para o valor alto",
  "acoes_imediatas": ["Ação 1", "Ação 2", "Ação 3"],
  "alivio_futuro": "Quando parcelas vão terminar ou quando haverá alívio",
  "alertas": ["Alerta sobre categoria X", "Alerta sobre hábito Y"]
}

Seja DIRETO, use números reais, e não seja genérico. Fale como um amigo que entende de finanças.`

  // Call OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um consultor financeiro pessoal que fornece insights práticos e acionáveis em português do Brasil. Sempre responda em JSON válido.'
        },
        { role: 'user', content: aiPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    })

    const messageContent = completion.choices[0]?.message?.content
    if (!messageContent) {
      throw new Error('No response from AI')
    }

    const insights = JSON.parse(messageContent)

    return {
      success: true,
      insights,
      metadata: {
        totalSpent,
        transactionCount: transactions.length,
        topCategories: categoryArray.slice(0, 3)
      }
    }
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao gerar insights',
      data: { error: error.message }
    })
  }
})
