import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns'

interface AuditItem {
  date: string
  description: string
  amount: number
}

interface AuditRequest {
  items: AuditItem[]
  cardId: string
  month: number
  year: number
}

interface FaturaAudit {
  status: 'divergent' | 'match'
  missing_in_app: any[]
  missing_in_bank: any[]
  duplicates: any[]
  suspicious: any[]
  total_divergence: number
  action_needed: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AuditRequest>(event)
  const { items: bankItems, cardId, month, year } = body

  // Define date range for the invoice
  // Assuming strict calendar month for now, but should ideally use card closing day
  // For MVP, we'll look at transactions in the target month +/- 5 days buffer to catch edge cases
  const startDate = new Date(year, month - 1, 1) // month is 1-indexed in UI usually? checking usage
  const endDate = endOfMonth(startDate)
  
  // Fetch app transactions
  const dbTransactions = await prisma.transaction.findMany({
    where: {
      cardId,
      purchaseDate: {
        gte: new Date(year, month - 1, -5), // buffer
        lte: new Date(year, month, 5)
      }
    },
    include: {
      category: true
    }
  })

  const audit: FaturaAudit = {
    status: 'match',
    missing_in_app: [],
    missing_in_bank: [],
    duplicates: [],
    suspicious: [],
    total_divergence: 0,
    action_needed: false
  }

  // 1. Detect Duplicates in App (internal check)
  // We look for transactions with same amount and similar description on same day
  // This is a pre-check
  
  // 2. Compare Bank vs App
  
  // Helper to normalize strings
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Track which db transactions are matched
  const matchedDbIds = new Set<string>()

  for (const bankItem of bankItems) {
    const bankDate = parseISO(bankItem.date)
    const bankAmount = Math.abs(bankItem.amount)
    
    // Find match in DB
    // Match criteria: Amount equals (approx), Date close, Description similar
    const match = dbTransactions.find(t => {
      if (matchedDbIds.has(t.id)) return false
      
      const tAmount = Math.abs(t.amount)
      const tDate = t.purchaseDate
      
      // Amount check (allow small diff like 0.01)
      const amountMatch = Math.abs(tAmount - bankAmount) < 0.05
      
      // Date check (within 3 days)
      const dateDiff = Math.abs(differenceInDays(tDate, bankDate))
      const dateMatch = dateDiff <= 3
      
      // Description check (fuzzy)
      const descMatch = normalize(t.description).includes(normalize(bankItem.description)) ||
                        normalize(bankItem.description).includes(normalize(t.description))

      return amountMatch && dateMatch && descMatch
    })

    if (match) {
        matchedDbIds.add(match.id)
    } else {
        // Missing in App
        audit.missing_in_app.push({
            date: bankItem.date,
            merchant: bankItem.description,
            amount: bankItem.amount,
            alert_level: 'warning',
            message: 'Cobrança na fatura não encontrada no app.'
        })
        audit.total_divergence += bankItem.amount
    }
  }

  // 3. Detect Missing in Bank (items in App but not matched)
  dbTransactions.forEach(t => {
      // Filter out transactions strictly outside the month if we used buffer
      if (t.purchaseDate < startDate || t.purchaseDate > endDate) return
      
      if (!matchedDbIds.has(t.id)) {
          audit.missing_in_bank.push({
              date: t.purchaseDate,
              merchant: t.description,
              amount: t.amount,
              alert_level: 'info',
              message: 'Registrado no app mas não consta na fatura (delay?).'
          })
      }
  })

  // 4. Suspicious / Duplicates logic
  // Simple duplicate check on the BANK items list itself
  const bankItemsMap = new Map<string, number>()
  bankItems.forEach(item => {
     const key = `${item.amount}-${normalize(item.description)}`
     bankItemsMap.set(key, (bankItemsMap.get(key) || 0) + 1)
  })

  bankItemsMap.forEach((count, key) => {
      if (count > 1) {
          const [amount, desc] = key.split('-') // This is rough, but illustrative
          // Find one instance to report
          const original = bankItems.find(i => Math.abs(i.amount) - parseFloat(amount) < 0.1 && normalize(i.description) === desc)
          if (original) {
            audit.duplicates.push({
                date: original.date,
                merchant: original.description,
                amount: original.amount,
                count: count,
                alert_level: 'critical',
                message: `Possível duplicata na fatura (${count}x)`
            })
          }
      }
  })

  // Final status
  if (audit.missing_in_app.length > 0 || audit.missing_in_bank.length > 0 || audit.duplicates.length > 0) {
      audit.status = 'divergent'
      audit.action_needed = true
  }

  return audit
})
