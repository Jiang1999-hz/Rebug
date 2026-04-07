import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL is required for seeding.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

const prisma = new PrismaClient({
  adapter
});

async function main() {
  const email = process.env.SEED_DEVELOPER_EMAIL ?? 'dev@example.com';
  const password = process.env.SEED_DEVELOPER_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const developer = await prisma.developer.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash }
  });

  const project = await prisma.project.upsert({
    where: { apiKey: 'proj_demo_local' },
    update: {},
    create: {
      name: 'Demo Project',
      apiKey: 'proj_demo_local',
      allowedOrigins: ['http://localhost:5173']
    }
  });

  console.log(`Seeded developer ${developer.email}`);
  console.log(`Seeded project ${project.name} (${project.apiKey})`);
  console.log(`Developer password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
