import type { FaturaParser, ParsedFatura, ParsedTransaction, SkippedInstallment } from './types'

export class ItauParser implements FaturaParser {
  bankId = 'itau'

  detect(rawText: string): boolean {
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

    const billingYear = parseInt(billingPeriod.split('-')[0]!)
    const billingMonth = parseInt(billingPeriod.split('-')[1]!) - 1

    let inTransactionSection = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      if (line.includes('DATA ESTABELECIMENTO') && line.includes('VALOR EM R$')) {
        inTransactionSection = true
        continue
      }

      if (line.startsWith('Lançamentos no cartão') || line.startsWith('Total transações')) {
        inTransactionSection = false
        continue
      }

      if (line.includes('Lançamentos internacionais') || line.includes('Lançamentos: produtos e serviços')) {
        inTransactionSection = false
        continue
      }

      if (!inTransactionSection) continue

      // Transaction line: DD/MM  DESCRIPTION  [XX/YY]  [-] AMOUNT
      // The negative sign can appear as "- 0,02" (with space)
      const txMatch = line.match(
        /^(\d{2}\/\d{2})\s+(.+?)\s+(-\s*)?(\d[\d.,]*)\s*$/
      )

      if (!txMatch) continue

      totalLines++
      const [, dateStr, descPart, negSign, amountStr] = txMatch

      const rawAmount = this.parseAmount(amountStr!)

      if (negSign || rawAmount === null || rawAmount <= 0) {
        skippedAdjustments++
        continue
      }

      const amount = rawAmount

      // Match installment pattern: space or word-boundary followed by DD/DD at end
      // e.g., "AMORA DOCE K-CT E 01/05" → installment 01/05
      // e.g., "PBKIDS BRINQ-CT S 02/03" → installment 02/03
      // e.g., "JIM.COM* JES-CT A02/03" → installment 02/03 (A is part of desc)
      const installmentMatch = descPart!.match(/(\d{2})\/(\d{2})\s*$/)
      let rawDescription = descPart!.trim()
      let installmentNumber = 1
      let installmentsTotal = 1

      if (installmentMatch) {
        installmentNumber = parseInt(installmentMatch[1]!)
        installmentsTotal = parseInt(installmentMatch[2]!)
        // Remove the installment suffix and any preceding non-alphanumeric separator
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

  private removePreviewSections(text: string): string {
    return text.replace(
      /Compras parceladas - próximas faturas[\s\S]*?(?=Limites de crédito|Novo teto|Encargos cobrados|$)/g,
      ''
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
