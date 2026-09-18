import { PrismaClient, Prisma } from '@prisma/client';

const prismaHelper = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prismaHelper.$on('query', (e) => {
  console.log('--------------------------------');
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params); // Shows the actual values inserted into the SQL
  console.log('Duration: ' + e.duration + 'ms');
  console.log('--------------------------------');
});
export { prismaHelper, Prisma };
