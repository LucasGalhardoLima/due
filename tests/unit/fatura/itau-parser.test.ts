import { describe, it, expect } from 'vitest'
import { ItauParser } from '../../../server/utils/fatura/itau-parser'

// Sample text extracted from a real Itau fatura PDF via pdftotext -layout
const SAMPLE_ITAU_TEXT = `
              Cartão        5536.XXXX.XXXX.6552
              Vencimento: 20/01/2026
              Emissão: 13/01/2026
              Previsão prox. Fechamento: 13/02/2026

                Lançamentos: compras e saques
                LUCAS G LIMA (final 6552)
                DATA ESTABELECIMENTO                                   VALOR EM R$
                13/12   RAIA182 -CT                 77,65
                        SAÚDE .MATO
                13/12   AMORA DOCE K-CT E 01/05     81,38
                        VESTUÁRIO .
                13/12   MC DONALD S -CT            132,80
                        ALIMENTAÇÃO .MATAO
                14/12   AUTO POSTO P-CT VERA       235,52
                        VEÍCULOS .MATAO
                20/12   Carters -CT 01/05           44,03
                        VESTUÁRIO .
                19/12   RAIA3368 -CT 01/03         137,48
                        SAÚDE .
                02/09   LOJAS CEM F1-CT 05/10      189,80
                        VESTUÁRIO .MATAO
                15/11   PBKIDS BRINQ-CT S 02/03    116,64
                        DIVERSOS .ARARAQUARA
                15/11   JIM.COM* JES-CT A02/03     237,90
                        DIVERSOS .MATAO
                15/11   JIM.COM* JES-CT AMAN        - 0,02
                        DIVERSOS .MATAO
                15/11   PBKIDS BRINQ-CT S           - 0,02
                        DIVERSOS .ARARAQUARA
                Lançamentos no cartão (final 6552)       11.363,55

                Compras parceladas - próximas faturas
                DATA    ESTABELECIMENTO                         VALOR EM R$
                25/02   AMAZON PRIME BR 12/12                         13,90
                14/03   QIPU        11/12                            159,00
`

describe('ItauParser', () => {
  const parser = new ItauParser()

  describe('detect', () => {
    it('should detect Itau fatura text', () => {
      expect(parser.detect(SAMPLE_ITAU_TEXT)).toBe(true)
    })

    it('should not detect non-Itau text', () => {
      expect(parser.detect('Some random CSV file content')).toBe(false)
    })
  })

  describe('parse', () => {
    it('should extract billing period from fatura header', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      // Closing date is 13/01/2026 → billing period is '2026-01'
      expect(result.billingPeriod).toBe('2026-01')
    })

    it('should parse single-payment transactions', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      const raia = result.transactions.find(t => t.rawDescription.includes('RAIA182'))
      expect(raia).toBeDefined()
      expect(raia!.amount).toBe(77.65)
      expect(raia!.installmentsCount).toBe(1)
      expect(raia!.bankCategory).toBe('SAÚDE')
      expect(raia!.purchaseDate).toBe('2025-12-13')
    })

    it('should parse first-installment transactions (01/YY)', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      const amora = result.transactions.find(t => t.rawDescription.includes('AMORA DOCE'))
      expect(amora).toBeDefined()
      expect(amora!.amount).toBeCloseTo(81.38 * 5, 2) // total = per-installment * count
      expect(amora!.installmentsCount).toBe(5)
    })

    it('should skip ongoing installments (XX/YY where XX > 1)', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      // LOJAS CEM 05/10 should be skipped
      const lojas = result.transactions.find(t => t.rawDescription.includes('LOJAS CEM'))
      expect(lojas).toBeUndefined()
      // But it should appear in skippedInstallments
      const skipped = result.skippedInstallments.find(s => s.description.includes('LOJAS CEM'))
      expect(skipped).toBeDefined()
      expect(skipped!.installmentNumber).toBe(5)
      expect(skipped!.installmentsTotal).toBe(10)
    })

    it('should skip rounding adjustment lines (tiny negative amounts)', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      // -0.02 lines should not appear in transactions
      const adjustments = result.transactions.filter(t => t.amount < 0)
      expect(adjustments).toHaveLength(0)
      expect(result.stats.skippedAdjustments).toBe(2)
    })

    it('should skip "Compras parceladas - proximas faturas" section', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      // AMAZON PRIME 12/12 and QIPU 11/12 from the preview section should not appear
      const amazon = result.transactions.find(t => t.rawDescription.includes('AMAZON PRIME BR'))
      expect(amazon).toBeUndefined()
    })

    it('should extract city from category line', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      const mc = result.transactions.find(t => t.rawDescription.includes('MC DONALD'))
      expect(mc).toBeDefined()
      expect(mc!.city).toBe('MATAO')
    })

    it('should report correct stats', () => {
      const result = parser.parse(SAMPLE_ITAU_TEXT)
      expect(result.stats.newPurchases).toBe(6)
      expect(result.stats.skippedOngoing).toBe(3)
      expect(result.stats.skippedAdjustments).toBe(2)
    })
  })

  describe('ItauParser — edge cases', () => {
    it('should handle international transactions section (skip it)', () => {
      const text = `
      Cartão 5536.XXXX.XXXX.6552
      Previsão prox. Fechamento: 13/02/2026

      LUCAS G LIMA (final 6552)
      DATA ESTABELECIMENTO                                   VALOR EM R$
      13/12   RAIA182 -CT                 77,65
              SAÚDE .MATO

      Lançamentos internacionais
      LUCAS G LIMA (final 6552)
      DATA ESTABELECIMENTO                             US$         R$
      26/12 TUYA (HK) LIMITED                        39,22
               KOWLOON           36,90 BRL   6,67
      Total transações inter. em R$                 39,22
    `
      const parser = new ItauParser()
      const result = parser.parse(text)

      // Should only have the domestic transaction, not the international one
      expect(result.transactions.length).toBe(1)
      expect(result.transactions[0]!.rawDescription).toContain('RAIA182')
    })

    it('should handle transactions with empty city', () => {
      const text = `
      Cartão 5536.XXXX.XXXX.6552
      Previsão prox. Fechamento: 13/02/2026

      LUCAS G LIMA (final 6552)
      DATA ESTABELECIMENTO                                   VALOR EM R$
      19/12   RAIA3368 -CT 01/03         137,48
              SAÚDE .
    `
      const parser = new ItauParser()
      const result = parser.parse(text)

      expect(result.transactions.length).toBe(1)
      expect(result.transactions[0]!.city).toBe('')
      expect(result.transactions[0]!.bankCategory).toBe('SAÚDE')
    })
  })
})
