/**
 * Demo Seed — prisma/seed-demo.ts
 *
 * Populates a rich, realistic Brazilian financial dataset for the demo user
 * `user_demo_test_account`. This user is used by virtual team agents when
 * hitting the live API, so every model must have meaningful data.
 *
 * Data summary:
 *   - 1 User record (onboarding completed)
 *   - 10 Categories with colors + emojis
 *   - 3 CreditCards: Nubank, Itaú Personnalité, C6 Bank
 *   - 3 Tags: essencial, impulsiva, work
 *   - ~80 Transactions spanning 6 months past → 6 months future
 *     including subscriptions, parcelamentos, one-off purchases
 *   - Installment sequences: 3x, 6x, 10x, 12x purchases (complete chains)
 *   - Income: salary (recurring every month) + sporadic freelance
 *   - CategoryBudget: 5 categories budgeted, one with rollover
 *   - 2 SavingsGoals: Viagem Europa (partial), Reserva de Emergência (partial)
 *
 * Interesting signals baked in for agent analysis:
 *   - Alimentação trending up (+15% month-over-month for 4 months)
 *   - Installments from MacBook 12x + Viagem 10x converge in month +4
 *   - Assinaturas budget slightly overrun this month
 *   - Saúde has rollover budget enabled (underused past months carry forward)
 *
 * Run:  npm run seed:demo
 * Safe: deletes all demo data first (idempotent)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_USER_ID = 'user_demo_test_account'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const now = new Date()
const THIS_YEAR = now.getFullYear()
const THIS_MONTH = now.getMonth() // 0-indexed

/**
 * Returns a Date for a given month offset from today.
 * month(0) = this month, month(-1) = last month, month(2) = two months ahead.
 */
function month(offset: number, day: number = 1): Date {
  return new Date(THIS_YEAR, THIS_MONTH + offset, day)
}

/**
 * For a card with closingDay C and dueDay D:
 * A purchase made on `purchaseDay` of month `purchaseOffset` will land
 * on the invoice that closes on day C. If purchaseDay <= C, it closes
 * that same calendar month and is due on day D of the NEXT month.
 * If purchaseDay > C, it rolls to the next closing cycle, due in two months.
 *
 * For simplicity we model installment dueDates as:
 *   installment 1 → due on dueDay of (purchaseMonth + 1)
 *   installment N → due on dueDay of (purchaseMonth + N)
 */
