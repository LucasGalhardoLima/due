import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const email = args.find((arg) => !arg.startsWith('--'))
const dryRun = args.includes('--dry-run')
const skipClerk = args.includes('--skip-clerk')

if (!email) {
  console.error('Usage: node scripts/reset-user.mjs <email> [--dry-run] [--skip-clerk]')
  process.exit(1)
}

const clerkKey = process.env.NUXT_CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY

if (!clerkKey) {
  console.error('Missing Clerk secret key. Set NUXT_CLERK_SECRET_KEY or CLERK_SECRET_KEY.')
  process.exit(1)
}

const clerkHeaders = {
  Authorization: `Bearer ${clerkKey}`,
}

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Clerk API error ${res.status}: ${text}`)
  }
  return res.json()
}

const getUserByEmail = async (emailAddress) => {
  const url = `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(emailAddress)}`
  const data = await fetchJson(url, { headers: clerkHeaders })
  if (!Array.isArray(data) || data.length === 0) return null
  return data[0]
}

const deleteUserData = async (userId) => {
  if (dryRun) {
    console.log(`[dry-run] Would delete data for userId=${userId}`)
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.installment.deleteMany({ where: { transaction: { userId } } })
    await tx.transaction.deleteMany({ where: { userId } })
    await tx.invoice.deleteMany({ where: { userId } })
    await tx.category.deleteMany({ where: { userId } })
    await tx.creditCard.deleteMany({ where: { userId } })
  })
}

const deleteClerkUser = async (userId) => {
  if (dryRun || skipClerk) {
    console.log(`[dry-run] Would delete Clerk user ${userId}`)
    return
  }
  await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'DELETE',
    headers: clerkHeaders,
  })
}

const main = async () => {
  const user = await getUserByEmail(email)
  if (!user) {
    console.error(`No Clerk user found for ${email}`)
    process.exit(1)
  }

  console.log(`Found Clerk user ${user.id} for ${email}`)
  await deleteUserData(user.id)
  await deleteClerkUser(user.id)
  console.log('Done.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
