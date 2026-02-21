import prisma from './prisma'

type NotificationType = 'budget_warning' | 'bill_reminder' | 'goal_milestone' | 'invoice_closing' | 'streak' | 'du_tip'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string
) {
  // Find the internal User record by clerkId
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (!user) return null

  // Deduplicate: don't create if same type+title exists unread in last 24h
  const recent = await prisma.notification.findFirst({
    where: {
      userId: user.id,
      type,
      title,
      read: false,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })

  if (recent) return recent

  return prisma.notification.create({
    data: {
      userId: user.id,
      type,
      title,
      message,
      actionUrl,
    },
  })
}
