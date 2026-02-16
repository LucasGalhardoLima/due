import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prismaClient = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prismaClient

globalThis.prismaGlobal = prismaClient
