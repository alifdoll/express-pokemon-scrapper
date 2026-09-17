import { PrismaClient, Prisma } from '@prisma/client';

const prismaHelper = new PrismaClient();
export { prismaHelper, Prisma };
