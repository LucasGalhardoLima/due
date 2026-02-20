import { z } from 'zod'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  format,
  isBefore,
  isEqual,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

const querySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']),
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
})

interface Bucket {
  label: string
  start: Date
  end: Date
  income: number
  spending: number
  net: number
}

function generateBuckets(period: string, rangeStart: Date, rangeEnd: Date): Bucket[] {
  const buckets: Bucket[] = []

  let current = rangeStart

  while (isBefore(current, rangeEnd) || isEqual(current, rangeEnd)) {
    let bucketStart: Date
    let bucketEnd: Date
    let label: string

    switch (period) {
      case 'week': {
        bucketStart = startOfWeek(current, { weekStartsOn: 1 })
        bucketEnd = endOfWeek(current, { weekStartsOn: 1 })
        label = format(bucketStart, "dd/MM", { locale: ptBR })
        current = addWeeks(bucketStart, 1)
        break
      }
      case 'month': {
        bucketStart = startOfMonth(current)
        bucketEnd = endOfMonth(current)
        label = format(bucketStart, 'MMM yyyy', { locale: ptBR })
        current = addMonths(bucketStart, 1)
        break
      }
      case 'quarter': {
        bucketStart = startOfQuarter(current)
        bucketEnd = endOfQuarter(current)
        const q = Math.ceil((bucketStart.getMonth() + 1) / 3)
        label = `Q${q} ${bucketStart.getFullYear()}`
        current = addQuarters(bucketStart, 1)
        break
      }
      case 'year': {
        bucketStart = startOfYear(current)
        bucketEnd = endOfYear(current)
        label = format(bucketStart, 'yyyy')
        current = addYears(bucketStart, 1)
        break
      }
      default:
        throw new Error(`Unknown period: ${period}`)
    }

    buckets.push({
      label,
      start: bucketStart,
      end: bucketEnd,
      income: 0,
      spending: 0,
      net: 0,
    })
  }

  return buckets
}

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'cashFlow'))

  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query params' })
  }

  const { period } = result.data
  const rangeStart = new Date(result.data.startDate)
  const rangeEnd = new Date(result.data.endDate)

  // Generate time buckets
  const buckets = generateBuckets(period, rangeStart, rangeEnd)

  if (buckets.length === 0) {
    return []
  }

  const globalStart = buckets[0].start
  const globalEnd = buckets[buckets.length - 1].end

  // Fetch installments (spending) within the full range
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: { gte: globalStart, lte: globalEnd },
      transaction: { userId },
    },
    select: {
      amount: true,
      dueDate: true,
    },
  })

  // Fetch incomes for the user
  // Income model uses month/year, so we need to determine which months overlap
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      OR: [
        // Non-recurring: must fall within our range months
        {
          isRecurring: false,
          year: { gte: globalStart.getFullYear(), lte: globalEnd.getFullYear() },
        },
        // Recurring: created on or before the end of our range
        {
          isRecurring: true,
          OR: [
            { year: { lt: globalEnd.getFullYear() } },
            { year: globalEnd.getFullYear(), month: { lte: globalEnd.getMonth() + 1 } },
          ],
        },
      ],
    },
  })

  // Place installments into buckets
  for (const inst of installments) {
    const dueDate = new Date(inst.dueDate)
    const amount = moneyToNumber(inst.amount)

    for (const bucket of buckets) {
      if (dueDate >= bucket.start && dueDate <= bucket.end) {
        bucket.spending += amount
        break
      }
    }
  }

  // Place incomes into buckets
  // For each bucket, find which months it covers, and sum up applicable incomes
  for (const bucket of buckets) {
    const bucketStartMonth = bucket.start.getMonth() + 1
    const bucketStartYear = bucket.start.getFullYear()
    const bucketEndMonth = bucket.end.getMonth() + 1
    const bucketEndYear = bucket.end.getFullYear()

    // Collect all month/year pairs this bucket spans
    const monthYears: Array<{ month: number; year: number }> = []
    let m = bucketStartMonth
    let y = bucketStartYear
    while (y < bucketEndYear || (y === bucketEndYear && m <= bucketEndMonth)) {
      monthYears.push({ month: m, year: y })
      m++
      if (m > 12) {
        m = 1
        y++
      }
    }

    for (const inc of incomes) {
      const incMonth = inc.month
      const incYear = inc.year

      if (inc.isRecurring) {
        // Recurring incomes apply to every month from their creation onwards
        for (const my of monthYears) {
          if (my.year > incYear || (my.year === incYear && my.month >= incMonth)) {
            bucket.income += moneyToNumber(inc.amount)
          }
        }
      } else {
        // One-time incomes only apply to their specific month/year
        for (const my of monthYears) {
          if (my.month === incMonth && my.year === incYear) {
            bucket.income += moneyToNumber(inc.amount)
          }
        }
      }
    }
  }

  // Round and compute net
  const response = buckets.map(b => ({
    label: b.label,
    income: Math.round(b.income * 100) / 100,
    spending: Math.round(b.spending * 100) / 100,
    net: Math.round((b.income - b.spending) * 100) / 100,
  }))

  return response
})
