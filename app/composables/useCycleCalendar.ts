import { computed, type Ref } from 'vue'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CycleInput {
  closingDay: Ref<number | null | undefined>
  dueDay: Ref<number | null | undefined>
}

export interface CycleOption {
  /** Closing date the user would next see */
  close: Date
  /** Due date under "same month" cycle */
  dueSame: Date
  /** Due date under "next month" cycle */
  dueNext: Date
  /** Days between close and dueSame; null if the combination is impossible */
  sameDays: number | null
  /** Days between close and dueNext */
  nextDays: number
  /** True when dueDay > closingDay (same-month cycle is geometrically possible) */
  sameValid: boolean
  /** Human-readable "14 de abr" */
  closeLabel: string
  dueSameLabel: string
  dueNextLabel: string
  /** Short month ("abr", "mai") */
  closeMonth: string
  dueSameMonth: string
  dueNextMonth: string
}

/**
 * Projects the next close/due dates from the user's day-of-month inputs so the
 * Card form can preview both candidate cycles in concrete calendar terms.
 * Computed from "today" forward — the user recognises their bank's pattern.
 */
export function useCycleCalendar({ closingDay, dueDay }: CycleInput) {
  return computed<CycleOption | null>(() => {
    const c = closingDay.value
    const d = dueDay.value
    if (!c || !d || c < 1 || c > 31 || d < 1 || d > 31) return null

    const today = new Date()
    const thisMonthClose = new Date(today.getFullYear(), today.getMonth(), c)
    // Next occurrence of closingDay (today counts if it matches)
    const close = thisMonthClose >= new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ? thisMonthClose
      : new Date(today.getFullYear(), today.getMonth() + 1, c)

    const dueSame = new Date(close.getFullYear(), close.getMonth(), d)
    const dueNext = new Date(close.getFullYear(), close.getMonth() + 1, d)

    const sameValid = d > c
    const sameDays = sameValid ? differenceInDays(dueSame, close) : null
    const nextDays = differenceInDays(dueNext, close)

    const fmt = (date: Date) => format(date, "d 'de' MMM", { locale: ptBR })
    const fmtMonth = (date: Date) => format(date, 'MMM', { locale: ptBR })

    return {
      close,
      dueSame,
      dueNext,
      sameDays,
      nextDays,
      sameValid,
      closeLabel: fmt(close),
      dueSameLabel: fmt(dueSame),
      dueNextLabel: fmt(dueNext),
      closeMonth: fmtMonth(close),
      dueSameMonth: fmtMonth(dueSame),
      dueNextMonth: fmtMonth(dueNext),
    }
  })
}
