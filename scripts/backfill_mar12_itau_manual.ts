/**
 * Backfill script for LUM-???: Mar-12 manual transactions on Itaú Uniclass Black.
 *
 * Context
 * -------
 * Before the `dueNextMonth` fix, `FinanceUtils.calculateFirstDueDate` bucketed
 * Itaú-style cards (close 14 / due 20 of NEXT month) one month too early.
 * Lucas manually added 6 transactions on 2026-04-11 with purchaseDate 2026-03-12
 * that ended up with `installment.dueDate = 2026-03-20` — but Itaú billed them
 * on 2026-04-20, so they should live in Du's April fatura.
 *
 * All OTHER transactions on that card were imported from CSV with correct
 * `purchaseDate` and their `dueDate` already matches what the bank bills, so
 * this script deliberately does NOT touch them.
 *
 * Usage
 * -----
 *   npx tsx scripts/backfill_mar12_itau_manual.ts            # dry-run
 *   npx tsx scripts/backfill_mar12_itau_manual.ts --apply    # write changes
 *
 * Safety
 * ------
 * - Dry-run by default. Prints the exact UPDATEs it would issue.
 * - Only targets transactions whose dueDate is currently 2026-03-20 and whose
 *   purchaseDate is 2026-03-12 on the named card — the precise set Lucas
 *   added manually on 2026-04-11.
 */

import prisma from '../server/utils/prisma'

const USER_ID = 'user_39FiYOQiVIsqrFyd0Wf67iM8sCU'
const CARD_NAME = 'Itaú Uniclass Black'

// Target windows
const PURCHASE_DAY_START = new Date('2026-03-12T00:00:00.000Z')
const PURCHASE_DAY_END = new Date('2026-03-13T00:00:00.000Z')
const WRONG_DUE = new Date('2026-03-20T00:00:00.000Z')
const CORRECT_DUE = new Date('2026-04-20T00:00:00.000Z')

async function main() {
  const apply = process.argv.includes('--apply')

  const card = await prisma.creditCard.findFirst({
    where: { userId: USER_ID, name: CARD_NAME },
    select: { id: true, name: true },
  })
  if (!card) {
    console.error(`Card not found: ${CARD_NAME}`)
    process.exit(1)
  }

  const candidates = await prisma.installment.findMany({
    where: {
      dueDate: WRONG_DUE,
      transaction: {
        userId: USER_ID,
        cardId: card.id,
        purchaseDate: { gte: PURCHASE_DAY_START, lt: PURCHASE_DAY_END },
      },
    },
    include: {
      transaction: { select: { id: true, description: true, purchaseDate: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  if (candidates.length === 0) {
    console.log('No candidates found — nothing to do.')
    return
  }

  console.log(`Found ${candidates.length} installment(s) to move from ${WRONG_DUE.toISOString().slice(0, 10)} → ${CORRECT_DUE.toISOString().slice(0, 10)}:\n`)
  for (const c of candidates) {
    console.log(`  • ${c.transaction.description.padEnd(40)} | R$ ${Number(c.amount).toFixed(2).padStart(8)} | tx ${c.transactionId.slice(0, 8)}…`)
  }

  if (!apply) {
    console.log('\nDry-run. Re-run with --apply to write these changes.')
    return
  }

  const result = await prisma.installment.updateMany({
    where: {
      id: { in: candidates.map(c => c.id) },
    },
    data: { dueDate: CORRECT_DUE },
  })

  console.log(`\n✓ Updated ${result.count} installment row(s).`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
