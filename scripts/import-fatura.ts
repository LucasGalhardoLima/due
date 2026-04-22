import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

// pdf-parse v2 exports a class-based API
import { PDFParse } from 'pdf-parse'

import { detectBank } from '../server/utils/fatura/detect'
import { cleanupDescriptions } from '../server/utils/fatura/ai-cleanup'
import type { ParsedFatura, CleanedTransaction, DedupMatch } from '../server/utils/fatura/types'

// --- Configuration ---
const API_BASE = process.env.DU_API_URL || 'http://localhost:3000'
const API_KEY = process.env.AGENT_API_KEY || ''
const PDF_DIR = process.argv[2] || './faturas'
const PDF_PASSWORD = process.argv[3] || ''
const CARD_ID = process.argv[4] || ''
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log('=== Du Fatura Import Script ===\n')

  if (!CARD_ID) {
    // Fetch available cards
    const cards = await apiFetch<Array<{ id: string; name: string }>>('/api/cards')
    console.log('Available cards:')
    cards.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.id})`))
    console.log('\nUsage: npx tsx scripts/import-fatura.ts <pdf-dir> <password> <card-id> [--dry-run]')
    process.exit(1)
  }

  // Fetch user categories for AI cleanup
  const categories = await apiFetch<Array<{ id: string; name: string }>>('/api/categories')
  console.log(`Loaded ${categories.length} categories\n`)

  // Find PDF files
  const files = readdirSync(PDF_DIR)
    .filter(f => extname(f).toLowerCase() === '.pdf')
    .sort()

  if (files.length === 0) {
    console.log(`No PDF files found in ${PDF_DIR}`)
    process.exit(1)
  }

  console.log(`Found ${files.length} PDF file(s):\n`)

  // Fetch existing transactions for dedup
  const txResponse = await apiFetch<{ transactions: Array<{
    id: string
    description: string
    amount: number
    purchaseDate: string
  }> }>('/api/admin/transactions?limit=1000')
  const existingTxs = txResponse.transactions

  let totalImported = 0

  for (const file of files) {
    console.log(`\n--- Processing: ${file} ---`)

    const pdfPath = join(PDF_DIR, file)
    const buffer = readFileSync(pdfPath)

    // Extract text from PDF
    let text: string
    try {
      const parser = new PDFParse({ data: buffer, ...(PDF_PASSWORD ? { password: PDF_PASSWORD } : {}) })
      const result = await parser.getText()
      text = result.text
    } catch (err) {
      console.log(`  Error reading PDF: ${err instanceof Error ? err.message : err}`)
      continue
    }

    // Detect bank
    const bankParser = detectBank(text)
    if (!bankParser) {
      console.log('  Could not detect bank format. Skipping.')
      continue
    }
    console.log(`  Detected bank: ${bankParser.bankId}`)

    // Parse transactions
    const result: ParsedFatura = bankParser.parse(text)
    console.log(`  Billing period: ${result.billingPeriod}`)
    console.log(`  Stats: ${result.stats.newPurchases} new, ${result.stats.skippedOngoing} ongoing (skipped), ${result.stats.skippedAdjustments} adjustments (skipped)`)

    if (result.transactions.length === 0) {
      console.log('  No new transactions to import.')
      continue
    }

    // AI cleanup
    console.log('  Cleaning descriptions with AI...')
    const cleaned = await cleanupDescriptions(result.transactions, categories)

    // Dedup check
    const dedupMatches = findDuplicates(cleaned, existingTxs)
    const deduped = cleaned.filter((_, i) => !dedupMatches.find(d => d.transactionIndex === i))

    if (dedupMatches.length > 0) {
      console.log(`\n  Potential duplicates (${dedupMatches.length}):`)
      dedupMatches.forEach(d => {
        const tx = cleaned[d.transactionIndex]!
        console.log(`    - ${tx.cleanDescription} R$${tx.amount.toFixed(2)} ${tx.purchaseDate} ↔ existing: "${d.existingDescription}" R$${d.existingAmount.toFixed(2)}`)
      })
    }

    // Display transactions
    console.log(`\n  Transactions to import (${deduped.length}):`)
    console.log('  ' + '-'.repeat(100))
    console.log(`  ${'Date'.padEnd(12)} ${'Description'.padEnd(35)} ${'Raw'.padEnd(25)} ${'Amount'.padStart(10)} ${'Inst'.padStart(5)} ${'Category'.padEnd(15)}`)
    console.log('  ' + '-'.repeat(100))

    for (const tx of deduped) {
      const instStr = tx.installmentsCount > 1 ? `${tx.installmentsCount}x` : '1x'
      console.log(
        `  ${tx.purchaseDate.padEnd(12)} ${tx.cleanDescription.substring(0, 33).padEnd(35)} ${tx.rawDescription.substring(0, 23).padEnd(25)} ${('R$' + tx.amount.toFixed(2)).padStart(10)} ${instStr.padStart(5)} ${(tx.suggestedCategory || '-').padEnd(15)}`
      )
    }

    if (result.skippedInstallments.length > 0) {
      console.log(`\n  Skipped ongoing installments (${result.skippedInstallments.length}):`)
      for (const s of result.skippedInstallments.slice(0, 5)) {
        console.log(`    - ${s.description} R$${s.amount.toFixed(2)} (${s.installmentNumber}/${s.installmentsTotal})`)
      }
      if (result.skippedInstallments.length > 5) {
        console.log(`    ... and ${result.skippedInstallments.length - 5} more`)
      }
    }

    // Import
    if (DRY_RUN) {
      console.log(`\n  [DRY RUN] Would import ${deduped.length} transactions`)
    } else {
      console.log(`\n  Importing ${deduped.length} transactions...`)
      const payload = deduped.map(tx => ({
        description: tx.cleanDescription,
        amount: tx.amount,
        date: new Date(tx.purchaseDate).toISOString(),
        categoryId: tx.suggestedCategoryId || undefined,
        cardId: CARD_ID,
        installmentsCount: tx.installmentsCount,
      }))

      const res = await apiFetch<{ count: number }>('/api/transactions/batch', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      console.log(`  Imported ${res.count} transactions`)
      totalImported += res.count

      // Add imported transactions to existing list for dedup in subsequent PDFs
      deduped.forEach(tx => {
        existingTxs.push({
          id: 'new',
          description: tx.cleanDescription,
          amount: tx.amount,
          purchaseDate: tx.purchaseDate,
        })
      })
    }
  }

  console.log(`\n=== Done! Total imported: ${totalImported} ===`)
}

function findDuplicates(
  transactions: CleanedTransaction[],
  existing: Array<{ id: string; description: string; amount: number; purchaseDate: string }>
): DedupMatch[] {
  const matches: DedupMatch[] = []

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]!
    const txDate = new Date(tx.purchaseDate).getTime()

    for (const ex of existing) {
      const exDate = new Date(ex.purchaseDate).getTime()
      const dayDiff = Math.abs(txDate - exDate) / (1000 * 60 * 60 * 24)

      // Match on: same amount + within 1 day + description similarity
      if (dayDiff <= 1 && Math.abs(tx.amount - ex.amount) < 0.01) {
        // Check description similarity (substring match in either direction)
        const txDesc = tx.rawDescription.toLowerCase().replace(/[^a-z0-9]/g, '')
        const exDesc = ex.description.toLowerCase().replace(/[^a-z0-9]/g, '')
        const hasSimilarDesc = txDesc.includes(exDesc.slice(0, 5)) ||
          exDesc.includes(txDesc.slice(0, 5)) ||
          txDesc === exDesc

        if (hasSimilarDesc) {
          matches.push({
            transactionIndex: i,
            existingId: ex.id,
            existingDescription: ex.description,
            existingAmount: ex.amount,
            existingDate: ex.purchaseDate,
          })
          break
        }
      }
    }
  }

  return matches
}

async function apiFetch<T>(path: string, options?: { method?: string; body?: string }): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-api-key': API_KEY,
    },
    body: options?.body,
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} — ${await res.text()}`)
  }

  return res.json() as Promise<T>
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
