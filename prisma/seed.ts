import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { scryptSync } from 'crypto';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for seed');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function passwordHash(password: string, salt: string): string {
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

const demoPasswordHash = passwordHash('supportplane-demo', 'supportplane-local-demo-salt');

const roles = [
  { id: 'role-dev-admin', tenantId: 'dev-tenant', name: 'admin', permissions: ['*'], description: 'Local demo administrator' },
  { id: 'role-dev-operator', tenantId: 'dev-tenant', name: 'operator', permissions: [], description: 'Local demo support operator' },
  { id: 'role-dev-viewer', tenantId: 'dev-tenant', name: 'viewer', permissions: [], description: 'Local demo read-only viewer' },
  { id: 'role-alt-admin', tenantId: 'alt-tenant', name: 'admin', permissions: ['*'], description: 'Second tenant administrator' },
  { id: 'role-alt-operator', tenantId: 'alt-tenant', name: 'operator', permissions: [], description: 'Second tenant operator' },
];

const users = [
  {
    id: 'dev-admin',
    tenantId: 'dev-tenant',
    email: 'admin@supportplane.local',
    name: 'Demo Admin',
    roleIds: ['role-dev-admin'],
  },
  {
    id: 'dev-user',
    tenantId: 'dev-tenant',
    email: 'operator@supportplane.local',
    name: 'Demo Operator',
    roleIds: ['role-dev-operator'],
  },
  {
    id: 'dev-viewer',
    tenantId: 'dev-tenant',
    email: 'viewer@supportplane.local',
    name: 'Demo Viewer',
    roleIds: ['role-dev-viewer'],
  },
  {
    id: 'alt-admin',
    tenantId: 'alt-tenant',
    email: 'admin@alt.supportplane.local',
    name: 'Alt Tenant Admin',
    roleIds: ['role-alt-admin'],
  },
  {
    id: 'alt-operator',
    tenantId: 'alt-tenant',
    email: 'operator@alt.supportplane.local',
    name: 'Alt Tenant Operator',
    roleIds: ['role-alt-operator'],
  },
];

async function main() {
  await prisma.tenant.upsert({
    where: { id: 'dev-tenant' },
    create: {
      id: 'dev-tenant',
      name: 'Acme Support Demo',
      slug: 'dev-tenant',
      status: 'active',
      settings: {},
    },
    update: { name: 'Acme Support Demo', slug: 'dev-tenant', status: 'active' },
  });
  await prisma.tenant.upsert({
    where: { id: 'alt-tenant' },
    create: {
      id: 'alt-tenant',
      name: 'Globex Boundary Demo',
      slug: 'alt-tenant',
      status: 'active',
      settings: {},
    },
    update: { name: 'Globex Boundary Demo', slug: 'alt-tenant', status: 'active' },
  });

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      create: role,
      update: {
        name: role.name,
        permissions: role.permissions,
        description: role.description,
      },
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        status: 'active',
        passwordHash: demoPasswordHash,
        roles: { connect: user.roleIds.map((id) => ({ id })) },
      },
      update: {
        email: user.email,
        name: user.name,
        status: 'active',
        passwordHash: demoPasswordHash,
        roles: { set: user.roleIds.map((id) => ({ id })) },
      },
    });
  }

  for (const tenantId of ['dev-tenant', 'alt-tenant']) {
    await prisma.ticketingAdapter.upsert({
      where: { id: tenantId === 'dev-tenant' ? 'mock-adapter-001' : 'mock-adapter-alt-001' },
      create: {
        id: tenantId === 'dev-tenant' ? 'mock-adapter-001' : 'mock-adapter-alt-001',
        tenantId,
        name: 'Mock Ticketing Adapter',
        adapterType: 'mock',
        capabilities: ['read_tickets', 'read_customers', 'write_notes'],
        status: 'active',
        config: { mock: true },
      },
      update: {},
    });
  }

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

  console.log('Seeded local demo tenants, roles, users, and adapters');
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
