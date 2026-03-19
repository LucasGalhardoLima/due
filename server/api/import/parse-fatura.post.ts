import { writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { ItauParser } from '../../utils/fatura/itau-parser'
import { cleanupDescriptions } from '../../utils/fatura/ai-cleanup'
import type { ParsedTransaction } from '../../utils/fatura/types'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' })
  }

  const pdfField = formData.find(f => f.name === 'pdf')
  const passwordField = formData.find(f => f.name === 'password')

  if (!pdfField?.data) {
    throw createError({ statusCode: 400, statusMessage: 'No PDF file provided' })
  }

  const password = passwordField?.data?.toString() || ''

  // Write PDF to temp file
  const tmpDir = mkdtempSync(join(tmpdir(), 'du-fatura-'))
  const tmpPath = join(tmpDir, 'fatura.pdf')

  try {
    writeFileSync(tmpPath, pdfField.data)

    // Parse with per-page per-column extraction
    const parser = new ItauParser()
    const result = parser.parsePdf(tmpPath, password)

    if (result.billingPeriod === 'unknown') {
      throw createError({ statusCode: 422, statusMessage: 'Não foi possível detectar o período da fatura. Verifique se é uma fatura Itaú válida.' })
    }

    // Load user categories for AI cleanup
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
    const categoryOptions = categories.map(c => ({ id: c.id, name: c.name }))

    // Filter: only import new purchases (01/XX, singles, negatives, IOF)
    // Ongoing installments (e.g. 05/12) are existing parcelamento charges — skip them
    const importable = result.transactions.filter(t => t.installmentNumber <= 1)
    const skippedOngoing = result.transactions.length - importable.length

    // AI cleanup in batches
    const BATCH_SIZE = 80
    const cleaned: Awaited<ReturnType<typeof cleanupDescriptions>> = []

    for (let i = 0; i < importable.length; i += BATCH_SIZE) {
      const batch = importable.slice(i, i + BATCH_SIZE)
      const batchResult = await cleanupDescriptions(batch, categoryOptions)
      cleaned.push(...batchResult)
    }

    // Use the actual vencimento date from the PDF as the fatura due date
    let faturaDueDate: string | undefined
    if (result.vencimentoDate) {
      faturaDueDate = new Date(result.vencimentoDate + 'T03:00:00.000Z').toISOString()
    }

    return {
      billingPeriod: result.billingPeriod,
      bank: result.bank,
      faturaDueDate,
      stats: {
        ...result.stats,
        skippedOngoing,
        newPurchases: importable.length,
      },
      transactions: cleaned.map(tx => ({
        date: new Date(tx.purchaseDate + 'T03:00:00.000Z').toISOString(),
        description: tx.cleanDescription,
        rawDescription: tx.rawDescription,
        amount: tx.amount,
        installmentsCount: tx.installmentsCount,
        categoryId: tx.suggestedCategoryId || undefined,
        categoryName: tx.suggestedCategory || undefined,
      })),
    }
  } finally {
    try { unlinkSync(tmpPath) } catch {}
    try { unlinkSync(tmpDir) } catch {}
  }
})
