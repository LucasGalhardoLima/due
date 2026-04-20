import { describe, it, expect } from 'vitest'
import { FinanceUtils } from '../../server/utils/finance'

describe('FinanceUtils', () => {
  describe('calculateFirstDueDate — dueNextMonth: true (modern Brazilian issuers)', () => {
    it('Itaú-style cycle (close 14, due 20 of NEXT month) — purchase before close', () => {
      // Regression: before this fix, purchase 2026-03-12 with close 14/due 20
      // was assigned dueDate 2026-03-20. Real-world Itaú bills it on 2026-04-20.
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2026, 2, 12),
        { closingDay: 14, dueDay: 20, dueNextMonth: true },
      )
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(3) // April
      expect(result.getDate()).toBe(20)
    })

    it('Itaú-style cycle — purchase ON the closing day', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2026, 2, 14),
        { closingDay: 14, dueDay: 20, dueNextMonth: true },
      )
      expect(result.getMonth()).toBe(3) // April
      expect(result.getDate()).toBe(20)
    })

    it('Itaú-style cycle — purchase AFTER closing day bumps to following cycle', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2026, 2, 15),
        { closingDay: 14, dueDay: 20, dueNextMonth: true },
      )
      expect(result.getMonth()).toBe(4) // May
      expect(result.getDate()).toBe(20)
    })

    it('Nubank-style cycle (close 25, due 2) — purchase before close', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2026, 2, 20),
        { closingDay: 25, dueDay: 2, dueNextMonth: true },
      )
      expect(result.getMonth()).toBe(3) // April
      expect(result.getDate()).toBe(2)
    })

    it('defaults to dueNextMonth=true when flag omitted', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2026, 2, 12),
        { closingDay: 14, dueDay: 20 },
      )
      expect(result.getMonth()).toBe(3) // April — treats as dueNextMonth:true
    })

    it('handles year boundary', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2025, 11, 10),
        { closingDay: 14, dueDay: 20, dueNextMonth: true },
      )
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(20)
    })
  })

  describe('calculateFirstDueDate — dueNextMonth: false (same-month cycle, rare)', () => {
    it('close 10, due 17 — purchase before close stays in same month', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2025, 0, 5),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(17)
    })

    it('close 10, due 17 — purchase after close lands next month', () => {
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2025, 0, 15),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(17)
    })

    it('close 25, due 5 — due day earlier than close, implicit month bump', () => {
      // Even with dueNextMonth:false, if dueDay < closingDay we still have to
      // bump forward because the same month is impossible.
      const result = FinanceUtils.calculateFirstDueDate(
        new Date(2025, 0, 20),
        { closingDay: 25, dueDay: 5, dueNextMonth: false },
      )
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(5)
    })
  })

  describe('generateInstallments', () => {
    it('generates the correct number of installments', () => {
      const result = FinanceUtils.generateInstallments(
        1200,
        12,
        new Date(2025, 0, 5),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      expect(result).toHaveLength(12)
    })

    it('calculates correct installment amounts for even division', () => {
      const result = FinanceUtils.generateInstallments(
        1000,
        10,
        new Date(2025, 0, 5),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      result.forEach(inst => expect(inst.amount).toBe(100))
    })

    it('puts the remainder cent on the last installment', () => {
      const result = FinanceUtils.generateInstallments(
        100,
        3,
        new Date(2025, 0, 5),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      expect(result[0]!.amount).toBeCloseTo(33.33, 2)
      expect(result[1]!.amount).toBeCloseTo(33.33, 2)
      expect(result[2]!.amount).toBeCloseTo(33.34, 2)
    })

    it('generates sequential monthly due dates', () => {
      const result = FinanceUtils.generateInstallments(
        600,
        6,
        new Date(2025, 0, 5),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      expect(result[0]!.dueDate.getMonth()).toBe(0)
      expect(result[1]!.dueDate.getMonth()).toBe(1)
      expect(result[2]!.dueDate.getMonth()).toBe(2)
      expect(result[5]!.dueDate.getMonth()).toBe(5)
    })

    it('numbers installments 1..N', () => {
      const result = FinanceUtils.generateInstallments(
        300,
        3,
        new Date(2025, 0, 5),
        { closingDay: 10, dueDay: 17, dueNextMonth: false },
      )
      expect(result[0]!.number).toBe(1)
      expect(result[1]!.number).toBe(2)
      expect(result[2]!.number).toBe(3)
    })
  })
})
