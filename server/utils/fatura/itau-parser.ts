import { execSync } from 'child_process'
import type { FaturaParser, ParsedFatura, ParsedTransaction, SkippedInstallment } from './types'

export class ItauParser implements FaturaParser {
  bankId = 'itau'

  detect(rawText: string): boolean {
    const hasCardFormat = /\d{4}\.\w{4}\.\w{4}\.\d{4}/.test(rawText)
    const hasLancamentos = rawText.includes('compras e saques')
    return hasCardFormat && hasLancamentos
  }

  /**
   * Parse from already-extracted text. Uses column splitting heuristics.
   * For best accuracy on two-column PDFs, use parsePdf() instead.
   */
  parse(rawText: string): ParsedFatura {
    const billingPeriod = this.extractBillingPeriod(rawText)
    const cleanedText = this.removePreviewSections(rawText)
    const expandedText = this.splitColumns(cleanedText)

    const billingYear = parseInt(billingPeriod.split('-')[0]!)
    const billingMonth = parseInt(billingPeriod.split('-')[1]!) - 1

    const { transactions, skippedInstallments, stats } =
      this.extractTransactions(expandedText, billingYear, billingMonth)

    return { bank: 'itau', billingPeriod, transactions, skippedInstallments, stats }
  }

  /**
   * Parse directly from a PDF file using per-page per-column extraction.
   * This is the recommended method — it avoids the column-splitting heuristics
   * by extracting left and right columns independently via pdftotext coordinates.
   *
   * Detects installment suffixes (NN/MM): first installments (01/XX) become
   * multi-installment transactions with reconstructed total amounts, ongoing
   * installments (NN>1/XX) are skipped, and single payments keep their amount.
   */
  parsePdf(pdfPath: string, password: string): ParsedFatura {
    const rawText = this.extractFullText(pdfPath, password)
    const billingPeriod = this.extractBillingPeriod(rawText)

    const billingYear = parseInt(billingPeriod.split('-')[0]!)
    const billingMonth = parseInt(billingPeriod.split('-')[1]!) - 1
    const pageCount = this.getPageCount(pdfPath, password)

    const transactions: ParsedTransaction[] = []
    const skippedInstallments: SkippedInstallment[] = []
    let totalLines = 0
    let skippedAdjustments = 0
    let skippedOngoing = 0

    for (let page = 1; page <= pageCount; page++) {
      const leftText = this.extractColumnText(pdfPath, password, page, 0, 350)
      const rightText = this.extractColumnText(pdfPath, password, page, 350, 250)

      for (const text of [leftText, rightText]) {
        const result = this.parseColumnLines(text, billingYear, billingMonth)
        transactions.push(...result.transactions)
        totalLines += result.totalLines
        skippedAdjustments += result.skippedAdjustments
        skippedOngoing += result.skippedOngoing
      }
    }

    return {
      bank: 'itau',
      billingPeriod,
      transactions,
      skippedInstallments,
      stats: {
        totalLines,
        newPurchases: transactions.length,
        skippedOngoing,
        skippedAdjustments,
      },
    }
  }

  // --- Per-column line parsing (used by parsePdf) ---

  private parseColumnLines(
    text: string,
    billingYear: number,
    billingMonth: number,
  ): { transactions: ParsedTransaction[]; totalLines: number; skippedAdjustments: number; skippedOngoing: number } {
    const transactions: ParsedTransaction[] = []
    let totalLines = 0
    let skippedAdjustments = 0
    let skippedOngoing = 0

    const cleanedText = this.removePreviewSections(text)
    let inSection = false

    const lines = cleanedText.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i]!.trim()

      // Section entry — startsWith avoids false matches from unsplit two-column lines
      if (trimmed.startsWith('DATA ESTABELECIMENTO') ||
          trimmed.startsWith('DATA    PRODUTOS') ||
          trimmed.startsWith('Lançamentos: compras e saques') ||
          trimmed.startsWith('Lançamentos internacionais') ||
          trimmed.startsWith('Lançamentos: produtos e servi')) {
        inSection = true
        continue
      }

      // Section exit
      if (trimmed.startsWith('Lançamentos no cartão') ||
          trimmed.startsWith('Total transações') ||
          trimmed.startsWith('Total lançamentos') ||
          trimmed.startsWith('Limites de crédito') ||
          trimmed.startsWith('Encargos cobrados') ||
          trimmed.startsWith('Novo teto') ||
          trimmed.startsWith('Compras parceladas') ||
          trimmed.startsWith('Lançamentos produtos e servi')) {
        inSection = false
        continue
      }

      if (!inSection) continue
      if (trimmed.includes('PAGAMENTO EFETUADO')) continue

