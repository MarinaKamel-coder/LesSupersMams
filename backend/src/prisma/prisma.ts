import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from "dotenv";

import { PrismaClient } from "../generated/prisma/client";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquant. Crée un fichier .env dans /backend avec DATABASE_URL=... (Postgres/Neon)."
  );
}
// Créer le client Neon
const adapter = new PrismaNeon({
  connectionString: databaseUrl,
});

// Créer le client Prisma avec l'adaptateur Neon
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});


export default prisma