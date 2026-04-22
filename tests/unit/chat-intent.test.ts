import { describe, it, expect } from 'vitest'
import { detectChatIntent } from '../../server/utils/chat-intent'

describe('detectChatIntent', () => {
  describe('isLongRunning', () => {
    it('detects "análise profunda"', () => {
      expect(detectChatIntent('quero uma análise profunda').isLongRunning).toBe(true)
    })
    it('detects "6 meses"', () => {
      expect(detectChatIntent('analisa meus gastos de 6 meses').isLongRunning).toBe(true)
    })
    it('detects "semestral"', () => {
      expect(detectChatIntent('relatório semestral').isLongRunning).toBe(true)
    })
    it('does not flag normal messages', () => {
      expect(detectChatIntent('por que minha fatura está alta?').isLongRunning).toBe(false)
    })
  })

  describe('isExpenseAdd', () => {
    it('detects "gastei"', () => {
      expect(detectChatIntent('gastei R$50 no Spoleto').isExpenseAdd).toBe(true)
    })
    it('detects "comprei"', () => {
      expect(detectChatIntent('comprei um livro por R$40').isExpenseAdd).toBe(true)
    })
    it('detects "paguei"', () => {
      expect(detectChatIntent('paguei R$120 na farmácia').isExpenseAdd).toBe(true)
    })
    it('detects "comi"', () => {
      expect(detectChatIntent("comi no McDonald's por R$35").isExpenseAdd).toBe(true)
    })
    it('does not flag questions', () => {
      expect(detectChatIntent('por que minha fatura está alta?').isExpenseAdd).toBe(false)
    })
    it('does not flag expense verbs without an amount', () => {
      expect(detectChatIntent('gastei tempo nisso semana passada').isExpenseAdd).toBe(false)
      expect(detectChatIntent('comi muito mal essa semana').isExpenseAdd).toBe(false)
    })
  })
})