      // Match: DD/MM  description  [2+ spaces]  [-] amount (Brazilian XX,XX format)
      // Use \b (not $) to grab the FIRST amount — avoids credit limits on two-column lines
      const txMatch = trimmed.match(/^(\d{2}\/\d{2})\s+(.+?)\s{2,}(-\s*)?(\d[\d.]*,\d{2})\b/)
      if (!txMatch) continue

      totalLines++
      const [, dateStr, descPart, negSign, amountStr] = txMatch
      const rawAmount = this.parseAmount(amountStr!)

      if (negSign || rawAmount === null || rawAmount <= 0) {
        skippedAdjustments++
        continue
      }

      const purchaseDate = this.resolveDate(dateStr!, billingYear, billingMonth)

      // Extract installment suffix (e.g. "01/10") before stripping it
      let rawDescription = descPart!.trim()
      let installmentNumber = 1
      let installmentsTotal = 1

      const installmentMatch = rawDescription.match(/\s*\S?(\d{2})\/(\d{2})\s*$/)
      if (installmentMatch) {
        installmentNumber = parseInt(installmentMatch[1]!)
        installmentsTotal = parseInt(installmentMatch[2]!)
        rawDescription = rawDescription.replace(/\s*\S?\d{2}\/\d{2}\s*$/, '').trim()
      }

      // Skip ongoing installments — they're covered by the 01/XX transaction
      if (installmentNumber > 1) {
        skippedOngoing++
        continue
      }

      // Extract bank category and city from the next line
      let bankCategory = ''
      let city = ''
      const nextLine = lines[i + 1]?.trim() || ''
      if (nextLine && !nextLine.match(/^\d{2}\/\d{2}/)) {
        const catMatch = nextLine.match(/^([A-ZÀ-Ú\s&.]+?)\s*\.(.*)$/)
        if (catMatch) {
          bankCategory = catMatch[1]!.trim()
          city = catMatch[2]!.trim()
        }
      }

      // For first installments (01/XX), reconstruct total purchase amount
      const totalAmount = installmentsTotal > 1
        ? Math.round(rawAmount * installmentsTotal * 100) / 100
        : rawAmount

