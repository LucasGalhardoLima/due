/**
 * Reimport Fatura Script
 *
 * Deletes all existing transactions on Lucas's Itaú card and reimports
 * from PDF faturas, capturing ALL lines (including ongoing installments
 * and adjustments) so dashboard totals match the fatura totals exactly.
 *
 * Uses hybrid dual-extraction approach:
 * 1. Full-width with original splitColumns (captures left column well + some right)
 * 2. Right-column extraction at x=320 (captures right-only transactions)
 * 3. Deduplication merges both without double-counting
 *
 * Usage:
 *   npx tsx scripts/reimport-fatura.ts <pdf-dir> <password> [--dry-run] [--skip-ai]
 */
import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'
import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { join, extname } from 'path'
import { addMonths } from 'date-fns'
import { generateObject } from 'ai'
import { z } from 'zod'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
    ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}connection_limit=1&pool_timeout=60&connect_timeout=60`
    : undefined,
})

// --- Configuration ---
const LUCAS_USER = 'user_39FiYOQiVIsqrFyd0Wf67iM8sCU'
const ITAU_CARD = 'e9c26d29-7220-4ddf-b54f-c2b1daf653f3'
const DUE_DAY = 20

const PDF_DIR = process.argv[2] || './faturas'
const PDF_PASSWORD = process.argv[3] || ''
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_AI = process.argv.includes('--skip-ai')

// --- Types ---
interface FaturaLine {
  purchaseDate: string
  rawDescription: string
  amount: number
  isNegative: boolean
  installmentNumber: number   // 1 for first or single, N for ongoing
  installmentsTotal: number   // total installments (1 for single)
}

interface ParsedFaturaResult {
  billingPeriod: string
  dueDate: string
  lines: FaturaLine[]
  pdfTotal: number
}

// --- Text extraction ---
function extractFullText(pdfPath: string, password: string): string {
  const pwFlag = password ? `-opw ${password}` : ''
  try {
    return execSync(`pdftotext -layout ${pwFlag} "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  } catch {
    return execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  }
}

