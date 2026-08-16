import type { FaturaParser } from './types'
import { ItauParser } from './itau-parser'

const parsers: FaturaParser[] = [
  new ItauParser(),
]

export function detectBank(rawText: string): FaturaParser | null {
  for (const parser of parsers) {
    if (parser.detect(rawText)) {
      return parser
    }
  }
  return null
}
