import { createError } from 'h3'
import prisma from './prisma'

/**
 * Verifies that a card exists and belongs to the given user.
 * Throws 404 if the card is not found or belongs to another user (IDOR prevention).
 */
export async function verifyCardOwnership(cardId: string, userId: string) {
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId }
  })
  if (!card) {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }
  return card
}
