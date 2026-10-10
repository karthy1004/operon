// Seeds a fully-populated demo Customer for prototype/demo purposes —
// bypasses Stripe entirely. The user must already exist locally (sign up,
// then visit /welcome once so the Clerk->User lazy-sync fires) before
// running this.
//
// Usage: node scripts/seed-demo-customer.mjs <email>

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/seed-demo-customer.mjs <email>");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(
    `No local User found for ${email}. Sign up, then visit /welcome once first so the account syncs.`
  );
  process.exit(1);
}

const existing = await prisma.customer.findUnique({ where: { userId: user.id } });
if (existing) {
  console.log(`Customer already exists for ${email} (id: ${existing.id}). Nothing to do.`);
  process.exit(0);
}

const companies = [
  { name: "Stripe", industry: "Fintech" },
  { name: "Notion", industry: "SaaS" },
  { name: "Anthropic", industry: "AI" },
  { name: "Figma", industry: "Design Tools" },
  { name: "Ramp", industry: "Fintech" },
  { name: "Linear", industry: "Dev Tools" },
];

const companyRecords = {};
for (const c of companies) {
  companyRecords[c.name] = await prisma.company.create({ data: c });
}

const customer = await prisma.customer.create({
  data: {
    userId: user.id,
    status: "APPLICATIONS_IN_PROGRESS",
    onboardingStage: "Service begins",
    activeServicePlanTier: 1,
    approvalMode: "MODE_A_CUSTOMER_APPROVAL",
    subscriptionStatus: "demo",
  },
});

await prisma.customerProfile.create({
  data: {
    customerId: customer.id,
    headline: "Product Manager",
    summary: "8 years of product experience across fintech and growth.",
    yearsExperience: 8,
    targetRoles: ["Product Manager", "Senior PM"],
    preferredIndustries: ["Fintech", "SaaS"],
    preferredLocations: ["Remote", "San Francisco, CA"],
    remotePreference: "Remote",
  },
});

const resumeFintech = await prisma.resumeVersion.create({
  data: {
    customerId: customer.id,
    targetRoleArchetype: "PM — Fintech",
    industry: "Fintech",
    fileUrl: "https://example.com/demo/resume-fintech.pdf",
    status: "ACTIVE",
    isMaster: false,
  },
});

const resumeGrowth = await prisma.resumeVersion.create({
  data: {
    customerId: customer.id,
    targetRoleArchetype: "PM — Growth",
    industry: "SaaS",
    fileUrl: "https://example.com/demo/resume-growth.pdf",
    status: "ACTIVE",
    isMaster: false,
  },
});

const jobs = [
  {
    company: "Stripe",
    position: "Senior Product Manager",
    status: "SUBMITTED",
    resume: resumeFintech,
    matchScore: 91,
  },
  {
    company: "Notion",
    position: "PM, Growth",
    status: "INTERVIEW",
    resume: resumeGrowth,
    matchScore: 87,
  },
  {
    company: "Anthropic",
    position: "Product Manager",
    status: "WAITING_APPROVAL",
    resume: resumeFintech,
    matchScore: 84,
  },
  {
    company: "Ramp",
    position: "Senior PM, Payments",
    status: "WAITING_APPROVAL",
    resume: resumeFintech,
    matchScore: 88,
  },
  {
    company: "Figma",
    position: "Product Manager",
    status: "OFFER",
    resume: resumeGrowth,
    matchScore: 93,
  },
  {
    company: "Linear",
    position: "Product Manager",
    status: "REJECTED",
    resume: resumeGrowth,
    matchScore: 79,
  },
];

for (const j of jobs) {
  const job = await prisma.job.create({
    data: {
      companyId: companyRecords[j.company].id,
      position: j.position,
      status: "CONVERTED_TO_APPLICATION",
      aiMatchScore: j.matchScore,
    },
  });

  await prisma.application.create({
    data: {
      customerId: customer.id,
      jobId: job.id,
      resumeVersionId: j.resume.id,
      status: j.status,
      approvalMode: "MODE_A_CUSTOMER_APPROVAL",
      approvalStatus: j.status === "WAITING_APPROVAL" ? "PENDING" : "APPROVED",
      aiMatchScore: j.matchScore,
      interviewReceived: j.status === "INTERVIEW" || j.status === "OFFER",
      offerReceived: j.status === "OFFER",
      rejected: j.status === "REJECTED",
    },
  });
}

await prisma.activityLog.create({
  data: {
    userId: null,
    actorLabel: "SYSTEM",
    action: "DEMO_CUSTOMER_SEEDED",
    entityType: "Customer",
    entityId: customer.id,
    previousState: null,
    newState: "APPLICATIONS_IN_PROGRESS",
    notes: "Seeded for prototype demo — bypassed Stripe.",
  },
});

console.log(`Seeded demo customer for ${email}: customerId=${customer.id}, ${jobs.length} applications created.`);
await prisma.$disconnect();
