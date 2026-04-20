import { addMonths, getDate, getMonth, getYear, startOfDay } from 'date-fns'

interface InstallmentPlan {
  number: number
  amount: number
  dueDate: Date
}

interface CycleSettings {
  closingDay: number
  dueDay: number
  /** When true (default), the due date falls in the calendar month AFTER the closing month
   * — standard for modern Brazilian issuers (Itaú, Nubank, Bradesco, Inter, C6, Santander).
   * When false, both fall in the same month (rare, e.g. cards with close 2 / due 15).
   */
  dueNextMonth?: boolean
}

export const FinanceUtils = {
  calculateFirstDueDate(purchaseDate: Date, cycle: CycleSettings): Date {
    const { closingDay, dueDay, dueNextMonth = true } = cycle
    const pDate = startOfDay(purchaseDate)
    const dayOfMonth = getDate(pDate)

    // Invoice cycle: purchases on or before closingDay belong to the cycle that
    // closes THIS month; purchases strictly after closingDay belong to the next.
    let invoiceMonth = getMonth(pDate)
    let invoiceYear = getYear(pDate)

    if (dayOfMonth > closingDay) {
      const nextMonth = addMonths(pDate, 1)
      invoiceMonth = getMonth(nextMonth)
      invoiceYear = getYear(nextMonth)
    }

    // Due-date month relative to the closing month.
    let dueMonth = invoiceMonth
    let dueYear = invoiceYear

    if (dueNextMonth) {
      // Always lands in the month following the close.
      const nextForDue = addMonths(new Date(invoiceYear, invoiceMonth, 1), 1)
      dueMonth = getMonth(nextForDue)
      dueYear = getYear(nextForDue)
    } else if (dueDay < closingDay) {
      // Same-month cycle but the day number is earlier than the close —
      // impossible in the same calendar month, so bump to the next.
      const nextForDue = addMonths(new Date(invoiceYear, invoiceMonth, 1), 1)
      dueMonth = getMonth(nextForDue)
      dueYear = getYear(nextForDue)
    }

    return new Date(dueYear, dueMonth, dueDay)
  },

  generateInstallments(
    totalAmount: number,
    installmentsCount: number,
    purchaseDate: Date,
    cycle: CycleSettings,
  ): InstallmentPlan[] {
    const totalCents = Math.round(totalAmount * 100)
    const installmentCents = Math.floor(totalCents / installmentsCount)
    const remainderCents = totalCents % installmentsCount

    const firstDueDate = this.calculateFirstDueDate(purchaseDate, cycle)
    const plans: InstallmentPlan[] = []

    for (let i = 0; i < installmentsCount; i++) {
      const thisAmountCents = i === installmentsCount - 1
        ? installmentCents + remainderCents
        : installmentCents
      const dueDate = addMonths(firstDueDate, i)
      plans.push({
        number: i + 1,
        amount: thisAmountCents / 100,
        dueDate,
      })
    }

    return plans
  },
}