function installmentDueDate(
  purchaseMonthOffset: number,
  installmentNumber: number,
  cardDueDay: number
): Date {
  // installment 1 is due the month after purchase
  return new Date(THIS_YEAR, THIS_MONTH + purchaseMonthOffset + installmentNumber, cardDueDay)
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log('  Deleting TransactionTags...')
  await prisma.transactionTag.deleteMany({
    where: { transaction: { userId: DEMO_USER_ID } }
  })
  console.log('  Deleting Installments...')
  await prisma.installment.deleteMany({
    where: { transaction: { userId: DEMO_USER_ID } }
  })
  console.log('  Deleting Transactions...')
  await prisma.transaction.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Deleting CategoryBudgets...')
  await prisma.categoryBudget.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Deleting Categories...')
  await prisma.category.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Deleting CreditCards...')
  await prisma.creditCard.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Deleting Incomes...')
  await prisma.income.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Deleting SavingsGoals...')
  await prisma.savingsGoal.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Deleting Tags...')
  await prisma.tag.deleteMany({ where: { userId: DEMO_USER_ID } })
  console.log('  Cleanup done.\n')
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Demo Seed Starting ===\n')
  await cleanup()

  // -------------------------------------------------------------------------
  // 1. User
  // -------------------------------------------------------------------------
  console.log('1. Upserting User...')
  await prisma.user.upsert({
    where: { clerkId: DEMO_USER_ID },
    update: {
      tier: 'pro',
      onboardingCompletedAt: month(-6, 1),
      onboardingStep: 5
    },
    create: {
      clerkId: DEMO_USER_ID,
      tier: 'pro',
      onboardingCompletedAt: month(-6, 1),
      onboardingStep: 5
    }
  })

  // -------------------------------------------------------------------------
  // 2. Categories
  // -------------------------------------------------------------------------
  console.log('2. Creating Categories...')
  type CategoryDef = { name: string; color: string; emoji: string }
  const categoryDefs: CategoryDef[] = [
    { name: 'Alimentação',  color: '#ef4444', emoji: '🍔' },
    { name: 'Transporte',   color: '#3b82f6', emoji: '🚗' },
    { name: 'Moradia',      color: '#f97316', emoji: '🏠' },
    { name: 'Saúde',        color: '#10b981', emoji: '💊' },
    { name: 'Lazer',        color: '#8b5cf6', emoji: '🎮' },
    { name: 'Assinaturas',  color: '#ec4899', emoji: '📺' },
    { name: 'Educação',     color: '#06b6d4', emoji: '📚' },
    { name: 'Vestuário',    color: '#f59e0b', emoji: '👕' },
    { name: 'Tech',         color: '#6366f1', emoji: '💻' },
    { name: 'Outros',       color: '#6b7280', emoji: '📦' }
  ]

  const cat: Record<string, string> = {}
  for (const def of categoryDefs) {
    const created = await prisma.category.create({
      data: { name: def.name, color: def.color, emoji: def.emoji, userId: DEMO_USER_ID }
    })
    cat[def.name] = created.id
  }

  // -------------------------------------------------------------------------
  // 3. Credit Cards
  // -------------------------------------------------------------------------
  console.log('3. Creating CreditCards...')

  // Nubank Ultravioleta — closingDay 25, dueDay 2 (next month)
  const nubank = await prisma.creditCard.create({
    data: {
      name: 'Nubank Ultravioleta',
      limit: 15000,
      budget: 5000,
      closingDay: 25,
      dueDay: 2,
      isDefault: true,
      userId: DEMO_USER_ID
    }
  })

  // Itaú Personnalité — closingDay 10, dueDay 17
  const itau = await prisma.creditCard.create({
    data: {
      name: 'Itaú Personnalité',
      limit: 12000,
      budget: 4000,
      closingDay: 10,
      dueDay: 17,
      isDefault: false,
      userId: DEMO_USER_ID
    }
  })

  // C6 Bank — closingDay 18, dueDay 25
  const c6 = await prisma.creditCard.create({
    data: {
      name: 'C6 Bank Mastercard',
      limit: 8000,
      budget: 3000,
      closingDay: 18,
      dueDay: 25,
      isDefault: false,
      userId: DEMO_USER_ID
    }
  })

  // -------------------------------------------------------------------------
  // 4. Tags
  // -------------------------------------------------------------------------
  console.log('4. Creating Tags...')
  const tagEssencial = await prisma.tag.create({
    data: { name: 'essencial', color: '#10b981', emoji: '✅', userId: DEMO_USER_ID }
  })
  const tagImpulsiva = await prisma.tag.create({
    data: { name: 'impulsiva', color: '#ef4444', emoji: '🔥', userId: DEMO_USER_ID }
  })
  const tagWork = await prisma.tag.create({
    data: { name: 'work', color: '#3b82f6', emoji: '💼', userId: DEMO_USER_ID }
  })

  // -------------------------------------------------------------------------
  // 5. Income (Salary + Freelance)
  // -------------------------------------------------------------------------
  console.log('5. Creating Incomes...')

  // Salary — every month for past 6, current, future 3
  for (let offset = -6; offset <= 3; offset++) {
    const d = month(offset, 5) // paid on day 5 each month
    await prisma.income.create({
      data: {
        description: 'Salário — Empresa XYZ',
        amount: 8500,
        isRecurring: true,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        userId: DEMO_USER_ID
      }
    })
  }

  // Freelance — sporadic: -5, -3, -1 months
  for (const offset of [-5, -3, -1]) {
    const d = month(offset, 20)
    await prisma.income.create({
      data: {
        description: 'Freelance — Design UI',
        amount: offset === -1 ? 3200 : offset === -3 ? 2500 : 1800,
        isRecurring: false,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        userId: DEMO_USER_ID
      }
    })
  }

  // -------------------------------------------------------------------------
  // 6. Transactions + Installments
  //
  // Convention for installmentDueDate:
  //   Nubank dueDay = 2, Itaú dueDay = 17, C6 dueDay = 25
  //   installmentDueDate(purchaseMonthOffset, installmentNumber, card.dueDay)
  //   → installment 1 lands on dueDay of (purchaseMonth + 1)
  // -------------------------------------------------------------------------
  console.log('6. Creating Transactions & Installments...')

  // ---- 6a. Subscriptions (monthly recurring on Nubank) -------------------------
  // These are monthly charges. We model each month as a separate transaction
  // (matching how the app shows them — one entry per billing cycle).

  type SubscriptionDef = {
    description: string
    amount: number
    dayOfMonth: number
    startOffset: number // how many months ago it started
    endOffset: number   // up to and including this offset (use 0 for current, 2 for +2)
    tagIds?: string[]
  }

  const subscriptions: SubscriptionDef[] = [
    { description: 'Netflix Standard',     amount: 44.90, dayOfMonth: 3,  startOffset: -6, endOffset: 2, tagIds: [tagEssencial.id] },
    { description: 'Spotify Family',       amount: 34.90, dayOfMonth: 5,  startOffset: -6, endOffset: 2, tagIds: [tagEssencial.id] },
    { description: 'Disney+',              amount: 27.90, dayOfMonth: 7,  startOffset: -6, endOffset: 2 },
    { description: 'Amazon Prime',         amount: 19.90, dayOfMonth: 9,  startOffset: -6, endOffset: 2, tagIds: [tagEssencial.id] },
    { description: 'iCloud 200GB',         amount: 9.90,  dayOfMonth: 12, startOffset: -6, endOffset: 2 },
    { description: 'Smart Fit Academia',   amount: 119.90, dayOfMonth: 1, startOffset: -6, endOffset: 2, tagIds: [tagEssencial.id] },
    { description: 'Alura — Plano Anual',  amount: 59.90, dayOfMonth: 15, startOffset: -4, endOffset: 2, tagIds: [tagWork.id] },
    { description: 'ChatGPT Plus',         amount: 100.90, dayOfMonth: 20, startOffset: -3, endOffset: 2, tagIds: [tagWork.id] },
  ]

  for (const sub of subscriptions) {
    for (let offset = sub.startOffset; offset <= sub.endOffset; offset++) {
      const purchaseDate = month(offset, sub.dayOfMonth)
      await prisma.transaction.create({
        data: {
          description: sub.description,
          amount: sub.amount,
          purchaseDate,
          installmentsCount: 1,
          isSubscription: true,
          active: true,
          lastProcessedDate: purchaseDate,
          cardId: nubank.id,
          categoryId: cat['Assinaturas'],
          userId: DEMO_USER_ID,
          installments: {
            create: [{
              number: 1,
              amount: sub.amount,
              dueDate: installmentDueDate(offset, 1, nubank.dueDay)
            }]
          },
          ...(sub.tagIds && sub.tagIds.length > 0
            ? { tags: { create: sub.tagIds.map(tagId => ({ tagId })) } }
            : {})
        }
      })
    }
  }

  // ---- 6b. Parcelamentos — the core of Du --------------------------------

  // MacBook Pro M4 — 12x R$1.099,92 (total R$13.198,99) on Nubank
  // Bought 5 months ago → installments 1-12 span from -4 to +7
  {
    const purchaseOffset = -5
    const count = 12
    const totalAmount = 13198.99
    const installmentAmount = parseFloat((totalAmount / count).toFixed(2))
    const tx = await prisma.transaction.create({
      data: {
        description: 'MacBook Pro M4 14" — Fast Shop',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 12),
        installmentsCount: count,
        cardId: nubank.id,
        categoryId: cat['Tech'],
        userId: DEMO_USER_ID,
        tags: { create: [{ tagId: tagImpulsiva.id }] }
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, nubank.dueDay)
      }))
    })
  }

  // Viagem Europa (passagens + hotel) — 10x R$1.500 (total R$15.000) on Itaú
  // Bought 2 months ago → installments 1-10 span from -1 to +8
  {
    const purchaseOffset = -2
    const count = 10
    const totalAmount = 15000
    const installmentAmount = 1500
    const tx = await prisma.transaction.create({
      data: {
        description: 'Viagem Europa — Passagens + Hotel (CVC)',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 8),
        installmentsCount: count,
        cardId: itau.id,
        categoryId: cat['Lazer'],
        userId: DEMO_USER_ID,
        tags: { create: [{ tagId: tagImpulsiva.id }] }
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, itau.dueDay)
      }))
    })
  }

  // iPhone 16 Pro — 12x R$583,25 (total R$6.999) on Itaú
  // Bought 3 months ago
  {
    const purchaseOffset = -3
    const count = 12
    const totalAmount = 6999
    const installmentAmount = parseFloat((totalAmount / count).toFixed(2))
    const tx = await prisma.transaction.create({
      data: {
        description: 'iPhone 16 Pro 256GB — Apple Store',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 20),
        installmentsCount: count,
        cardId: itau.id,
        categoryId: cat['Tech'],
        userId: DEMO_USER_ID,
        tags: { create: [{ tagId: tagImpulsiva.id }] }
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, itau.dueDay)
      }))
    })
  }

  // Sofá 3 lugares Tok&Stok — 6x R$499,83 (total R$2.999) on C6
  // Bought 4 months ago → finishes in +2
  {
    const purchaseOffset = -4
    const count = 6
    const totalAmount = 2999
    const installmentAmount = parseFloat((totalAmount / count).toFixed(2))
    const tx = await prisma.transaction.create({
      data: {
        description: 'Sofá 3 Lugares — Tok&Stok',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 3),
        installmentsCount: count,
        cardId: c6.id,
        categoryId: cat['Moradia'],
        userId: DEMO_USER_ID
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, c6.dueDay)
      }))
    })
  }

  // AirPods Pro 2 — 3x R$666,33 (total R$1.999) on Nubank
  // Bought last month → finishes in +2
  {
    const purchaseOffset = -1
    const count = 3
    const totalAmount = 1999
    const installmentAmount = parseFloat((totalAmount / count).toFixed(2))
    const tx = await prisma.transaction.create({
      data: {
        description: 'AirPods Pro 2ª Geração — Apple Store',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 14),
        installmentsCount: count,
        cardId: nubank.id,
        categoryId: cat['Tech'],
        userId: DEMO_USER_ID,
        tags: { create: [{ tagId: tagImpulsiva.id }] }
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, nubank.dueDay)
      }))
    })
  }

  // Curso de Inglês (Wizard) — 10x R$199 on C6
  // Bought 2 months ago → runs +8
  {
    const purchaseOffset = -2
    const count = 10
    const totalAmount = 1990
    const installmentAmount = 199
    const tx = await prisma.transaction.create({
      data: {
        description: 'Wizard — Curso de Inglês 10x',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 25),
        installmentsCount: count,
        cardId: c6.id,
        categoryId: cat['Educação'],
        userId: DEMO_USER_ID,
        tags: { create: [{ tagId: tagWork.id }] }
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, c6.dueDay)
      }))
    })
  }

  // Geladeira Samsung — 12x R$291,58 (total R$3.499) on Itaú
  // Bought THIS month — long tail into future, overlaps with other 12x installments in month +4/+5
  {
    const purchaseOffset = 0
    const count = 12
    const totalAmount = 3499
    const installmentAmount = parseFloat((totalAmount / count).toFixed(2))
    const tx = await prisma.transaction.create({
      data: {
        description: 'Geladeira Samsung French Door — Magazine Luiza',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 5),
        installmentsCount: count,
        cardId: itau.id,
        categoryId: cat['Moradia'],
        userId: DEMO_USER_ID
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, itau.dueDay)
      }))
    })
  }

  // Vestuário — Zara 3x — bought last month
  {
    const purchaseOffset = -1
    const count = 3
    const totalAmount = 897
    const installmentAmount = 299
    const tx = await prisma.transaction.create({
      data: {
        description: 'Zara — Coleção Inverno',
        amount: totalAmount,
        purchaseDate: month(purchaseOffset, 18),
        installmentsCount: count,
        cardId: nubank.id,
        categoryId: cat['Vestuário'],
        userId: DEMO_USER_ID,
        tags: { create: [{ tagId: tagImpulsiva.id }] }
      }
    })
    await prisma.installment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        transactionId: tx.id,
        number: i + 1,
        amount: installmentAmount,
        dueDate: installmentDueDate(purchaseOffset, i + 1, nubank.dueDay)
      }))
    })
  }

  // ---- 6c. One-off transactions per month (food, transport, health, misc) ---
  // These are à vista (1x installment), spread across all 3 cards.

  type OneOffTx = {
    description: string
    amount: number
    dayOfMonth: number
    card: typeof nubank
    category: string
    tagIds?: string[]
    monthOffset: number
  }

  const oneOffTransactions: OneOffTx[] = [
    // ---- 6 months ago ----
    { monthOffset: -6, description: 'Pão de Açúcar — Compras do mês',     amount: 620.40, dayOfMonth: 8,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: -6, description: 'Uber — corridas do mês',              amount: 180.00, dayOfMonth: 15, card: nubank, category: 'Transporte' },
    { monthOffset: -6, description: 'Condomínio',                          amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -6, description: 'ENEL — Conta de Luz',                 amount: 210.30, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -6, description: 'Drogasil — Medicamentos',             amount: 145.60, dayOfMonth: 12, card: itau,   category: 'Saúde' },
    { monthOffset: -6, description: 'iFood — Pedidos do mês',              amount: 340.80, dayOfMonth: 20, card: nubank, category: 'Alimentação' },
    { monthOffset: -6, description: 'Posto Shell — Combustível',           amount: 280.00, dayOfMonth: 22, card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
    { monthOffset: -6, description: 'Padaria São Paulo — café + pão',      amount: 89.50,  dayOfMonth: 25, card: nubank, category: 'Alimentação' },

    // ---- 5 months ago ----
    { monthOffset: -5, description: 'Pão de Açúcar — Compras do mês',     amount: 648.90, dayOfMonth: 7,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: -5, description: 'Uber — corridas do mês',              amount: 195.00, dayOfMonth: 14, card: nubank, category: 'Transporte' },
    { monthOffset: -5, description: 'Condomínio',                          amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -5, description: 'ENEL — Conta de Luz',                 amount: 198.70, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -5, description: 'Consulta Médica — Dr. Souza',         amount: 350.00, dayOfMonth: 16, card: itau,   category: 'Saúde' },
    { monthOffset: -5, description: 'iFood — Pedidos do mês',              amount: 372.40, dayOfMonth: 21, card: nubank, category: 'Alimentação' },
    { monthOffset: -5, description: 'Posto Ipiranga — Combustível',        amount: 295.00, dayOfMonth: 23, card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
    { monthOffset: -5, description: 'Bar do Zé — Happy Hour equipe',       amount: 165.00, dayOfMonth: 28, card: nubank, category: 'Lazer',        tagIds: [tagWork.id] },
    { monthOffset: -5, description: 'Mercado Livre — fone Bluetooth',      amount: 189.90, dayOfMonth: 17, card: c6,     category: 'Tech',         tagIds: [tagImpulsiva.id] },

    // ---- 4 months ago ----
    { monthOffset: -4, description: 'Carrefour — Compras do mês',         amount: 695.20, dayOfMonth: 8,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: -4, description: 'Uber — corridas do mês',              amount: 210.00, dayOfMonth: 14, card: nubank, category: 'Transporte' },
    { monthOffset: -4, description: 'Condomínio',                          amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -4, description: 'ENEL — Conta de Luz',                 amount: 225.10, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -4, description: 'Farmácia Pacheco — vitaminas',        amount: 120.00, dayOfMonth: 11, card: nubank, category: 'Saúde' },
    { monthOffset: -4, description: 'iFood — Pedidos do mês',              amount: 398.50, dayOfMonth: 20, card: nubank, category: 'Alimentação' },
    { monthOffset: -4, description: 'Posto Shell — Combustível',           amount: 310.00, dayOfMonth: 22, card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
    { monthOffset: -4, description: 'Cinemark — Ingressos (2 pessoas)',    amount: 88.00,  dayOfMonth: 15, card: nubank, category: 'Lazer' },
    { monthOffset: -4, description: 'Renner — Jaqueta couro',              amount: 420.00, dayOfMonth: 18, card: c6,     category: 'Vestuário',   tagIds: [tagImpulsiva.id] },

    // ---- 3 months ago ----
    { monthOffset: -3, description: 'Pão de Açúcar — Compras do mês',     amount: 718.60, dayOfMonth: 6,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: -3, description: 'Uber — corridas do mês',              amount: 225.00, dayOfMonth: 13, card: nubank, category: 'Transporte' },
    { monthOffset: -3, description: 'Condomínio',                          amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -3, description: 'ENEL — Conta de Luz',                 amount: 242.80, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -3, description: 'Drogasil — Medicamentos',             amount: 198.40, dayOfMonth: 12, card: itau,   category: 'Saúde' },
    { monthOffset: -3, description: 'iFood — Pedidos do mês',              amount: 445.20, dayOfMonth: 20, card: nubank, category: 'Alimentação' },
    { monthOffset: -3, description: 'Posto Ipiranga — Combustível',        amount: 330.00, dayOfMonth: 24, card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
    { monthOffset: -3, description: 'Virada Sushi — jantar especial',      amount: 220.00, dayOfMonth: 16, card: nubank, category: 'Alimentação', tagIds: [tagImpulsiva.id] },
    { monthOffset: -3, description: 'Rappi — Compras delivery',           amount: 156.70, dayOfMonth: 27, card: nubank, category: 'Alimentação' },

    // ---- 2 months ago ----
    { monthOffset: -2, description: 'Carrefour — Compras do mês',         amount: 756.30, dayOfMonth: 7,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: -2, description: 'Uber — corridas do mês',              amount: 240.00, dayOfMonth: 14, card: nubank, category: 'Transporte' },
    { monthOffset: -2, description: 'Condomínio',                          amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -2, description: 'ENEL — Conta de Luz',                 amount: 258.60, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -2, description: 'Consulta Nutricionista',              amount: 280.00, dayOfMonth: 9,  card: itau,   category: 'Saúde' },
    { monthOffset: -2, description: 'iFood — Pedidos do mês',              amount: 489.80, dayOfMonth: 21, card: nubank, category: 'Alimentação' },
    { monthOffset: -2, description: 'Posto Shell — Combustível',           amount: 345.00, dayOfMonth: 23, card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
    { monthOffset: -2, description: 'C&A — Roupas primavera',              amount: 340.00, dayOfMonth: 17, card: c6,     category: 'Vestuário',   tagIds: [tagImpulsiva.id] },
    { monthOffset: -2, description: 'DASA — Exames de sangue',             amount: 420.00, dayOfMonth: 19, card: itau,   category: 'Saúde',       tagIds: [tagEssencial.id] },

    // ---- 1 month ago ----
    { monthOffset: -1, description: 'Assaí Atacadista — Compras do mês',  amount: 812.40, dayOfMonth: 6,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: -1, description: '99 — corridas do mês',               amount: 255.00, dayOfMonth: 13, card: nubank, category: 'Transporte' },
    { monthOffset: -1, description: 'Condomínio',                          amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -1, description: 'ENEL — Conta de Luz',                 amount: 271.30, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: -1, description: 'Drogasil — Medicamentos',             amount: 175.80, dayOfMonth: 11, card: nubank, category: 'Saúde' },
    { monthOffset: -1, description: 'iFood — Pedidos do mês',              amount: 528.60, dayOfMonth: 22, card: nubank, category: 'Alimentação' },
    { monthOffset: -1, description: 'Posto Ipiranga — Combustível',        amount: 360.00, dayOfMonth: 24, card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
    { monthOffset: -1, description: 'Estacionamento Shopping JK',          amount: 45.00,  dayOfMonth: 19, card: c6,     category: 'Transporte' },
    { monthOffset: -1, description: 'Raia Drogaria — suplementos',         amount: 245.00, dayOfMonth: 26, card: nubank, category: 'Saúde',       tagIds: [tagImpulsiva.id] },

    // ---- Current month ----
    { monthOffset: 0, description: 'Carrefour — Compras do mês',          amount: 840.00, dayOfMonth: 3,  card: nubank, category: 'Alimentação', tagIds: [tagEssencial.id] },
    { monthOffset: 0, description: 'Uber — corridas',                     amount: 120.00, dayOfMonth: 8,  card: nubank, category: 'Transporte' },
    { monthOffset: 0, description: 'Condomínio',                           amount: 850.00, dayOfMonth: 5,  card: nubank, category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: 0, description: 'ENEL — Conta de Luz',                  amount: 284.50, dayOfMonth: 10, card: itau,   category: 'Moradia',     tagIds: [tagEssencial.id] },
    { monthOffset: 0, description: 'Drogasil — Vitaminas',                 amount: 98.70,  dayOfMonth: 7,  card: itau,   category: 'Saúde' },
    { monthOffset: 0, description: 'iFood — Pedidos parciais',             amount: 210.40, dayOfMonth: 9,  card: nubank, category: 'Alimentação' },
    { monthOffset: 0, description: 'Posto Shell — Combustível',            amount: 180.00, dayOfMonth: 6,  card: c6,     category: 'Transporte',  tagIds: [tagEssencial.id] },
  ]

  for (const tx of oneOffTransactions) {
    const purchaseDate = month(tx.monthOffset, tx.dayOfMonth)
    await prisma.transaction.create({
      data: {
        description: tx.description,
        amount: tx.amount,
        purchaseDate,
        installmentsCount: 1,
        isSubscription: false,
        active: true,
        cardId: tx.card.id,
        categoryId: cat[tx.category],
        userId: DEMO_USER_ID,
        installments: {
          create: [{
            number: 1,
            amount: tx.amount,
            dueDate: installmentDueDate(tx.monthOffset, 1, tx.card.dueDay)
          }]
        },
        ...(tx.tagIds && tx.tagIds.length > 0
          ? { tags: { create: tx.tagIds.map(tagId => ({ tagId })) } }
          : {})
      }
    })
  }

  // -------------------------------------------------------------------------
  // 7. CategoryBudgets
  // -------------------------------------------------------------------------
  console.log('7. Creating CategoryBudgets...')
  const budgets = [
    { category: 'Alimentação', amount: 900,  rollover: false }, // trending over — will be ~940 this month
    { category: 'Transporte',  amount: 600,  rollover: false },
    { category: 'Assinaturas', amount: 380,  rollover: false }, // ~417/mo now — intentionally over budget
    { category: 'Saúde',       amount: 500,  rollover: true  }, // rollover: underused months carry forward
    { category: 'Lazer',       amount: 400,  rollover: false },
  ]
  for (const b of budgets) {
    await prisma.categoryBudget.create({
      data: {
        amount: b.amount,
        rolloverEnabled: b.rollover,
        categoryId: cat[b.category],
        userId: DEMO_USER_ID
      }
    })
  }

  // -------------------------------------------------------------------------
  // 8. SavingsGoals
  // -------------------------------------------------------------------------
  console.log('8. Creating SavingsGoals...')

  // Viagem Europa — goal is R$20.000, already has R$8.500 (42.5% there)
  // Deadline: 8 months from now
  await prisma.savingsGoal.create({
    data: {
      name: 'Viagem Europa 2026',
      targetAmount: 20000,
      currentAmount: 8500,
      deadline: month(8, 1),
      userId: DEMO_USER_ID
    }
  })

  // Reserva de Emergência — goal is R$30.000 (≈3 months expenses), at R$11.200 (37%)
  // No deadline — long-term goal
  await prisma.savingsGoal.create({
    data: {
      name: 'Reserva de Emergência',
      targetAmount: 30000,
      currentAmount: 11200,
      deadline: null,
      userId: DEMO_USER_ID
    }
  })

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------
  const [txCount, installCount, incomeCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: DEMO_USER_ID } }),
    prisma.installment.count({ where: { transaction: { userId: DEMO_USER_ID } } }),
    prisma.income.count({ where: { userId: DEMO_USER_ID } }),
  ])

  console.log('\n=== Demo Seed Complete ===')
  console.log(`  Transactions : ${txCount}`)
  console.log(`  Installments : ${installCount}`)
  console.log(`  Incomes      : ${incomeCount}`)
  console.log(`  Cards        : 3 (Nubank, Itaú Personnalité, C6 Bank)`)
  console.log(`  Categories   : ${categoryDefs.length}`)
  console.log(`  Tags         : 3 (essencial, impulsiva, work)`)
  console.log(`  Budgets      : ${budgets.length}`)
  console.log(`  SavingsGoals : 2`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
