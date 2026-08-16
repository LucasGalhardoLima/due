import { describe, it, expect } from 'vitest'
import { detectBank } from '../../../server/utils/fatura/detect'

describe('detectBank', () => {
  it('should detect Itau from fatura text', () => {
    const text = 'Cartão 5536.XXXX.XXXX.6552\nLançamentos: compras e saques'
    const parser = detectBank(text)
    expect(parser).not.toBeNull()
    expect(parser!.bankId).toBe('itau')
  })

  it('should return null for unknown format', () => {
    const parser = detectBank('Random CSV content, nothing special')
    expect(parser).toBeNull()
  })
})
