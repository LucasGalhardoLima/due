import { describe, it, expect } from 'vitest'
import { FinanceUtils } from '../../server/utils/finance'

describe('FinanceUtils', () => {
  describe('calculateFirstDueDate', () => {
    it('should return same month due date when purchase is before closing day', () => {
      // Card: closes day 10, due day 17
      // Purchase: Jan 5 (before closing)
      // Expected: Due Jan 17 (same month)
      const purchaseDate = new Date(2025, 0, 5) // Jan 5, 2025
      const closingDay = 10
      const dueDay = 17

      const result = FinanceUtils.calculateFirstDueDate(purchaseDate, closingDay, dueDay)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(17)
    })

    it('should return next month due date when purchase is after closing day', () => {
      // Card: closes day 10, due day 17
      // Purchase: Jan 15 (after closing)
      // Expected: Due Feb 17 (next month)
      const purchaseDate = new Date(2025, 0, 15) // Jan 15, 2025
      const closingDay = 10
      const dueDay = 17

      const result = FinanceUtils.calculateFirstDueDate(purchaseDate, closingDay, dueDay)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(17)
    })

    it('should handle due day before closing day (payment in following month)', () => {
      // Card: closes day 25, due day 5 (next month)
      // Purchase: Jan 20 (before closing)
      // Expected: Invoice closes Jan 25, Due Feb 5
      const purchaseDate = new Date(2025, 0, 20) // Jan 20, 2025
      const closingDay = 25
      const dueDay = 5

      const result = FinanceUtils.calculateFirstDueDate(purchaseDate, closingDay, dueDay)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(5)
    })

    it('should handle year boundary correctly', () => {
      // Card: closes day 15, due day 20
      // Purchase: Dec 20, 2025 (after closing)
      // Expected: Due Jan 20, 2026
      const purchaseDate = new Date(2025, 11, 20) // Dec 20, 2025
      const closingDay = 15
      const dueDay = 20

      const result = FinanceUtils.calculateFirstDueDate(purchaseDate, closingDay, dueDay)

      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(20)
    })
  })

  describe('generateInstallments', () => {
    it('should generate correct number of installments', () => {
      const result = FinanceUtils.generateInstallments(
        1200, // totalAmount
        12,   // installmentsCount
        new Date(2025, 0, 5),
        10,   // closingDay
        17    // dueDay
      )

      expect(result).toHaveLength(12)
    })

    it('should calculate correct installment amounts', () => {
      const result = FinanceUtils.generateInstallments(
        1000,
        10,
        new Date(2025, 0, 5),
        10,
        17
      )

      // Each installment should be 100
      result.forEach(inst => {
        expect(inst.amount).toBe(100)
      })
    })

    it('should handle uneven division with remainder on first installment', () => {
      const result = FinanceUtils.generateInstallments(
        100,
        3,
        new Date(2025, 0, 5),
        10,
        17
      )

      // 100 / 3 = 33.33... First gets remainder
      // 10000 cents / 3 = 3333 cents each, remainder 1 cent
      expect(result[0].amount).toBeCloseTo(33.34, 2)
      expect(result[1].amount).toBeCloseTo(33.33, 2)
      expect(result[2].amount).toBeCloseTo(33.33, 2)
    })

    it('should generate sequential due dates monthly', () => {
      const result = FinanceUtils.generateInstallments(
        600,
        6,
        new Date(2025, 0, 5), // Jan 5
        10,
        17
      )

      expect(result[0].dueDate.getMonth()).toBe(0) // Jan
      expect(result[1].dueDate.getMonth()).toBe(1) // Feb
      expect(result[2].dueDate.getMonth()).toBe(2) // Mar
      expect(result[3].dueDate.getMonth()).toBe(3) // Apr
      expect(result[4].dueDate.getMonth()).toBe(4) // May
      expect(result[5].dueDate.getMonth()).toBe(5) // Jun
    })

    it('should number installments correctly', () => {
      const result = FinanceUtils.generateInstallments(
        300,
        3,
        new Date(2025, 0, 5),
        10,
        17
      )

      expect(result[0].number).toBe(1)
      expect(result[1].number).toBe(2)
      expect(result[2].number).toBe(3)
    })
  })
})
