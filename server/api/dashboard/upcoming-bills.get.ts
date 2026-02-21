import { z } from 'zod'
import { addDays, startOfDay, differenceInCalendarDays } from 'date-fns'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'
import { createNotification } from '../../utils/notifications'

const querySchema = z.object({
  limit: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const result = querySchema.safeParse(query)
  const maxItems = result.success && result.data.limit ? parseInt(result.data.limit) : 5

  const today = startOfDay(new Date())
  const horizon = addDays(today, 60) // Look 60 days ahead

  // 1. Fetch upcoming installments (next bills)
  const upcomingInstallments = await prisma.installment.findMany({
    where: {
      dueDate: { gte: today, lte: horizon },
      transaction: { userId },
    },
    include: {
      transaction: {
        select: {
          description: true,
          isSubscription: true,
          installmentsCount: true,
          category: { select: { name: true, color: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
    take: maxItems * 3, // Fetch extra to deduplicate subscriptions
  })

  // 2. Deduplicate: for subscriptions, keep only the earliest upcoming
  const seen = new Set<string>()
  const bills: {
    id: string
    description: string
    amount: number
    dueDate: string
    isSubscription: boolean
    installmentLabel: string | null
    categoryName: string
    categoryColor: string | null
  }[] = []

  for (const inst of upcomingInstallments) {
    if (bills.length >= maxItems) break

    const key = inst.transaction.isSubscription
      ? `sub-${inst.transactionId}`
      : inst.id

    if (seen.has(key)) continue
    seen.add(key)

    bills.push({
      id: inst.id,
      description: inst.transaction.description,
      amount: moneyToNumber(inst.amount),
      dueDate: inst.dueDate.toISOString(),
      isSubscription: inst.transaction.isSubscription,
      installmentLabel: inst.transaction.installmentsCount > 1
        ? `${inst.number}/${inst.transaction.installmentsCount}`
        : null,
      categoryName: inst.transaction.category.name,
      categoryColor: inst.transaction.category.color,
    })
  }

  // Fire-and-forget: bill reminder notifications for bills due within 3 days
  const now = new Date()
  for (const bill of bills) {
    const daysUntilDue = differenceInCalendarDays(new Date(bill.dueDate), now)
    if (daysUntilDue >= 0 && daysUntilDue <= 3) {
      const label = daysUntilDue === 0
        ? `${bill.description} vence hoje!`
        : `${bill.description} vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}!`
      createNotification(userId, 'bill_reminder',
        label,
        `Fica de olho! O pagamento de ${bill.description} (R$ ${bill.amount.toFixed(2)}) tá chegando.`,
        '/parcelamentos'
      ).catch(() => {})
    }
  }

  return { bills }
})