function extractRightColumn(pdfPath: string, password: string): string {
  const pwFlag = password ? `-opw ${password}` : ''
  try {
    return execSync(`pdftotext -layout -x 320 -y 0 -W 276 -H 842 ${pwFlag} "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  } catch {
    return execSync(`pdftotext -layout -x 320 -y 0 -W 276 -H 842 "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  }
}

/**
 * Original splitColumns from itau-parser.ts — proven and well-tested.
 * Splits two-column lines using conservative regex patterns.
 */
function splitColumns(text: string): string {
  return text.split('\n').flatMap(line => {
    // Split when 3+ spaces followed by DD/MM + letter (real transaction, not installment suffix)
    const dateSplit = line.match(/^(.+\S)\s{3,}(\d{2}\/\d{2}\s+[A-Za-z*].+)$/)
    if (dateSplit) return [dateSplit[1]!, dateSplit[2]!]

    // Split when 6+ spaces between two category patterns
    const catSplit = line.match(/^(.+\.[A-Za-zÀ-ú\s]*)\s{6,}([A-ZÀ-Ú][A-ZÀ-Ú\s&]+\..*)$/)
    if (catSplit) return [catSplit[1]!, catSplit[2]!]

    // Split when 6+ spaces before a section header or info block
    const hdrSplit = line.match(/^(.+\S)\s{6,}((?:LUCAS|DATA|Lançamentos|Total|Compras|Limites?|Continua|Pagamento|Saldo|Encargo|Novo teto|Parcelas|Previsão|Consulte|Valor em|Crédito|Simulação|PC -|Caso você).+)$/)
    if (hdrSplit) return [hdrSplit[1]!, hdrSplit[2]!]

    return [line]
  }).join('\n')
}

// --- Parsing ---
function extractBillingPeriod(text: string): string {
  const closingMatch = text.match(/Fechamento:\s*(\d{2})\/(\d{2})\/(\d{4})/)
  if (closingMatch) {
    let month = parseInt(closingMatch[2]!) - 1
    let year = parseInt(closingMatch[3]!)
    if (month === 0) { month = 12; year-- }
    return `${year}-${month.toString().padStart(2, '0')}`
  }
  const emissaoMatch = text.match(/Emissão:\s*(\d{2})\/(\d{2})\/(\d{4})/)
  if (emissaoMatch) return `${emissaoMatch[3]}-${emissaoMatch[2]}`
  return 'unknown'
}

function extractVencimentoDate(text: string): string | undefined {
  const match = text.match(/Vencimento:\s*(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return undefined
}

function billingPeriodToDueDate(bp: string): string {
  const [yearStr, monthStr] = bp.split('-')
  let month = parseInt(monthStr!) + 1
  let year = parseInt(yearStr!)
  if (month > 12) { month = 1; year++ }
  return `${year}-${month.toString().padStart(2, '0')}-${DUE_DAY.toString().padStart(2, '0')}`
}

function extractPdfTotal(text: string): number {
  // Use "Total dos lançamentos atuais" — the actual charges in this period.
  // "Total desta fatura" may differ if there's a carried-over credit (Saldo financiado).
  const lancMatch = text.match(/L\s*Total dos lançamentos atuais\s+([\d.,]+)/)
  if (lancMatch) return parseFloat(lancMatch[1]!.replace(/\./g, '').replace(',', '.'))
  // Fallback to "Total desta fatura"
  const match = text.match(/=\s*Total desta fatura\s+([\d.,]+)/)
  if (match) return parseFloat(match[1]!.replace(/\./g, '').replace(',', '.'))
  return 0
}

function resolveDate(dateStr: string, billingYear: number, billingMonth: number): string {
  const [dayStr, monthStr] = dateStr.split('/')
  const day = parseInt(dayStr!)
  const month = parseInt(monthStr!) - 1
  let year = billingYear
  if (month > billingMonth) year = billingYear - 1
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * Parse transaction lines from text WITH section tracking.
 * Used for the full-width text (which includes summary/payment lines that must be skipped).
 */
function parseWithSections(text: string, billingYear: number, billingMonth: number): FaturaLine[] {
  const results: FaturaLine[] = []
  const cleanedText = text.replace(
    /Compras parceladas - próximas faturas[\s\S]*?(?=Limites de crédito|Novo teto|Encargos cobrados|$)/g,
    ''
  )

  let inSection = false
  for (const line of cleanedText.split('\n')) {
    const trimmed = line.trim()

    // Section entry — must START with the keyword to avoid false matches
    // from unsplit two-column lines (e.g., "30/11  Amazon Kindle  19,90     DATA ESTABELECIMENTO...")
    if (trimmed.startsWith('DATA ESTABELECIMENTO') ||
        trimmed.startsWith('Lançamentos: compras e saques') ||
        trimmed.startsWith('Lançamentos internacionais') ||
        trimmed.startsWith('Lançamentos: produtos e servi')) {
      inSection = true
      continue
    }

    // Section exit
    if (trimmed.startsWith('Lançamentos no cartão') || trimmed.startsWith('Total transações') ||
        trimmed.startsWith('Total lançamentos') ||
        trimmed.startsWith('Limites de crédito') || trimmed.startsWith('Encargos cobrados') ||
        trimmed.startsWith('Novo teto') || trimmed.startsWith('Compras parceladas')) {
      inSection = false
      continue
    }

    // Capture "Repasse de IOF em R$ XX,XX" — appears without date, outside sections
    const iofMatch = trimmed.match(/Repasse de IOF em R\$\s+([\d.,]+)/)
    if (iofMatch) {
      const amt = parseFloat(iofMatch[1].replace(/\./g, '').replace(',', '.'))
      if (amt > 0) {
        // Use last day of billing period as purchase date
        const closingDay = 14
        const purchaseDate = `${billingYear}-${(billingMonth + 1).toString().padStart(2, '0')}-${closingDay.toString().padStart(2, '0')}`
        results.push({
          purchaseDate,
          rawDescription: 'Repasse de IOF',
          amount: amt,
          isNegative: false,
          installmentNumber: 1,
          installmentsTotal: 1,
        })
      }
      continue
    }

    if (!inSection) continue
    if (trimmed.includes('PAGAMENTO EFETUADO')) continue

    const parsed = parseSingleLine(trimmed, billingYear, billingMonth)
    if (parsed) results.push(parsed)
  }

  return results
}

/**
 * Parse transaction lines WITHOUT section tracking.
 * Used for the right-column extraction (clean, no summary lines).
 */
function parseWithoutSections(text: string, billingYear: number, billingMonth: number): FaturaLine[] {
  const results: FaturaLine[] = []
  const cleanedText = text.replace(
    /Compras parceladas - próximas faturas[\s\S]*?(?=Limites de crédito|Novo teto|Encargos cobrados|$)/g,
    ''
  )

  for (const line of cleanedText.split('\n')) {
    const trimmed = line.trim()
    // Skip known non-transaction lines
    if (trimmed.includes('PAGAMENTO EFETUADO') || trimmed.includes('Total') ||
        trimmed.includes('DATA ESTABELECIMENTO') || trimmed.includes('Lançamentos') ||
        trimmed.includes('LUCAS G LIMA') || trimmed.includes('Limites') ||
        trimmed.includes('Encargos') || trimmed.includes('Compras parceladas') ||
        trimmed.includes('Novo teto') || trimmed.includes('Valor em reais') ||
        trimmed.includes('Saldo financiado') || trimmed.includes('Black') ||
        trimmed.includes('Resumo') || trimmed.includes('Postagem') ||
        trimmed.includes('Vencimento') || trimmed.includes('Emissão') ||
        trimmed.includes('Previsão')) {
      continue
    }

    const parsed = parseSingleLine(trimmed, billingYear, billingMonth)
    if (parsed) results.push(parsed)
  }

  return results
}

function parseSingleLine(trimmed: string, billingYear: number, billingMonth: number): FaturaLine | null {
  // Match: DD/MM  description  [2+ spaces]  [-] amount (Brazilian XX,XX format)
  // NO $ anchor — grab the FIRST amount, not the last. Two-column lines have
  // right-column amounts (credit limits, subtotals) appended that we must ignore.
  const txMatch = trimmed.match(/^(\d{2}\/\d{2})\s+(.+?)\s{2,}(-\s*)?(\d[\d.]*,\d{2})\b/)
  if (!txMatch) return null

  const [, dateStr, descPart, negSign, amountStr] = txMatch
  const rawAmount = parseFloat(amountStr!.replace(/\./g, '').replace(',', '.'))
  if (isNaN(rawAmount) || rawAmount === 0) return null

  const isNegative = !!negSign
  const amount = isNegative ? -rawAmount : rawAmount
  const purchaseDate = resolveDate(dateStr!, billingYear, billingMonth)

  let rawDescription = descPart!.trim()
  let installmentNumber = 1
  let installmentsTotal = 1

  // Extract installment suffix (e.g. "01/10") BEFORE stripping it
  const installmentMatch = rawDescription.match(/\s*\S?(\d{2})\/(\d{2})\s*$/)
  if (installmentMatch) {
    installmentNumber = parseInt(installmentMatch[1]!)
    installmentsTotal = parseInt(installmentMatch[2]!)
    rawDescription = rawDescription.replace(/\s*\S?\d{2}\/\d{2}\s*$/, '').trim()
  }

  return { purchaseDate, rawDescription, amount, isNegative, installmentNumber, installmentsTotal }
}

function deduplicateLines(main: FaturaLine[], extra: FaturaLine[]): FaturaLine[] {
  const all = [...main]
  const used = new Set<number>() // one-to-one matching: each main entry can only match one extra
  for (const r of extra) {
    const matchIdx = all.findIndex((l, i) =>
      !used.has(i) &&
      l.purchaseDate === r.purchaseDate &&
      Math.abs(l.amount - r.amount) < 0.01 &&
      l.rawDescription.toLowerCase().slice(0, 8) === r.rawDescription.toLowerCase().slice(0, 8)
    )
    if (matchIdx >= 0) {
      used.add(matchIdx)
    } else {
      all.push(r)
    }
  }
  return all
}

function getPageCount(pdfPath: string, password: string): number {
  const info = execSync(`pdfinfo ${password ? `-opw ${password}` : ''} "${pdfPath}" 2>&1`, { encoding: 'utf-8' })
  const match = info.match(/Pages:\s+(\d+)/)
  return parseInt(match?.[1] || '0')
}

function extractColumnText(pdfPath: string, password: string, page: number, x: number, w: number): string {
  const pwFlag = password ? `-opw ${password}` : ''
  try {
    return execSync(`pdftotext -layout -f ${page} -l ${page} -x ${x} -y 0 -W ${w} -H 842 ${pwFlag} "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  } catch {
    return ''
  }
}

function parseFatura(pdfPath: string, password: string): ParsedFaturaResult {
  const rawText = extractFullText(pdfPath, password)
  const billingPeriod = extractBillingPeriod(rawText)
  const pdfTotal = extractPdfTotal(rawText)
  // Prefer actual vencimento from PDF over calculated date
  const vencimento = extractVencimentoDate(rawText)
  const dueDate = vencimento || billingPeriodToDueDate(billingPeriod)

  const billingYear = parseInt(billingPeriod.split('-')[0]!)
  const billingMonth = parseInt(billingPeriod.split('-')[1]!) - 1
  const pageCount = getPageCount(pdfPath, password)

  // Per-page, per-column extraction with independent section tracking.
  // Left column (x=0, W=350): includes amounts at ~x=280-340
  // Right column (x=350, W=250): starts after left column amounts
  const lines: FaturaLine[] = []

  for (let page = 1; page <= pageCount; page++) {
    const leftText = extractColumnText(pdfPath, password, page, 0, 350)
    const rightText = extractColumnText(pdfPath, password, page, 350, 250)

    lines.push(...parseWithSections(leftText, billingYear, billingMonth))
    lines.push(...parseWithSections(rightText, billingYear, billingMonth))
  }

  return { billingPeriod, dueDate, lines, pdfTotal }
}

// --- Main ---
async function main() {
  console.log('=== Du Fatura Reimport Script ===\n')

  const files = readdirSync(PDF_DIR)
    .filter(f => extname(f).toLowerCase() === '.pdf')
    .sort()

  if (files.length === 0) {
    console.log(`No PDF files found in ${PDF_DIR}`)
    process.exit(1)
  }

  console.log(`Found ${files.length} PDF file(s)`)

  const categories = await prisma.category.findMany({
    where: { userId: LUCAS_USER },
    orderBy: { name: 'asc' },
  })
  console.log(`Categories: ${categories.map(c => c.name).join(', ')}`)

  // Step 1: Parse all PDFs
  const allFaturas: ParsedFaturaResult[] = []
  for (const file of files) {
    console.log(`--- Parsing: ${file} ---`)
    const pdfPath = join(PDF_DIR, file)
    const result = parseFatura(pdfPath, PDF_PASSWORD)

    const positiveLines = result.lines.filter(l => !l.isNegative)
    const negativeLines = result.lines.filter(l => l.isNegative)
    const multiInstallment = positiveLines.filter(l => l.installmentsTotal > 1 && l.installmentNumber === 1)
    const ongoingInstallment = result.lines.filter(l => l.installmentNumber > 1)

    const positiveTotal = positiveLines.reduce((s, l) => s + l.amount, 0)
    const negativeTotal = negativeLines.reduce((s, l) => s + l.amount, 0)
    const capturedTotal = positiveTotal + negativeTotal
    const gap = result.pdfTotal - capturedTotal
    const gapPct = result.pdfTotal > 0 ? (gap / result.pdfTotal * 100) : 0

    console.log(`  Billing period: ${result.billingPeriod} (due ${result.dueDate})`)
    console.log(`  PDF Total: R$ ${result.pdfTotal.toFixed(2)}`)
    console.log(`  Captured:  R$ ${capturedTotal.toFixed(2)} (${result.lines.length} lines: ${positiveLines.length}+ ${negativeLines.length}-)`)
    console.log(`  Installments: ${multiInstallment.length} first (01/XX), ${ongoingInstallment.length} ongoing (NN>1/XX)`)
    console.log(`  Gap: R$ ${gap.toFixed(2)} (${gapPct.toFixed(1)}%)`)

    allFaturas.push(result)
  }

  // Step 2: Annotate all lines with fatura context
  interface AnnotatedLine extends FaturaLine {
    faturaDueDate: string
    faturaBillingPeriod: string
    lineIndex: number
  }

  let lineIdx = 0
  const allAnnotated: AnnotatedLine[] = allFaturas.flatMap(f =>
    f.lines.map(l => ({ ...l, faturaDueDate: f.dueDate, faturaBillingPeriod: f.billingPeriod, lineIndex: lineIdx++ }))
  )

  const positiveAnnotated = allAnnotated.filter(l => !l.isNegative)
  const negativeAnnotated = allAnnotated.filter(l => l.isNegative)
  const installmentLines = positiveAnnotated.filter(l => l.installmentsTotal > 1)
  const singleLines = positiveAnnotated.filter(l => l.installmentsTotal === 1)

  console.log(`\n  Total lines: ${allAnnotated.length} (${positiveAnnotated.length}+ ${negativeAnnotated.length}-)`)
  console.log(`  Installment lines: ${installmentLines.length} (across multiple faturas)`)
  console.log(`  Single lines: ${singleLines.length}`)

  // Step 3: AI Grouping + Cleanup
  console.log('\n--- AI Grouping + Cleanup ---')

  const categoryNames = categories.map(c => c.name).join(', ')

  // Build the AI grouping schema
  const groupingSchema = z.object({
    groups: z.array(z.object({
      groupId: z.number(),
      cleanDescription: z.string(),
      suggestedCategory: z.string(),
      lineIndices: z.array(z.number()),
    }))
  })

  interface AIGroup {
    groupId: number
    cleanDescription: string
    suggestedCategory: string
    lineIndices: number[]
  }

  let allGroups: AIGroup[] = []

  if (SKIP_AI) {
    console.log('  [SKIP_AI] Using deterministic fallback grouping...')

    // Deterministic fallback: group installment lines by exact description + amount + total
    const installmentGroups = new Map<string, number[]>()
    for (const line of installmentLines) {
      const key = `${line.rawDescription.toLowerCase()}|${line.amount.toFixed(2)}|${line.installmentsTotal}`
      const group = installmentGroups.get(key) || []
      group.push(line.lineIndex)
      installmentGroups.set(key, group)
    }

    let gid = 1
    for (const [, indices] of installmentGroups) {
      const line = allAnnotated[indices[0]!]!
      allGroups.push({
        groupId: gid++,
        cleanDescription: line.rawDescription,
        suggestedCategory: 'Outro',
        lineIndices: indices,
      })
    }

    // Singles and negatives as individual groups
    for (const line of [...singleLines, ...negativeAnnotated]) {
      allGroups.push({
        groupId: gid++,
        cleanDescription: line.rawDescription,
        suggestedCategory: 'Outro',
        lineIndices: [line.lineIndex],
      })
    }
  } else {
    // AI grouping: send installment lines for grouping, singles/negatives for cleanup only
    console.log(`  Grouping ${installmentLines.length} installment lines via AI...`)

    try {
      let model
      if (process.env.ANTHROPIC_API_KEY) {
        const { createAnthropic } = await import('@ai-sdk/anthropic')
        const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        model = anthropic('claude-sonnet-4-20250514')
      } else {
        const { gateway } = await import('../server/utils/ai')
        model = gateway('gpt-4o-mini')
      }

      // Batch installment lines by installmentsTotal for smaller AI calls
      const byTotal = new Map<number, AnnotatedLine[]>()
      for (const line of installmentLines) {
        const group = byTotal.get(line.installmentsTotal) || []
        group.push(line)
        byTotal.set(line.installmentsTotal, group)
      }

      let batchNum = 0
      const totalBatches = byTotal.size
      for (const [instTotal, batchLines] of byTotal) {
        batchNum++
        const batchInput = batchLines.map(l =>
          `[${l.lineIndex}] ${l.faturaDueDate} | "${l.rawDescription}" | R$${l.amount.toFixed(2)} | ${l.installmentNumber}/${l.installmentsTotal}`
        ).join('\n')

        const groupingPrompt = `You are a financial data analyst. You have credit card installment lines extracted from multiple Brazilian Itaú faturas (bills). All lines below are ${instTotal}-installment purchases.

Each line represents one installment payment from a specific fatura month. Lines from the SAME purchase will:
- Have similar descriptions (but may have formatting differences like "EC *LGELECTRONICS" vs "EC*LG ELECTRONICS" — these are the same)
- Have the EXACT SAME amount (credit card installments are always the same amount per month — no rounding differences)
- Appear in sequential monthly faturas

CRITICAL RULE: Two lines with the same description and installment count but DIFFERENT amounts are DIFFERENT purchases. Never group them together.

Group these installment lines by purchase. Each group = one parcelamento (installment plan).

Also for each group:
1. Clean the description into a human-readable name (e.g., "EC *LGELECTRONICS" → "LG Electronics", "RAIA182 -CT" → "Droga Raia")
2. Suggest the best category from: ${categoryNames}. Always pick the closest match — use "Outro" if nothing else fits.

INSTALLMENT LINES:
${batchInput}

Return groups where lineIndices contains the [index] numbers from above.`

        const { object: groupResult } = await generateObject({
          model,
          schema: groupingSchema,
          prompt: groupingPrompt,
        })

        allGroups.push(...groupResult.groups)
        console.log(`    Batch ${batchNum}/${totalBatches} (${instTotal}x): ${groupResult.groups.length} groups from ${batchLines.length} lines`)
      }

      console.log(`  AI returned ${allGroups.length} installment groups total`)
    } catch (err: any) {
      console.error('  AI grouping failed:', err?.message || String(err))
      console.log('  Falling back to deterministic grouping...')

      const installmentGroups = new Map<string, number[]>()
      for (const line of installmentLines) {
        const key = `${line.rawDescription.toLowerCase()}|${line.amount.toFixed(2)}|${line.installmentsTotal}`
        const group = installmentGroups.get(key) || []
        group.push(line.lineIndex)
        installmentGroups.set(key, group)
      }
      let gid = 1
      for (const [, indices] of installmentGroups) {
        const line = allAnnotated[indices[0]!]!
        allGroups.push({
          groupId: gid++,
          cleanDescription: line.rawDescription,
          suggestedCategory: 'Outro',
          lineIndices: indices,
        })
      }
    }

    // Now clean singles + negatives descriptions (no grouping needed, just cleanup)
    console.log(`  Cleaning ${singleLines.length + negativeAnnotated.length} single/negative descriptions...`)

    let cleanupModel
    if (process.env.ANTHROPIC_API_KEY) {
      const { createAnthropic } = await import('@ai-sdk/anthropic')
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      cleanupModel = anthropic('claude-haiku-4-5-20251001')
    } else {
      const { gateway } = await import('../server/utils/ai')
      cleanupModel = gateway('gpt-4o-mini')
    }

    const CLEANUP_BATCH = 80
    const allSingleNeg = [...singleLines, ...negativeAnnotated]
    let nextGid = allGroups.length + 1
    const totalCleanupBatches = Math.ceil(allSingleNeg.length / CLEANUP_BATCH)

    for (let i = 0; i < allSingleNeg.length; i += CLEANUP_BATCH) {
      const batch = allSingleNeg.slice(i, i + CLEANUP_BATCH)
      const batchInput = batch.map(l =>
        `[${l.lineIndex}] "${l.rawDescription}" | R$${l.amount.toFixed(2)}`
      ).join('\n')

      const cleanupSchema = z.object({
        results: z.array(z.object({
          index: z.number(),
          cleanDescription: z.string(),
          suggestedCategory: z.string(),
        }))
      })

      try {
        const { object: cleanResult } = await generateObject({
          model: cleanupModel,
          schema: cleanupSchema,
          prompt: `You are a financial assistant. Clean these credit card transaction descriptions from Brazilian Itaú bank into human-readable names, and suggest a category for each.

For each transaction:
1. Transform cryptic descriptions into readable names (e.g., "RAIA182 -CT" → "Droga Raia", "MC DONALD S -CT" → "McDonald's")
2. Suggest the best category from: ${categoryNames}. Always pick the closest match — use "Outro" if nothing else fits.

TRANSACTIONS:
${batchInput}

Return results where "index" is the number in brackets [N] from each line above.`,
        })

        // Map AI results back to actual lines by matching index to lineIndex
        const resultMap = new Map(cleanResult.results.map(r => [r.index, r]))
        for (let j = 0; j < batch.length; j++) {
          const line = batch[j]!
          // Try matching by lineIndex, fall back to positional
          const aiResult = resultMap.get(line.lineIndex) || cleanResult.results[j]
          allGroups.push({
            groupId: nextGid++,
            cleanDescription: aiResult?.cleanDescription || line.rawDescription,
            suggestedCategory: aiResult?.suggestedCategory || 'Outro',
            lineIndices: [line.lineIndex],
          })
        }
      } catch (err: any) {
        console.error(`    Batch ${Math.floor(i / CLEANUP_BATCH) + 1} failed: ${err?.message || String(err)}`)
        for (const line of batch) {
          allGroups.push({
            groupId: nextGid++,
            cleanDescription: line.rawDescription,
            suggestedCategory: 'Outro',
            lineIndices: [line.lineIndex],
          })
        }
      }

      console.log(`    Cleanup batch ${Math.floor(i / CLEANUP_BATCH) + 1}/${totalCleanupBatches} done`)
    }
  }

  // Step 4: Validate AI output
  console.log('\n--- Validating AI Groups ---')

  const allAssignedIndices = allGroups.flatMap(g => g.lineIndices)
  const expectedIndices = new Set(allAnnotated.map(l => l.lineIndex))
  const assignedSet = new Set(allAssignedIndices)

  // Fix: remove duplicates — keep only the first occurrence of each lineIndex
  const seenIndices = new Set<number>()
  let duplicatesRemoved = 0
  for (const group of allGroups) {
    const dedupedIndices = group.lineIndices.filter(idx => {
      if (seenIndices.has(idx)) {
        duplicatesRemoved++
        return false
      }
      seenIndices.add(idx)
      return true
    })
    group.lineIndices = dedupedIndices
  }
  // Remove empty groups after dedup
  const preDedup = allGroups.length
  const emptyRemoved = allGroups.filter(g => g.lineIndices.length === 0).length
  allGroups.splice(0, allGroups.length, ...allGroups.filter(g => g.lineIndices.length > 0))
  if (duplicatesRemoved > 0) console.log(`  Fixed: ${duplicatesRemoved} duplicate line assignments removed (${emptyRemoved} empty groups dropped)`)

  // Check: no missing lines
  const missing = [...expectedIndices].filter(i => !assignedSet.has(i))
  if (missing.length > 0) {
    console.log(`  WARNING: ${missing.length} lines not assigned to any group — adding as singles`)
    let gid = allGroups.length + 1
    for (const idx of missing) {
      const line = allAnnotated[idx]!
      allGroups.push({
        groupId: gid++,
        cleanDescription: line.rawDescription,
        suggestedCategory: 'Outro',
        lineIndices: [idx],
      })
    }
  }

  // Check: within each multi-line group, amounts must be identical and installmentsTotals must match
  const installmentGroups = allGroups.filter(g => g.lineIndices.length > 1)
  let validGroups = 0
  let invalidGroups = 0
  for (const group of installmentGroups) {
    const lines = group.lineIndices.map(i => allAnnotated[i]!)
    const amounts = new Set(lines.map(l => l.amount.toFixed(2)))
    const totals = new Set(lines.map(l => l.installmentsTotal))
    if (amounts.size > 1 || totals.size > 1) {
      console.log(`  WARNING: Group "${group.cleanDescription}" has mismatched amounts/totals — splitting`)
      invalidGroups++
      // Split into individual entries
      const splitGroups = group.lineIndices.map(idx => ({
        groupId: allGroups.length + 1,
        cleanDescription: group.cleanDescription,
        suggestedCategory: group.suggestedCategory,
        lineIndices: [idx],
      }))
      // Remove the bad group and add split ones
      const gIdx = allGroups.indexOf(group)
      allGroups.splice(gIdx, 1, ...splitGroups)
    } else {
      validGroups++
    }
  }

  const singleGroups = allGroups.filter(g => g.lineIndices.length === 1)
  console.log(`  Valid installment groups: ${validGroups}`)
  if (invalidGroups > 0) console.log(`  Invalid groups (split): ${invalidGroups}`)
  console.log(`  Single-line groups: ${singleGroups.length}`)
  console.log(`  Total groups: ${allGroups.length}`)

  // Step 5: Categorize groups
  const catCounts: Record<string, number> = {}
  for (const group of allGroups) {
    const cat = group.suggestedCategory
    catCounts[cat] = (catCounts[cat] || 0) + group.lineIndices.length
  }
  console.log('\n--- Category Distribution ---')
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`))

  // Synthetic parent report
  const syntheticParents = installmentGroups.filter(g => {
    const lines = g.lineIndices.map(i => allAnnotated[i]!)
    return !lines.some(l => l.installmentNumber === 1)
  })
  if (syntheticParents.length > 0) {
    console.log(`\n--- Synthetic Parents (no 01/XX in data) ---`)
    for (const g of syntheticParents) {
      const lines = g.lineIndices.map(i => allAnnotated[i]!).sort((a, b) => a.installmentNumber - b.installmentNumber)
      const first = lines[0]!
      const installmentNums = lines.map(l => `${l.installmentNumber}/${l.installmentsTotal}`).join(', ')
      console.log(`  ${g.cleanDescription} ${first.installmentsTotal}x R$${first.amount.toFixed(2)} (had: ${installmentNums})`)
    }
  }

  const totalAll = allAnnotated.length
  console.log(`\n--- TOTAL: ${totalAll} lines → ${allGroups.length} groups (${installmentGroups.length} parcelamentos, ${singleGroups.length} singles) ---`)

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would delete existing Itaú card data and import all transactions')
    await prisma.$disconnect()
    return
  }

  // Step 6: Delete existing Itaú card data
  console.log('\n--- Deleting existing Itaú card data ---')
  const existingCount = await prisma.transaction.count({
    where: { userId: LUCAS_USER, cardId: ITAU_CARD },
  })
  console.log(`  Deleting ${existingCount} existing transactions + installments...`)

  await prisma.installment.deleteMany({
    where: { transaction: { userId: LUCAS_USER, cardId: ITAU_CARD } },
  })
  await prisma.transaction.deleteMany({
    where: { userId: LUCAS_USER, cardId: ITAU_CARD },
  })
  console.log('  Done.')

  // Step 7: Import transactions from groups
  console.log('\n--- Importing transactions ---')
  const outroCategory = categories.find(c => c.name === 'Outro')!

  // Find latest fatura due date — only generate future installments beyond this
  const faturaDueDates = allFaturas.map(f => new Date(f.dueDate + 'T03:00:00Z'))
  const firstFaturaDue = faturaDueDates.reduce((a, b) => a < b ? a : b)
  const lastFaturaDue = faturaDueDates.reduce((a, b) => a > b ? a : b)

  let imported = 0
  let importedParcelamentos = 0
  let importedSingles = 0
  let importedNegatives = 0
  let generatedFuture = 0
  let createCount = 0

  async function reconnectIfNeeded() {
    createCount++
    if (createCount % 150 === 0) {
      await prisma.$disconnect()
      await prisma.$connect()
    }
  }

  for (const group of allGroups) {
    const lines = group.lineIndices.map(i => allAnnotated[i]!).sort((a, b) => a.installmentNumber - b.installmentNumber)
    const first = lines[0]!
    const catId = categories.find(c => c.name.toLowerCase() === group.suggestedCategory.toLowerCase())?.id || outroCategory.id

    if (lines.length > 1 || first.installmentsTotal > 1) {
      // Multi-installment group (parcelamento)
      const installmentsTotal = first.installmentsTotal
      const perInstallmentAmount = first.amount
      const totalAmount = Math.round(perInstallmentAmount * installmentsTotal * 100) / 100

      // Determine first installment due date
      let firstDueDate: Date
      const line01 = lines.find(l => l.installmentNumber === 1)
      if (line01) {
        // We have the parent — use its fatura due date
        firstDueDate = new Date(line01.faturaDueDate + 'T03:00:00Z')
      } else {
        // Synthetic: back-calculate from earliest available installment
        const earliest = lines[0]!
        firstDueDate = addMonths(new Date(earliest.faturaDueDate + 'T03:00:00Z'), -(earliest.installmentNumber - 1))
      }

      // Determine purchase date
      const purchaseDate = line01
        ? new Date(line01.purchaseDate + 'T03:00:00Z')
        : addMonths(firstDueDate, -1) // approximate: ~1 month before first installment

      // Build installment data: actual fatura lines + generated for missing months
      const installmentData: { number: number; amount: Prisma.Decimal; dueDate: Date }[] = []
      const coveredNumbers = new Set(lines.map(l => l.installmentNumber))

      // From actual fatura data
      for (const line of lines) {
        installmentData.push({
          number: line.installmentNumber,
          amount: new Prisma.Decimal(line.amount.toFixed(2)),
          dueDate: new Date(line.faturaDueDate + 'T03:00:00Z'),
        })
      }

      // Generated: only installments OUTSIDE our fatura coverage window.
      // For months where we have faturas, trust the PDF — if an installment
      // doesn't appear, it genuinely isn't in that billing cycle.
      for (let n = 1; n <= installmentsTotal; n++) {
        if (!coveredNumbers.has(n)) {
          const dueDate = addMonths(firstDueDate, n - 1)
          // Only generate if before first fatura or after last fatura
          const isBeforeCoverage = dueDate < firstFaturaDue
          const isAfterCoverage = dueDate > lastFaturaDue
          if (isBeforeCoverage || isAfterCoverage) {
            installmentData.push({
              number: n,
              amount: new Prisma.Decimal(perInstallmentAmount.toFixed(2)),
              dueDate,
            })
            generatedFuture++
          }
        }
      }

      installmentData.sort((a, b) => a.number - b.number)

      await prisma.transaction.create({
        data: {
          userId: LUCAS_USER,
          card: { connect: { id: ITAU_CARD } },
          description: group.cleanDescription || first.rawDescription,
          amount: new Prisma.Decimal(totalAmount.toFixed(2)),
          purchaseDate,
          installmentsCount: installmentsTotal,
          category: { connect: { id: catId } },
          installments: { createMany: { data: installmentData } },
        },
      })
      importedParcelamentos++
    } else {
      // Single transaction (one-time purchase or negative)
      const line = first
      const isNeg = line.isNegative

      await prisma.transaction.create({
        data: {
          userId: LUCAS_USER,
          card: { connect: { id: ITAU_CARD } },
          description: group.cleanDescription || line.rawDescription,
          amount: new Prisma.Decimal(line.amount.toFixed(2)),
          purchaseDate: new Date(line.purchaseDate + 'T03:00:00Z'),
          installmentsCount: 1,
          category: { connect: { id: isNeg ? outroCategory.id : catId } },
          installments: {
            create: { number: 1, amount: new Prisma.Decimal(line.amount.toFixed(2)), dueDate: new Date(line.faturaDueDate + 'T03:00:00Z') },
          },
        },
      })
      if (isNeg) importedNegatives++
      else importedSingles++
    }

    imported++
    await reconnectIfNeeded()
  }

  console.log(`  Parcelamentos: ${importedParcelamentos} (${generatedFuture} future installments generated)`)
  console.log(`  Singles: ${importedSingles}`)
  console.log(`  Negatives: ${importedNegatives}`)

  // Step 8: Verify — per-fatura, DB installments due that month vs PDF total
  await prisma.$disconnect()
  await prisma.$connect()
  console.log('\n--- Verification ---')
  for (const fatura of allFaturas) {
    const dueDateObj = new Date(fatura.dueDate + 'T03:00:00.000Z')
    const monthStart = new Date(dueDateObj)
    monthStart.setUTCDate(1)
    const monthEnd = new Date(dueDateObj)
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)
    monthEnd.setUTCDate(0)

    const installments = await prisma.installment.findMany({
      where: {
        transaction: { userId: LUCAS_USER, cardId: ITAU_CARD },
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true },
    })

    const dbTotal = installments.reduce((s, i) => s + Number(i.amount), 0)
    const diff = Math.abs(dbTotal - fatura.pdfTotal)
    const status = diff < 1 ? '✓' : `≈ (diff: R$ ${diff.toFixed(2)})`
    console.log(`  ${fatura.billingPeriod}: DB R$ ${dbTotal.toFixed(2)} vs PDF R$ ${fatura.pdfTotal.toFixed(2)} ${status}`)
  }

  console.log(`\n=== Done! Imported ${imported} transactions (${importedParcelamentos} parcelamentos, ${importedSingles} singles, ${importedNegatives} negatives, ${generatedFuture} future installments) ===`)
  await prisma.$disconnect()
}

main().catch((err: any) => {
  console.error('Fatal error:', err?.message || String(err))
  if (err?.cause) console.error('Cause:', err.cause?.message || String(err.cause))
  process.exit(1)
})
