const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const models = Object.keys(prisma).filter(k => 
  !k.startsWith('_') && 
  !k.startsWith('$') && 
  typeof prisma[k] === 'object'
);

console.log('Available Prisma models:');
models.forEach(model => console.log(`- ${model}`));