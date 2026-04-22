import type { FaturaParser, ParsedFatura, ParsedTransaction, SkippedInstallment, ParseStats } from './types'

export class ItauParser implements FaturaParser {
  bankId = 'itau'

  detect(rawText: string): boolean {
    // Itau faturas contain card number in XXXX.XXXX.XXXX.XXXX format
    // and the "Lançamentos: compras e saques" section header
    const hasCardFormat = /\d{4}\.\w{4}\.\w{4}\.\d{4}/.test(rawText)
    const hasLancamentos = rawText.includes('compras e saques')
    return hasCardFormat && hasLancamentos
  }

  parse(rawText: string): ParsedFatura {
    const billingPeriod = this.extractBillingPeriod(rawText)
    const cleanedText = this.removePreviewSections(rawText)
    const lines = cleanedText.split('\n')

    const transactions: ParsedTransaction[] = []
    const skippedInstallments: SkippedInstallment[] = []
    let skippedAdjustments = 0
    let totalLines = 0

    // Determine the fatura year context from the billing period
    const billingYear = parseInt(billingPeriod.split('-')[0]!)
    const billingMonth = parseInt(billingPeriod.split('-')[1]!) - 1 // 0-indexed

    let inTransactionSection = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Detect start of transaction sections
      if (line.includes('DATA ESTABELECIMENTO') && line.includes('VALOR EM R$')) {
        inTransactionSection = true
        continue
      }

      // Detect end of transaction sections
      if (line.startsWith('Lançamentos no cartão') || line.startsWith('Total transações')) {
        inTransactionSection = false
        continue
      }

      // Skip non-transaction sections
      if (line.includes('Lançamentos internacionais') || line.includes('Lançamentos: produtos e serviços')) {
        inTransactionSection = false
        continue
      }

      if (!inTransactionSection) continue

      // Try to parse a transaction line
      // Format: DD/MM  DESCRIPTION  [XX/YY]  [-] AMOUNT
      // The regex captures an optional negative sign before the amount
      const txMatch = line.match(
        /^(\d{2}\/\d{2})\s+(.+?)\s+(-\s*)?(\d[\d.,]*)\s*$/
      )

      if (!txMatch) continue

      totalLines++
      const [, dateStr, descPart, negSign, amountStr] = txMatch

      // Parse amount (Brazilian format: 1.234,56 or just 234,56)
      const rawAmount = this.parseAmount(amountStr!)

      // Skip negative amounts (rounding adjustment lines like "- 0,02")
      if (negSign || rawAmount === null || rawAmount <= 0) {
        skippedAdjustments++
        continue
      }

      const amount = rawAmount

      // Extract installment info from description: XX/YY
      const installmentMatch = descPart!.match(/(\d{2})\/(\d{2})\s*$/)
      let rawDescription = descPart!.trim()
      let installmentNumber = 1
      let installmentsTotal = 1

      if (installmentMatch) {
        installmentNumber = parseInt(installmentMatch[1]!)
        installmentsTotal = parseInt(installmentMatch[2]!)
        // Remove the installment suffix from the description
        rawDescription = descPart!.replace(/\s*\d{2}\/\d{2}\s*$/, '').trim()
      }

      // Read the next line for category and city
      let bankCategory = ''
      let city = ''
      const nextLine = lines[i + 1]?.trim() || ''
      if (nextLine && !nextLine.match(/^\d{2}\/\d{2}/)) {
        const catMatch = nextLine.match(/^([A-ZÀ-Ú\s&.]+)\s*\.(.*)$/)
        if (catMatch) {
          bankCategory = catMatch[1]!.trim()
          city = catMatch[2]!.trim()
        }
      }

      // Determine full purchase date
      const purchaseDate = this.resolveDate(dateStr!, billingYear, billingMonth)

      // Skip ongoing installments (XX > 1)
      if (installmentNumber > 1) {
        skippedInstallments.push({
          description: `${rawDescription} ${installmentNumber.toString().padStart(2, '0')}/${installmentsTotal.toString().padStart(2, '0')}`,
          amount,
          installmentNumber,
          installmentsTotal,
        })
        continue
      }

      // For first installments, calculate total amount
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
      bank: 'itau',
      billingPeriod,
      transactions,
      skippedInstallments,
      stats: {
        totalLines,
        newPurchases: transactions.length,
        skippedOngoing: skippedInstallments.length,
        skippedAdjustments,
      },
    }
  }

  private extractBillingPeriod(text: string): string {
    // Look for "Previsão prox. Fechamento: DD/MM/YYYY" — the closing date is one month before
    const closingMatch = text.match(/Fechamento:\s*(\d{2})\/(\d{2})\/(\d{4})/)
    if (closingMatch) {
      // The billing period is for the CURRENT closing, which is one month before the "next" closing
      const nextMonth = parseInt(closingMatch[2]!)
      const nextYear = parseInt(closingMatch[3]!)
      // Current closing is one month before the next
      let month = nextMonth - 1
      let year = nextYear
      if (month === 0) {
        month = 12
        year--
      }
      return `${year}-${month.toString().padStart(2, '0')}`
    }

    // Fallback: look for "Emissão: DD/MM/YYYY"
    const emissaoMatch = text.match(/Emissão:\s*(\d{2})\/(\d{2})\/(\d{4})/)
    if (emissaoMatch) {
      return `${emissaoMatch[3]}-${emissaoMatch[2]}`
    }

    return 'unknown'
  }

  private removePreviewSections(text: string): string {
    // Remove "Compras parceladas - próximas faturas" section entirely
    // This section continues until the next major section or end of text
    return text.replace(
      /Compras parceladas - próximas faturas[\s\S]*?(?=Limites de crédito|Novo teto|Encargos cobrados|$)/g,
      ''
    )
  }

  private parseAmount(raw: string): number | null {
    // Brazilian format: 1.234,56 → 1234.56
    const cleaned = raw.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  private resolveDate(dateStr: string, billingYear: number, billingMonth: number): string {
    // dateStr is "DD/MM" — we need to determine the year
    const [dayStr, monthStr] = dateStr.split('/')
    const day = parseInt(dayStr!)
    const month = parseInt(monthStr!) - 1 // 0-indexed

    // The fatura closing is in billingMonth/billingYear.
    // Transactions can be from the current or previous months.
    // If the transaction month is AFTER the billing month, it's from the previous year.
    let year = billingYear
    if (month > billingMonth) {
      year = billingYear - 1
    }

    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }
}
