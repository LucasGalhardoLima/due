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
import { PrismaClient, Prisma } from '@prisma/client'
import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { join, extname } from 'path'
import { addMonths } from 'date-fns'
import { cleanupDescriptions } from '../server/utils/fatura/ai-cleanup'
import type { ParsedTransaction } from '../server/utils/fatura/types'

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
  const dueDate = billingPeriodToDueDate(billingPeriod)

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

  // Step 2: Group installments across faturas
  console.log('\n--- Grouping Installments ---')

  interface AnnotatedLine extends FaturaLine {
    faturaDueDate: string
    faturaBillingPeriod: string
  }

  const allAnnotated: AnnotatedLine[] = allFaturas.flatMap(f =>
    f.lines.map(l => ({ ...l, faturaDueDate: f.dueDate, faturaBillingPeriod: f.billingPeriod }))
  )

  const positiveAnnotated = allAnnotated.filter(l => !l.isNegative)
  const negativeAnnotated = allAnnotated.filter(l => l.isNegative)

  // Parents: 01/XX entries — each starts a multi-installment purchase
  interface ParentGroup {
    line: AnnotatedLine
    children: Map<number, AnnotatedLine> // installmentNumber -> fatura line
  }

  const parentGroups: ParentGroup[] = positiveAnnotated
    .filter(l => l.installmentNumber === 1 && l.installmentsTotal > 1)
    .map(l => {
      const children = new Map<number, AnnotatedLine>()
      children.set(1, l)
      return { line: l, children }
    })

  // Match ongoing installments (NN>1) to their parent by description + total + amount + date alignment
  const orphans: AnnotatedLine[] = []
  for (const line of positiveAnnotated.filter(l => l.installmentNumber > 1)) {
    const lineDue = new Date(line.faturaDueDate + 'T03:00:00Z')

    const parent = parentGroups.find(p => {
      if (p.line.rawDescription.toLowerCase() !== line.rawDescription.toLowerCase()) return false
      if (p.line.installmentsTotal !== line.installmentsTotal) return false
      if (Math.abs(p.line.amount - line.amount) >= 0.02) return false
      if (p.children.has(line.installmentNumber)) return false // slot already taken
      // Date alignment: parent due + (N-1) months = this line's fatura due
      const parentDue = new Date(p.line.faturaDueDate + 'T03:00:00Z')
      const expectedDue = addMonths(parentDue, line.installmentNumber - 1)
      return expectedDue.getUTCFullYear() === lineDue.getUTCFullYear() &&
             expectedDue.getUTCMonth() === lineDue.getUTCMonth()
    })

    if (parent) {
      parent.children.set(line.installmentNumber, line)
    } else {
      orphans.push(line)
    }
  }

  const singles = positiveAnnotated.filter(l => l.installmentsTotal === 1)
  const totalMatched = parentGroups.reduce((s, p) => s + p.children.size - 1, 0)

  console.log(`  Parents (01/XX): ${parentGroups.length}`)
  console.log(`  Matched ongoing: ${totalMatched}`)
  console.log(`  Unmatched orphans: ${orphans.length}`)
  console.log(`  Singles: ${singles.length}`)
  console.log(`  Negatives: ${negativeAnnotated.length}`)

  // Step 3: AI Cleanup
  // Clean parents + orphans + singles + negatives (matched children share parent description)
  console.log('\n--- AI Cleanup ---')

  const linesForCleanup: AnnotatedLine[] = [
    ...parentGroups.map(p => p.line),
    ...orphans,
    ...singles,
    ...negativeAnnotated,
  ]

  const forCleanup: ParsedTransaction[] = linesForCleanup.map(l => ({
    purchaseDate: l.purchaseDate,
    rawDescription: l.rawDescription,
    amount: l.installmentsTotal > 1
      ? Math.round(l.amount * l.installmentsTotal * 100) / 100
      : Math.abs(l.amount),
    installmentsCount: l.installmentsTotal,
    bankCategory: '',
    city: '',
  }))

  const categoryOptions = categories.map(c => ({ id: c.id, name: c.name }))

  console.log(`  Cleaning ${forCleanup.length} descriptions...`)
  const BATCH_SIZE = 80
  const cleaned: Awaited<ReturnType<typeof cleanupDescriptions>> = []
  for (let i = 0; i < forCleanup.length; i += BATCH_SIZE) {
    const batch = forCleanup.slice(i, i + BATCH_SIZE)
    const batchResult = await cleanupDescriptions(batch, categoryOptions, { skipAI: SKIP_AI })
    cleaned.push(...batchResult)
    if (!SKIP_AI) console.log(`    Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(forCleanup.length / BATCH_SIZE)} done`)
  }
  const unchangedCount = cleaned.filter((c, i) =>
    c.cleanDescription === linesForCleanup[i]?.rawDescription
  ).length
  console.log(`  Cleaned: ${cleaned.length - unchangedCount}, unchanged: ${unchangedCount}`)
  console.log('  Done.\n')

  // Step 4: Category distribution
  const catCounts: Record<string, number> = {}
  for (const tx of cleaned) {
    const cat = tx.suggestedCategory || 'Sem categoria'
    catCounts[cat] = (catCounts[cat] || 0) + 1
  }
  console.log('--- Category Distribution ---')
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`))

  const totalAll = parentGroups.length + totalMatched + orphans.length + singles.length + negativeAnnotated.length
  console.log(`\n--- TOTAL: ${totalAll} lines (${parentGroups.length} parents, ${totalMatched} matched, ${orphans.length} orphans, ${singles.length} singles, ${negativeAnnotated.length} negatives) ---`)

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would delete existing Itaú card data and import all transactions')
    await prisma.$disconnect()
    return
  }

  // Step 5: Delete existing Itaú card data
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

  // Step 6: Import transactions
  console.log('\n--- Importing transactions ---')
  const outroCategory = categories.find(c => c.name === 'Outro')!

  // Find latest fatura due date — only generate future installments beyond this
  const lastFaturaDue = allFaturas
    .map(f => new Date(f.dueDate + 'T03:00:00Z'))
    .reduce((a, b) => a > b ? a : b)

  let imported = 0
  let importedParents = 0
  let generatedFuture = 0
  let createCount = 0

  async function reconnectIfNeeded() {
    createCount++
    if (createCount % 150 === 0) {
      await prisma.$disconnect()
      await prisma.$connect()
    }
  }

  // 6a: Import parent groups (multi-installment purchases)
  let cleanedIdx = 0
  for (const parent of parentGroups) {
    const cleanedTx = cleaned[cleanedIdx]!
    cleanedIdx++

    const totalAmount = Math.round(parent.line.amount * parent.line.installmentsTotal * 100) / 100
    const purchaseDateObj = new Date(parent.line.purchaseDate + 'T03:00:00Z')
    const parentDueDate = new Date(parent.line.faturaDueDate + 'T03:00:00Z')

    // Build installments: fatura data (children) + generated (future beyond last fatura)
    const installmentData: { number: number; amount: Prisma.Decimal; dueDate: Date }[] = []

    // From fatura data
    for (const [num, child] of parent.children) {
      installmentData.push({
        number: num,
        amount: new Prisma.Decimal(child.amount.toFixed(2)),
        dueDate: new Date(child.faturaDueDate + 'T03:00:00Z'),
      })
    }

    // Generated: missing installments that fall AFTER last fatura
    for (let n = 1; n <= parent.line.installmentsTotal; n++) {
      if (!parent.children.has(n)) {
        const dueDate = addMonths(parentDueDate, n - 1)
        if (dueDate > lastFaturaDue) {
          installmentData.push({
            number: n,
            amount: new Prisma.Decimal(parent.line.amount.toFixed(2)),
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
        description: cleanedTx.cleanDescription || parent.line.rawDescription,
        amount: new Prisma.Decimal(totalAmount.toFixed(2)),
        purchaseDate: purchaseDateObj,
        installmentsCount: parent.line.installmentsTotal,
        category: { connect: { id: cleanedTx.suggestedCategoryId || outroCategory.id } },
        installments: { createMany: { data: installmentData } },
      },
    })
    importedParents++
    imported++
    await reconnectIfNeeded()
  }
  console.log(`  Parents: ${importedParents} (${generatedFuture} future installments generated)`)

  // 6b: Import orphans (unmatched ongoing installments)
  let importedOrphans = 0
  for (const orphan of orphans) {
    const cleanedTx = cleaned[cleanedIdx]!
    cleanedIdx++

    await prisma.transaction.create({
      data: {
        userId: LUCAS_USER,
        card: { connect: { id: ITAU_CARD } },
        description: cleanedTx.cleanDescription || orphan.rawDescription,
        amount: new Prisma.Decimal(orphan.amount.toFixed(2)),
        purchaseDate: new Date(orphan.purchaseDate + 'T03:00:00Z'),
        installmentsCount: 1,
        category: { connect: { id: cleanedTx.suggestedCategoryId || outroCategory.id } },
        installments: {
          create: { number: 1, amount: new Prisma.Decimal(orphan.amount.toFixed(2)), dueDate: new Date(orphan.faturaDueDate + 'T03:00:00Z') },
        },
      },
    })
    importedOrphans++
    imported++
    await reconnectIfNeeded()
  }
  console.log(`  Orphans: ${importedOrphans}`)

  // 6c: Import singles
  let importedSingles = 0
  for (const single of singles) {
    const cleanedTx = cleaned[cleanedIdx]!
    cleanedIdx++

    await prisma.transaction.create({
      data: {
        userId: LUCAS_USER,
        card: { connect: { id: ITAU_CARD } },
        description: cleanedTx.cleanDescription || single.rawDescription,
        amount: new Prisma.Decimal(single.amount.toFixed(2)),
        purchaseDate: new Date(single.purchaseDate + 'T03:00:00Z'),
        installmentsCount: 1,
        category: { connect: { id: cleanedTx.suggestedCategoryId || outroCategory.id } },
        installments: {
          create: { number: 1, amount: new Prisma.Decimal(single.amount.toFixed(2)), dueDate: new Date(single.faturaDueDate + 'T03:00:00Z') },
        },
      },
    })
    importedSingles++
    imported++
    await reconnectIfNeeded()
  }
  console.log(`  Singles: ${importedSingles}`)

  // 6d: Import negatives
  let importedNegatives = 0
  for (const neg of negativeAnnotated) {
    const cleanedTx = cleaned[cleanedIdx]!
    cleanedIdx++

    await prisma.transaction.create({
      data: {
        userId: LUCAS_USER,
        card: { connect: { id: ITAU_CARD } },
        description: cleanedTx.cleanDescription || neg.rawDescription,
        amount: new Prisma.Decimal(neg.amount.toFixed(2)),
        purchaseDate: new Date(neg.purchaseDate + 'T03:00:00Z'),
        installmentsCount: 1,
        category: { connect: { id: outroCategory.id } },
        installments: {
          create: { number: 1, amount: new Prisma.Decimal(neg.amount.toFixed(2)), dueDate: new Date(neg.faturaDueDate + 'T03:00:00Z') },
        },
      },
    })
    importedNegatives++
    imported++
    await reconnectIfNeeded()
  }
  console.log(`  Negatives: ${importedNegatives}`)

  // Step 7: Verify — per-fatura, DB installments due that month vs PDF total
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

  // Log uncleaned descriptions for manual review
  const uncleaned = cleaned.filter((c, i) =>
    c.cleanDescription === linesForCleanup[i]?.rawDescription
  )
  if (uncleaned.length > 0) {
    console.log('\n--- Uncleaned descriptions (review manually) ---')
    uncleaned.forEach(c => console.log(`  "${c.rawDescription}"`))
  }

  console.log(`\n=== Done! Imported ${imported} transactions (${importedParents} parents, ${importedOrphans} orphans, ${importedSingles} singles, ${importedNegatives} negatives, ${generatedFuture} future installments) ===`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
