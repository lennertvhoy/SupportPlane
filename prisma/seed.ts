import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for seed');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.tenant.upsert({
    where: { id: 'dev-tenant' },
    create: {
      id: 'dev-tenant',
      name: 'Dev Tenant',
      slug: 'dev-tenant',
      status: 'active',
      settings: {},
    },
    update: {},
  });
  console.log('Ensured dev-tenant');

  await prisma.user.upsert({
    where: { id: 'dev-user' },
    create: {
      id: 'dev-user',
      tenantId: 'dev-tenant',
      email: 'dev@example.com',
      name: 'Dev User',
      status: 'active',
    },
    update: {},
  });
  console.log('Ensured dev-user');

  await prisma.ticketingAdapter.upsert({
    where: { id: 'mock-adapter-001' },
    create: {
      id: 'mock-adapter-001',
      tenantId: 'dev-tenant',
      name: 'Mock Ticketing Adapter',
      adapterType: 'mock',
      capabilities: ['read_tickets', 'read_customers', 'write_notes'],
      status: 'active',
      config: { mock: true },
    },
    update: {},
  });
  console.log('Ensured mock-adapter-001');

  await prisma.ticketingAdapter.upsert({
    where: { id: 'zammad-adapter-001' },
    create: {
      id: 'zammad-adapter-001',
      tenantId: 'dev-tenant',
      name: 'Zammad Adapter',
      adapterType: 'zammad',
      capabilities: ['read_tickets', 'read_customers', 'write_notes'],
      status: 'active',
      config: { mock: true },
    },
    update: {},
  });
  console.log('Ensured zammad-adapter-001');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
