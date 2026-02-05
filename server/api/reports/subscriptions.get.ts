import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { differenceInDays } from 'date-fns'
import { moneyToNumber } from '../../utils/money'

interface SubscriptionItem {
  name: string
  amount: number
  last_usage: string | null
  days_inactive: number
  alert?: string
  potential_saving?: number
  recommendation?: string
  status: 'active' | 'inactive' | 'redundant'
}

interface SubscriptionAnalysis {
  active_subscriptions: SubscriptionItem[]
  total_wasted: number
  annual_waste: number
  quick_wins: string[]
}

export default defineEventHandler(async () => {
  // Get all active subscriptions
  const subscriptions = await prisma.transaction.findMany({
    where: {
      isSubscription: true,
      active: true
    },
    orderBy: {
      amount: 'desc'
    }
  })

  // Mock analysis logic for "redundant" services
  // In a real app we'd have a category mapping like "Music" -> [Spotify, Deezer]
  // For now we'll do simple keyword matching
  const categoriesMap: Record<string, string[]> = {
      'Streaming Video': ['netflix', 'disney', 'hbo', 'amazon prime video', 'apple tv', 'paramount', 'globoplay'],
      'Streaming Music': ['spotify', 'deezer', 'apple music', 'tidal', 'youtube music'],
      'Cloud Storage': ['google one', 'icloud', 'dropbox', 'onedrive']
  }

  const analysis: SubscriptionAnalysis = {
    active_subscriptions: [],
    total_wasted: 0,
    annual_waste: 0,
    quick_wins: []
  }

  const foundCategories: Record<string, string[]> = {}

  for (const sub of subscriptions) {
    const daysInactive = sub.lastProcessedDate 
        ? differenceInDays(new Date(), sub.lastProcessedDate)
        : differenceInDays(new Date(), sub.createdAt) // Fallback if never processed

    let status: 'active' | 'inactive' | 'redundant' = 'active'
    let alert: string | undefined
    let recommendation: string | undefined
    let potentialSaving = 0

    // 1. Inactivity Check
    if (daysInactive > 45) {
        status = 'inactive'
        alert = `Você não usa há ${Math.floor(daysInactive / 30)} meses`
        potentialSaving = moneyToNumber(sub.amount)
        recommendation = 'Considere cancelar'
    }

    // 2. Redundancy Check
    const normalizedName = sub.description.toLowerCase()
    let myCat = 'Other'
    
    for (const [catName, keywords] of Object.entries(categoriesMap)) {
        if (keywords.some(k => normalizedName.includes(k))) {
            myCat = catName
            if (!foundCategories[catName]) foundCategories[catName] = []
            foundCategories[catName].push(sub.description)
            break
        }
    }

    if (myCat !== 'Other' && foundCategories[myCat].length > 1) {
        // Only mark the cheaper/smaller ones as redundant? Or warn on all?
        // Let's warn on the second one found
        if (status !== 'inactive') { // Don't double count
            status = 'redundant'
            alert = `Você tem multiplos serviços de ${myCat}`
            potentialSaving = moneyToNumber(sub.amount)
            recommendation = 'Avalie ficar com apenas um'
        }
    }

    if (potentialSaving > 0) {
        analysis.total_wasted += potentialSaving
        analysis.annual_waste += potentialSaving * 12
        analysis.quick_wins.push(`Cancele ${sub.description} → +R$ ${potentialSaving.toFixed(0)}/mês`)
    }

    analysis.active_subscriptions.push({
        name: sub.description,
        amount: moneyToNumber(sub.amount),
        last_usage: sub.lastProcessedDate ? sub.lastProcessedDate.toISOString() : null,
        days_inactive: daysInactive,
        alert,
        potential_saving: potentialSaving > 0 ? potentialSaving : undefined,
        recommendation,
        status
    })
  }

  return analysis
})
