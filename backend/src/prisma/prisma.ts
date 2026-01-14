import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from "../generated/prisma/client.js";
// Créer le client Neon
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

// Créer le client Prisma avec l'adaptateur Neon
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});


export default prisma