import prisma from '../../utils/prisma'
import { startOfMonth } from 'date-fns'

export default defineEventHandler(async (_event) => {
  // Security Check (simulated)
  // In Vercel Cron, you check 'Authorization' header matching CRON_SECRET
  // const authHeader = getRequestHeader(event, 'authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

  const now = new Date()
  const currentMonthStart = startOfMonth(now)

  // 1. Fetch Active Subscriptions
  const subscriptions = await prisma.transaction.findMany({
    where: {
      isSubscription: true,
      active: true
    },
    include: {
      installments: {
        orderBy: { dueDate: 'desc' },
        take: 1
      },
      card: true // need closing day
    }
  })

  const results = []

  // 2. Process Each Subscription
  for (const sub of subscriptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastInstallment = (sub as any).installments?.[0]
    
    // Check if we already have an installment for THIS month (or relevant cycle)
    // Simple logic: if last installment usage date is BEFORE this month start, we need a new one.
    // Or check if lastInstallment.dueDate is in the current billing cycle.

    let shouldCreate = false
    
    if (!lastInstallment) {
      shouldCreate = true // Should have at least one from creation, but safety check
    } else {
      // If the last installment was for a previous month, generate new one.
      // We compare the REFERENCE date of the installment (dueDate is approximate)
      if (lastInstallment.dueDate < currentMonthStart) {
        shouldCreate = true
      }
    }

    if (shouldCreate) {
      // Create new installment
      // Due Date Logic: "Current Month" + Card Closing/Due Logic
      // For simplicity in MVP: Set dueDate to today or same day next month.
      // Better: Use the subscription's purchase day in the current month.
      
      const purchaseDay = sub.purchaseDate.getDate()
      const newDueDate = new Date(now.getFullYear(), now.getMonth(), purchaseDay)

      const newInstallment = await prisma.installment.create({
        data: {
          number: (lastInstallment?.number || 0) + 1,
          amount: sub.amount,
          dueDate: newDueDate,
          transactionId: sub.id
        }
      })

      // Update Subscription
      await prisma.transaction.update({
        where: { id: sub.id },
        data: { lastProcessedDate: now }
      })

      results.push({ 
        subscription: sub.description, 
        status: 'renewed', 
        installment: newInstallment.id 
      })
    } else {
      results.push({ 
        subscription: sub.description, 
        status: 'skipped (already exists)' 
      })
    }
  }

  return {
    processed: results.length,
    details: results
  }
})
