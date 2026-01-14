import { addMonths, getDate, getMonth, getYear, startOfDay } from 'date-fns'

interface InstallmentPlan {
  number: number
  amount: number
  dueDate: Date
}

export const FinanceUtils = {
  /**
   * Calculates the due date of the first installment based on Purchase Date and Card Settings.
   */
  calculateFirstDueDate(purchaseDate: Date, closingDay: number, dueDay: number): Date {
    const pDate = startOfDay(purchaseDate)
    const dayOfMonth = getDate(pDate)

    // Base date for the invoice is the PURCHASE date initially
    let invoiceMonth = getMonth(pDate)
    let invoiceYear = getYear(pDate)

    // Safra Logic:
    // If we bought AFTER the closing day, it belongs to the NEXT month's invoice cycle
    // Example: Close 10. Buy 15. Belongs to cycle ending next month.
    // Example: Close 10. Buy 5. Belongs to cycle ending this month.
    if (dayOfMonth > closingDay) {
      // Moves to next billing cycle
      const nextMonth = addMonths(pDate, 1)
      invoiceMonth = getMonth(nextMonth)
      invoiceYear = getYear(nextMonth)
    }

    // Now determine the actual Due Date given the Invoice Month/Year
    // Standard Card Logic: If Due Day < Closing Day, it usually pays in the SUBSEQUENT month relative to the closing date
    // Example: Close 25/Jan. Due 05/Feb.
    // If we are in "Jan Invoice" (Close 25/Jan), Due Date is 05 (Next month)
    // Example: Close 10/Jan. Due 17/Jan.
    // If we are in "Jan Invoice" (Close 10/Jan), Due Date is 17 (Same month)

    let dueMonth = invoiceMonth
    let dueYear = invoiceYear

    if (dueDay < closingDay) {
      // It flips to next month
      const nextForDue = addMonths(new Date(invoiceYear, invoiceMonth, 1), 1)
      dueMonth = getMonth(nextForDue)
      dueYear = getYear(nextForDue)
    }

    // Construct the date
    return new Date(dueYear, dueMonth, dueDay)
  },

  /**
   * Generates all installment records.
   */
  generateInstallments(
    totalAmount: number,
    installmentsCount: number,
    purchaseDate: Date,
    closingDay: number,
    dueDay: number
  ): InstallmentPlan[] {
    // Fix rounding issues on last installment if needed, but for MVP simpler is fine.
    // Better approach: Calculate remainder and add to first or last.
    // Let's do simple division for now, risking 0.01 cents diff.
    
    // Actually, let's fix the penny issue:
    const totalCents = Math.round(totalAmount * 100)
    const installmentCents = Math.floor(totalCents / installmentsCount)
    const remainderCents = totalCents % installmentsCount

    const firstDueDate = this.calculateFirstDueDate(purchaseDate, closingDay, dueDay)
    
    const plans: InstallmentPlan[] = []

    for (let i = 0; i < installmentsCount; i++) {
        // First installment gets the remainder pennies? Or last? Usually first is safer.
        const thisAmountCents = i === 0 ? installmentCents + remainderCents : installmentCents
        
        const dueDate = addMonths(firstDueDate, i)
        
        plans.push({
            number: i + 1,
            amount: thisAmountCents / 100,
            dueDate
        })
    }

    return plans
  }
}
