export interface FaturaParser {
  bankId: string
  detect(rawText: string): boolean
  parse(rawText: string): ParsedFatura
}

export interface ParsedFatura {
  bank: string
  billingPeriod: string // closing date month, e.g. '2026-01'
  transactions: ParsedTransaction[]
  skippedInstallments: SkippedInstallment[]
  stats: ParseStats
}

export interface ParsedTransaction {
  purchaseDate: string // ISO date YYYY-MM-DD
  rawDescription: string
  amount: number // total purchase amount (per-installment * count)
  installmentsCount: number
  bankCategory: string
  city: string
}

export interface SkippedInstallment {
  description: string
  amount: number
  installmentNumber: number
  installmentsTotal: number
}

export interface ParseStats {
  totalLines: number
  newPurchases: number
  skippedOngoing: number
  skippedAdjustments: number
}

export interface CleanedTransaction extends ParsedTransaction {
  cleanDescription: string
  suggestedCategory: string | null
  suggestedCategoryId: string | null
}

export interface DedupMatch {
  transactionIndex: number
  existingId: string
  existingDescription: string
  existingAmount: number
  existingDate: string
}
