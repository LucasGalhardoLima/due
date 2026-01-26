import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const colorPalette = [
  '#00F2DE', // Pearl Aqua (Primary)
  '#10b981', // Emerald 500
  '#06b6d4', // Cyan 500
  '#0d9488', // Teal 600
  '#0ea5e9', // Sky 500
  '#6366f1', // Indigo 500
  '#f59e0b', // Amber 500
  '#f43f5e', // Rose 500
]

async function main() {
  console.log('Assigning random colors to existing categories...')
  const categories = await prisma.category.findMany({
    where: {
      color: null
    }
  })

  if (categories.length === 0) {
    console.log('No categories without color found.')
    return
  }

  console.log(`Found ${categories.length} categories without color.`)

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    const color = colorPalette[i % colorPalette.length]
    
    await prisma.category.update({
      where: { id: category.id },
      data: { color }
    })
    
    console.log(`Updated category "${category.name}" with color ${color}`)
  }

  console.log('Successfully updated all categories.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
