import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create a test organization
  const testOrg = await prisma.org.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
    },
  })

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Create org membership
  await prisma.orgMembership.upsert({
    where: {
      userId_orgId: {
        userId: testUser.id,
        orgId: testOrg.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      orgId: testOrg.id,
      role: 'OWNER',
    },
  })

  // Create a test document
  const testDocument = await prisma.document.create({
    data: {
      orgId: testOrg.id,
      uploaderId: testUser.id,
      filename: 'test-contract.pdf',
      originalName: 'Test Contract.pdf',
      path: '/uploads/test-contract.pdf',
      size: 1024000,
      mimeType: 'application/pdf',
      status: 'UPLOADED',
    },
  })

  // Create a test analysis
  const testAnalysis = await prisma.analysis.create({
    data: {
      documentId: testDocument.id,
      status: 'COMPLETED',
      riskScore: 7.5,
      summary: 'This contract contains several medium-risk clauses that require attention.',
      completedAt: new Date(),
    },
  })

  // Create test findings
  await prisma.finding.createMany({
    data: [
      {
        analysisId: testAnalysis.id,
        type: 'LEGAL',
        severity: 'HIGH',
        title: 'Liability Cap Missing',
        description: 'The contract does not include a liability cap clause, which could expose the organization to unlimited damages.',
        location: 'Section 8.2',
        suggestion: 'Add a liability cap clause limiting damages to the contract value.',
      },
      {
        analysisId: testAnalysis.id,
        type: 'COMPLIANCE',
        severity: 'MEDIUM',
        title: 'GDPR Compliance Gap',
        description: 'Data processing clauses may not be fully compliant with GDPR requirements.',
        location: 'Section 12.1',
        suggestion: 'Review and update data processing terms to ensure GDPR compliance.',
      },
      {
        analysisId: testAnalysis.id,
        type: 'FINANCIAL',
        severity: 'LOW',
        title: 'Payment Terms Unclear',
        description: 'Payment terms could be more specific regarding late payment penalties.',
        location: 'Section 4.3',
        suggestion: 'Specify exact late payment penalties and interest rates.',
      },
    ],
  })

  // Create a test reminder
  await prisma.reminder.create({
    data: {
      analysisId: testAnalysis.id,
      title: 'Review Liability Clause',
      description: 'Follow up on the missing liability cap clause with legal team.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  })

  // Create a test subscription
  await prisma.subscription.create({
    data: {
      orgId: testOrg.id,
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
    },
  })

  // Create audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        userId: testUser.id,
        documentId: testDocument.id,
        action: 'DOCUMENT_UPLOADED',
        details: { filename: 'test-contract.pdf', size: 1024000 },
        ipAddress: '127.0.0.1',
      },
      {
        userId: testUser.id,
        documentId: testDocument.id,
        action: 'ANALYSIS_COMPLETED',
        details: { riskScore: 7.5, findingsCount: 3 },
        ipAddress: '127.0.0.1',
      },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log(`📊 Created:`)
  console.log(`   - Organization: ${testOrg.name}`)
  console.log(`   - User: ${testUser.email}`)
  console.log(`   - Document: ${testDocument.filename}`)
  console.log(`   - Analysis with 3 findings`)
  console.log(`   - 1 reminder`)
  console.log(`   - Subscription: ${testOrg.name}`)
  console.log(`   - 2 audit log entries`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