      transactions.push({
        purchaseDate,
        rawDescription,
        amount: totalAmount,
        installmentsCount: installmentsTotal,
        bankCategory,
        city,
      })
    }

    return { transactions, totalLines, skippedAdjustments, skippedOngoing }
  }

  // --- Legacy text-based extraction (used by parse) ---

  private extractTransactions(
    text: string,
    billingYear: number,
    billingMonth: number,
  ): { transactions: ParsedTransaction[]; skippedInstallments: SkippedInstallment[]; stats: import('./types').ParseStats } {
    const transactions: ParsedTransaction[] = []
    const skippedInstallments: SkippedInstallment[] = []
    let skippedAdjustments = 0
    let totalLines = 0

    let inTransactionSection = false
    const lines = text.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Section entry — require VALOR EM R$ to avoid matching international headers (US$)
      if ((line.startsWith('DATA ESTABELECIMENTO') && line.includes('VALOR EM R$')) ||
          line.startsWith('DATA    PRODUTOS') ||
          line.startsWith('Lançamentos: compras e saques')) {
        inTransactionSection = true
        continue
      }

      // Section exit — international and products sections use different amount formats
      if (line.startsWith('Lançamentos no cartão') ||
          line.startsWith('Lançamentos internacionais') ||
          line.startsWith('Total transações') ||
          line.startsWith('Total lançamentos') ||
          line.startsWith('Limites de crédito') ||
          line.startsWith('Encargos cobrados') ||
          line.startsWith('Novo teto') ||
          line.startsWith('Compras parceladas') ||
          line.startsWith('Lançamentos produtos e servi') ||
          line.startsWith('Lançamentos: produtos e servi')) {
        inTransactionSection = false
        continue
      }

      if (!inTransactionSection) continue

      // Use \b instead of $ to grab the FIRST amount on the line
      const txMatch = line.match(/^(\d{2}\/\d{2})\s+(.+?)\s{2,}(-\s*)?(\d[\d.]*,\d{2})\b/)
      if (!txMatch) continue

      totalLines++
      const [, dateStr, descPart, negSign, amountStr] = txMatch
      const rawAmount = this.parseAmount(amountStr!)

      if (negSign || rawAmount === null || rawAmount <= 0) {
        skippedAdjustments++
        continue
      }

      const amount = rawAmount

      const installmentMatch = descPart!.match(/(\d{2})\/(\d{2})\s*$/)
      let rawDescription = descPart!.trim()
      let installmentNumber = 1
      let installmentsTotal = 1

      if (installmentMatch) {
        installmentNumber = parseInt(installmentMatch[1]!)
        installmentsTotal = parseInt(installmentMatch[2]!)
        rawDescription = descPart!.replace(/\s*\S?(\d{2})\/(\d{2})\s*$/, '').trim()
      }

      let bankCategory = ''
      let city = ''
      const nextLine = lines[i + 1]?.trim() || ''
      if (nextLine && !nextLine.match(/^\d{2}\/\d{2}/)) {
        const catMatch = nextLine.match(/^([A-ZÀ-Ú\s&.]+?)\s*\.(.*)$/)
        if (catMatch) {
          bankCategory = catMatch[1]!.trim()
          city = catMatch[2]!.trim()
        }
      }

      const purchaseDate = this.resolveDate(dateStr!, billingYear, billingMonth)

      if (installmentNumber > 1) {
        skippedInstallments.push({
          description: `${rawDescription} ${installmentNumber.toString().padStart(2, '0')}/${installmentsTotal.toString().padStart(2, '0')}`,
          amount,
          installmentNumber,
          installmentsTotal,
        })
        continue
      }

      const totalAmount = installmentsTotal > 1
        ? Math.round(amount * installmentsTotal * 100) / 100
        : amount

      transactions.push({
        purchaseDate,
        rawDescription,
        amount: totalAmount,
        installmentsCount: installmentsTotal,
        bankCategory,
        city,
      })
    }

    return {
      transactions,
      skippedInstallments,
      stats: { totalLines, newPurchases: transactions.length, skippedOngoing: skippedInstallments.length, skippedAdjustments },
    }
  }

  // --- PDF extraction helpers ---

  private extractFullText(pdfPath: string, password: string): string {
    const pwFlag = password ? `-opw ${password}` : ''
    try {
      return execSync(`pdftotext -layout ${pwFlag} "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    } catch {
      return execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    }
  }

  private getPageCount(pdfPath: string, password: string): number {
    const pwFlag = password ? `-opw ${password}` : ''
    const info = execSync(`pdfinfo ${pwFlag} "${pdfPath}" 2>&1`, { encoding: 'utf-8' })
    const match = info.match(/Pages:\s+(\d+)/)
    return parseInt(match?.[1] || '0')
  }

  private extractColumnText(pdfPath: string, password: string, page: number, x: number, w: number): string {
    const pwFlag = password ? `-opw ${password}` : ''
    try {
      return execSync(`pdftotext -layout -f ${page} -l ${page} -x ${x} -y 0 -W ${w} -H 842 ${pwFlag} "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    } catch {
      return ''
    }
  }

  // --- Shared helpers ---

  private extractBillingPeriod(text: string): string {
    const closingMatch = text.match(/Fechamento:\s*(\d{2})\/(\d{2})\/(\d{4})/)
    if (closingMatch) {
      const nextMonth = parseInt(closingMatch[2]!)
      const nextYear = parseInt(closingMatch[3]!)
      let month = nextMonth - 1
      let year = nextYear
      if (month === 0) {
        month = 12
        year--
      }
      return `${year}-${month.toString().padStart(2, '0')}`
    }

    const emissaoMatch = text.match(/Emissão:\s*(\d{2})\/(\d{2})\/(\d{4})/)
    if (emissaoMatch) {
      return `${emissaoMatch[3]}-${emissaoMatch[2]}`
    }

    return 'unknown'
  }

  private splitColumns(text: string): string {
    return text.split('\n').flatMap(line => {
      const dateSplit = line.match(/^(.+\S)\s{3,}(\d{2}\/\d{2}\s+[A-Za-z*].+)$/)
      if (dateSplit) return [dateSplit[1]!, dateSplit[2]!]

      const catSplit = line.match(/^(.+\.[A-Za-zÀ-ú\s]*)\s{6,}([A-ZÀ-Ú][A-ZÀ-Ú\s&]+\..*)$/)
      if (catSplit) return [catSplit[1]!, catSplit[2]!]

      const hdrSplit = line.match(/^(.+\S)\s{6,}((?:LUCAS|DATA|Lançamentos|Total|Compras|Limites?|Continua|Pagamento|Saldo|Encargo|Novo teto|Parcelas|Previsão|Consulte|Valor em|Crédito|Simulação|PC -|Caso você).+)$/)
      if (hdrSplit) return [hdrSplit[1]!, hdrSplit[2]!]

      return [line]
    }).join('\n')
  }

  private removePreviewSections(text: string): string {
    return text.replace(
      /Compras parceladas - próximas faturas[\s\S]*?(?=Limites de crédito|Novo teto|Encargos cobrados|$)/g,
      '',
    )
  }

  private parseAmount(raw: string): number | null {
    const cleaned = raw.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  private resolveDate(dateStr: string, billingYear: number, billingMonth: number): string {
    const [dayStr, monthStr] = dateStr.split('/')
    const day = parseInt(dayStr!)
    const month = parseInt(monthStr!) - 1

    let year = billingYear
    if (month > billingMonth) {
      year = billingYear - 1
    }

    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }
}
