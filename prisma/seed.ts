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

  // Seed demo customer references
  const customers = [
    {
      id: 'customer-acme-001',
      tenantId: 'dev-tenant',
      adapterId: 'zammad-adapter-001',
      externalCustomerId: 'CUST-ACME-001',
      name: 'Acme BVBA',
      email: 'support@acme.example',
      phone: '+32 3 555 01 01',
      company: 'Acme BVBA',
    },
    {
      id: 'customer-globex-001',
      tenantId: 'alt-tenant',
      adapterId: 'mock-adapter-alt-001',
      externalCustomerId: 'CUST-GLOBEX-001',
      name: 'Globex Corp',
      email: 'it@globex.example',
      phone: '+32 2 555 02 02',
      company: 'Globex Corporation',
    },
  ];

  for (const customer of customers) {
    await prisma.customerReference.upsert({
      where: { id: customer.id },
      create: customer,
      update: customer,
    });
  }

  // Seed demo ticket references linked to customers
  const tickets = [
    {
      id: 'ticket-101-ref',
      tenantId: 'dev-tenant',
      adapterId: 'zammad-adapter-001',
      externalTicketId: 'TICKET-101',
      subject: 'VPN not connecting for remote user',
      status: 'open',
      priority: 'normal',
      customerId: 'customer-acme-001',
      customerEmail: 'support@acme.example',
      customerName: 'Acme BVBA',
    },
    {
      id: 'ticket-102-ref',
      tenantId: 'dev-tenant',
      adapterId: 'zammad-adapter-001',
      externalTicketId: 'TICKET-102',
      subject: 'Printer offline on floor 3',
      status: 'pending',
      priority: 'low',
      customerId: 'customer-acme-001',
      customerEmail: 'support@acme.example',
      customerName: 'Acme BVBA',
    },
  ];

  for (const ticket of tickets) {
    await prisma.ticketReference.upsert({
      where: {
        tenantId_adapterId_externalTicketId: {
          tenantId: ticket.tenantId,
          adapterId: ticket.adapterId,
          externalTicketId: ticket.externalTicketId,
        },
      },
      create: ticket,
      update: {
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customerId: ticket.customerId,
        customerEmail: ticket.customerEmail,
        customerName: ticket.customerName,
      },
    });
  }

  // Seed demo connector installations
  const installations = [
    {
      id: 'conn-inst-dev-001',
      tenantId: 'dev-tenant',
      name: 'Local Zammad Sandbox',
      displayName: 'Local Zammad Sandbox',
      description: 'Sandbox internal-note writeback enabled; no public reply; no production writeback.',
      adapterType: 'zammad',
      capabilities: ['read_tickets', 'read_customers', 'write_notes'],
      config: {
        mockMode: false,
        enabled: true,
        validateBeforeWrite: true,
        timeoutMs: 10000,
        capabilities: ['read_tickets', 'read_customers'],
        baseUrlPlaceholder: 'zammad.supportplane-integrations.svc.cluster.local',
      },
      status: 'active',
      mockMode: false,
      enabled: true,
      safetyFlags: {
        validateBeforeWrite: true,
        maxRetries: 3,
        allowRealCalls: true,
        sandboxAllowlistOnly: true,
        writebackEnabled: true,
        secretsResolvedServerSide: true,
      },
      timeoutMs: 10000,
    },
    {
      id: 'conn-inst-osticket-001',
      tenantId: 'dev-tenant',
      name: 'osTicket Read-Only Fixture',
      displayName: 'osTicket Read-Only Fixture',
      description: 'Fixture-backed osTicket read-only adapter. No writeback. No real osTicket service.',
      adapterType: 'osticket',
      capabilities: ['read_tickets', 'read_customers'],
      config: {
        mockMode: false,
        enabled: true,
        baseUrl: 'http://osticket-fixture.local',
        timeoutMs: 10000,
      },
      status: 'active',
      mockMode: false,
      enabled: true,
      safetyFlags: {
        validateBeforeWrite: true,
        maxRetries: 3,
        allowRealCalls: false,
        sandboxAllowlistOnly: true,
        writebackEnabled: false,
        secretsResolvedServerSide: false,
      },
      timeoutMs: 10000,
    },
    {
      id: 'conn-inst-alt-001',
      tenantId: 'alt-tenant',
      name: 'Alt Tenant Mock Connector',
      displayName: 'Alt Tenant Mock Connector',
      description: 'Mock connector for alt-tenant boundary testing.',
      adapterType: 'mock',
      capabilities: ['read_tickets'],
      config: { mode: 'mock' },
      status: 'active',
      mockMode: true,
      enabled: true,
      safetyFlags: { validateBeforeWrite: true, allowRealCalls: false },
      timeoutMs: 3000,
    },
  ];

  for (const inst of installations) {
    await prisma.connectorInstallation.upsert({
      where: { id: inst.id },
      create: inst,
      update: {
        tenantId: inst.tenantId,
        name: inst.name,
        displayName: inst.displayName,
        description: inst.description,
        adapterType: inst.adapterType,
        capabilities: inst.capabilities,
        config: inst.config,
        status: inst.status,
        mockMode: inst.mockMode,
        enabled: inst.enabled,
        safetyFlags: inst.safetyFlags,
        timeoutMs: inst.timeoutMs,
      },
    });
  }

  // Clean up stray credential references from prior test/script runs
  const knownCredIds = ['cred-ref-dev-001', 'cred-ref-dev-002', 'cred-ref-alt-001'];
  await prisma.connectorCredentialReference.deleteMany({
    where: {
      tenantId: { in: ['dev-tenant', 'alt-tenant'] },
      id: { notIn: knownCredIds },
    },
  });

  // Reset installation credential links to known seeded refs only
  await prisma.connectorInstallation.updateMany({
    where: { tenantId: { in: ['dev-tenant', 'alt-tenant'] } },
    data: { secretReferenceIds: [] },
  });

  // Seed demo credential references
  const credentialReferences = [
    {
      id: 'cred-ref-dev-001',
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      displayName: 'OpenBao Zammad Sandbox API Token',
      description: 'Local sandbox OpenBao credential reference. Raw token is resolved server-side only.',
      status: 'active',
      secretKind: 'api_token_placeholder',
      secretRef: 'secret/data/supportplane/dev/zammad',
      createdByUserId: 'dev-admin',
    },
    {
      id: 'cred-ref-dev-002',
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      displayName: 'Dev Zammad Basic Auth (Placeholder)',
      description: 'Local dev placeholder basic auth reference. No real secret stored.',
      status: 'inactive',
      secretKind: 'basic_auth_placeholder',
      secretRef: 'local-dev-placeholder',
      createdByUserId: 'dev-admin',
    },
    {
      id: 'cred-ref-alt-001',
      tenantId: 'alt-tenant',
      connectorType: 'mock',
      displayName: 'Alt Tenant Mock Credential (Placeholder)',
      description: 'Local dev placeholder for alt-tenant. No real secret stored.',
      status: 'active',
      secretKind: 'api_token_placeholder',
      secretRef: 'local-dev-placeholder',
      createdByUserId: 'alt-admin',
    },
  ];

  for (const cred of credentialReferences) {
    await prisma.connectorCredentialReference.upsert({
      where: { id: cred.id },
      create: cred,
      update: {
        tenantId: cred.tenantId,
        connectorType: cred.connectorType,
        displayName: cred.displayName,
        description: cred.description,
        status: cred.status,
        secretKind: cred.secretKind,
        secretRef: cred.secretRef,
        createdByUserId: cred.createdByUserId,
      },
    });
  }

  // Link dev-tenant credential to connector installation
  await prisma.connectorInstallation.update({
    where: { id: 'conn-inst-dev-001' },
    data: { secretReferenceIds: ['cred-ref-dev-001'] },
  });

  // Seed default delivery policies for each tenant
  const policies = [
    {
      id: 'delivery-policy-dev-001',
      tenantId: 'dev-tenant',
      connectorInstallationId: null,
      name: 'Default Delivery Policy',
      enabled: true,
      killSwitch: false,
      dryRunRequired: true,
      mockOnlyEnforced: false,
      allowRealNetworkCalls: false,
      allowedActionTypes: ['ticket_note'],
      approvalRequired: true,
      minimumApproverRole: 'admin',
      requireHumanReview: true,
      requireEvidenceBundleBeforeDelivery: false,
      requireConnectorValidationBeforeDelivery: false,
      retryPolicy: { maxAttempts: 3, baseDelaySeconds: 5, maxDelaySeconds: 300, backoffMultiplier: 2 },
      deadLetterPolicy: { enabled: true, maxAttemptsBeforeDeadLetter: 3, requireManualRetry: true },
      updatedBy: 'dev-admin',
      policyVersion: 1,
      lastValidationStatus: 'valid',
      safetyFlags: { realNetworkAllowed: false, writebackEnabled: false, externalWriteAllowed: false, mockOnly: true, localDevOnly: true },
    },
    {
      id: 'delivery-policy-alt-001',
      tenantId: 'alt-tenant',
      connectorInstallationId: null,
      name: 'Default Delivery Policy',
      enabled: true,
      killSwitch: false,
      dryRunRequired: true,
      mockOnlyEnforced: true,
      allowRealNetworkCalls: false,
      allowedActionTypes: ['ticket_note'],
      approvalRequired: true,
      minimumApproverRole: 'admin',
      requireHumanReview: true,
      requireEvidenceBundleBeforeDelivery: false,
      requireConnectorValidationBeforeDelivery: false,
      retryPolicy: { maxAttempts: 3, baseDelaySeconds: 5, maxDelaySeconds: 300, backoffMultiplier: 2 },
      deadLetterPolicy: { enabled: true, maxAttemptsBeforeDeadLetter: 3, requireManualRetry: true },
      updatedBy: 'alt-admin',
      policyVersion: 1,
      lastValidationStatus: 'valid',
      safetyFlags: { realNetworkAllowed: false, writebackEnabled: false, externalWriteAllowed: false, mockOnly: true, localDevOnly: true },
    },
  ];

  for (const policy of policies) {
    await prisma.deliveryPolicy.upsert({
      where: { id: policy.id },
      create: policy,
      update: {
        name: policy.name,
        enabled: policy.enabled,
        killSwitch: policy.killSwitch,
        dryRunRequired: policy.dryRunRequired,
        mockOnlyEnforced: policy.mockOnlyEnforced,
        allowRealNetworkCalls: policy.allowRealNetworkCalls,
        allowedActionTypes: policy.allowedActionTypes,
        approvalRequired: policy.approvalRequired,
        minimumApproverRole: policy.minimumApproverRole,
        requireHumanReview: policy.requireHumanReview,
        requireEvidenceBundleBeforeDelivery: policy.requireEvidenceBundleBeforeDelivery,
        requireConnectorValidationBeforeDelivery: policy.requireConnectorValidationBeforeDelivery,
        retryPolicy: policy.retryPolicy,
        deadLetterPolicy: policy.deadLetterPolicy,
        updatedBy: policy.updatedBy,
        policyVersion: policy.policyVersion,
        lastValidationStatus: policy.lastValidationStatus,
        safetyFlags: policy.safetyFlags,
      },
    });
  }

  const endpointDevices = [
    {
      id: 'endpoint-linux-001',
      tenantId: 'dev-tenant',
      displayName: 'Linux Workstation',
      hostname: 'linux-workstation',
      deviceKey: 'linux-workstation-key',
      tokenHash: 'local-hash-linux',
      fingerprint: 'fp-linux-workstation',
      platform: 'linux',
      agentVersion: '0.1.0-readonly',
      status: 'online',
      lastSeenAt: new Date(),
      enrolledAt: new Date(),
    },
    {
      id: 'endpoint-windows-001',
      tenantId: 'dev-tenant',
      displayName: 'Windows Endpoint (Mock)',
      hostname: 'windows-mock-host',
      deviceKey: 'windows-mock-key',
      tokenHash: 'local-hash-windows',
      fingerprint: 'fp-windows-mock',
      platform: 'win32',
      agentVersion: '0.1.0-readonly',
      status: 'online',
      lastSeenAt: new Date(),
      enrolledAt: new Date(),
    },
  ];

  for (const device of endpointDevices) {
    await prisma.endpointDevice.upsert({
      where: { id: device.id },
      create: device,
      update: {
        displayName: device.displayName,
        hostname: device.hostname,
        platform: device.platform,
        agentVersion: device.agentVersion,
        status: device.status,
        lastSeenAt: device.lastSeenAt,
      },
    });
  }

  // Seed knowledge sources
  const knowledgeSources = [
    {
      id: 'kb-source-dev-001',
      tenantId: 'dev-tenant',
      name: 'Acme Internal KB',
      description: 'Local demo knowledge base for Acme support team.',
      adapterType: 'manual',
      status: 'active',
      config: {},
    },
    {
      id: 'kb-source-dev-002',
      tenantId: 'dev-tenant',
      name: 'Known Issues',
      description: 'Common IT support issues and resolutions.',
      adapterType: 'manual',
      status: 'active',
      config: {},
    },
  ];

  for (const source of knowledgeSources) {
    await prisma.knowledgeSource.upsert({
      where: { id: source.id },
      create: source,
      update: source,
    });
  }

  // Seed demo knowledge articles
  const knowledgeArticles = [
    {
      id: 'kb-article-001',
      tenantId: 'dev-tenant',
      sourceId: 'kb-source-dev-001',
      title: 'VPN Connection Troubleshooting',
      content: 'If users cannot connect to the corporate VPN, first verify that the VPN client is up to date. Check network adapter settings and ensure split tunneling is enabled. For Windows endpoints, run the diagnostic.network tool to verify adapter state. For Linux endpoints, check `ip route` output. If DNS resolution fails after connection, the flush_dns_cache remediation may help once approved.',
      tags: ['vpn', 'network', 'connectivity'],
      metadata: { category: 'networking', priority: 'high' },
      status: 'published',
    },
    {
      id: 'kb-article-002',
      tenantId: 'dev-tenant',
      sourceId: 'kb-source-dev-001',
      title: 'Printer Offline on Windows',
      content: 'When a printer shows offline on a Windows endpoint, verify the print spooler service is running. Use the device console to check the endpoint status. If the spooler is stopped, a service restart may be required (requires approval). Ensure the printer is reachable on the network using ping from the endpoint.',
      tags: ['printer', 'windows', 'services'],
      metadata: { category: 'hardware', priority: 'normal' },
      status: 'published',
    },
    {
      id: 'kb-article-003',
      tenantId: 'dev-tenant',
      sourceId: 'kb-source-dev-002',
      title: 'Disk Space Warning on Linux Workstations',
      content: 'Linux workstations may report disk space warnings due to accumulated logs in /var/log. Use the diagnostic.disk tool to verify available space. If /tmp or /var/log are above 90% usage, clear temporary files with approval. Monitor using the endpoint agent inventory snapshot.',
      tags: ['disk', 'linux', 'monitoring'],
      metadata: { category: 'storage', priority: 'high' },
      status: 'published',
    },
    {
      id: 'kb-article-004',
      tenantId: 'dev-tenant',
      sourceId: 'kb-source-dev-002',
      title: 'Endpoint Agent Registration Failure',
      content: 'If an endpoint agent fails to register, verify the enrollment token is correct and not expired. Check that the device can reach the API at the configured SUPPORTPLANE_API_URL. Ensure the tenant ID matches the device tenant. Review audit events for registration attempts.',
      tags: ['endpoint', 'agent', 'registration'],
      metadata: { category: 'agent', priority: 'critical' },
      status: 'published',
    },
  ];

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticle.upsert({
      where: { id: article.id },
      create: article,
      update: article,
    });
  }

  console.log('Seeded local demo tenants, roles, users, adapters, customers, tickets, connector installations, credential references, delivery policies, endpoint devices, knowledge sources, and articles');
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
