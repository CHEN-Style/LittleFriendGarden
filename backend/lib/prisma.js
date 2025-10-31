import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client 单例
 * 在开发环境中避免热重载时创建多个实例
 */

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

