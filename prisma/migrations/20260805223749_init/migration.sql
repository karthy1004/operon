-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'ADMIN', 'OPS_MANAGER', 'OPS_ASSOCIATE', 'CUSTOMER', 'ORG_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'QUALIFIED_LEAD', 'DISCOVERY_CALL_SCHEDULED', 'DISCOVERY_CALL_COMPLETED', 'PROPOSAL_SENT', 'NEGOTIATION', 'PROPOSAL_ACCEPTED', 'PAYMENT_RECEIVED', 'ACCOUNT_CREATED', 'ONBOARDING_STARTED', 'DOCUMENTS_UPLOADED', 'CAREER_PROFILE_COMPLETED', 'TEAM_ASSIGNED', 'SERVICE_ACTIVATED', 'APPLICATIONS_IN_PROGRESS', 'INTERVIEW_PHASE', 'OFFER_RECEIVED', 'SERVICE_COMPLETED', 'RENEWAL', 'ALUMNI', 'LOST', 'CHURNED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DISCOVERED', 'SAVED', 'AI_MATCH_SCORE_GENERATED', 'HUMAN_REVIEW', 'ARCHIVED', 'APPROVED_FOR_APPLICATION', 'CONVERTED_TO_APPLICATION');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('IDENTIFIED', 'EVALUATED', 'APPROVED_OPPORTUNITY', 'PREPARING', 'INTERNAL_REVIEW', 'WAITING_APPROVAL', 'APPROVED', 'READY_FOR_SUBMISSION', 'SUBMITTED', 'SUBMISSION_VERIFIED', 'TRACKING', 'RECRUITER_RESPONSE', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('MODE_A_CUSTOMER_APPROVAL', 'MODE_B_AUTO_SUBMIT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'AI_REVIEW', 'OPERATIONS_REVIEW', 'CUSTOMER_REVIEW', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'COVER_LETTER', 'PORTFOLIO', 'LINKEDIN_EXPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'VERIFIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('JOB_SEARCH', 'RESUME_REVIEW', 'APPLICATION_PREPARATION', 'CUSTOMER_FOLLOW_UP', 'INTERVIEW_TRACKING', 'DOCUMENT_COLLECTION', 'AI_REVIEW');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'PREPARATION', 'COMPLETED', 'FEEDBACK_RECORDED', 'NEXT_ROUND_SCHEDULED', 'CLOSED_OFFER', 'CLOSED_REJECTED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('CREATED', 'DELIVERED', 'READ', 'REPLIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('PLATFORM_CHAT', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPROVAL_REQUIRED', 'INTERVIEW_SCHEDULED', 'WEEKLY_REPORT_READY', 'FOLLOW_UP_DUE');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('UNIVERSITY', 'EMPLOYER', 'OTHER');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "billingContact" TEXT NOT NULL,
    "invoiceTerms" TEXT,
    "seatsPurchased" INTEGER NOT NULL DEFAULT 0,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "invitedEmail" TEXT NOT NULL,
    "invitedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SeatStatus" NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "profilePhoto" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "timeZone" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "status" "CustomerStatus" NOT NULL DEFAULT 'LEAD',
    "onboardingStage" TEXT,
    "assignedManagerId" TEXT,
    "assignedAssociateId" TEXT,
    "activeServicePlanTier" INTEGER,
    "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'MODE_B_AUTO_SUBMIT',
    "organizationId" TEXT,
    "renewalDate" TIMESTAMP(3),
    "subscriptionStatus" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "yearsExperience" INTEGER,
    "currentPosition" TEXT,
    "currentEmployer" TEXT,
    "targetRoles" TEXT[],
    "preferredIndustries" TEXT[],
    "preferredLocations" TEXT[],
    "remotePreference" TEXT,
    "salaryRangeMin" INTEGER,
    "salaryRangeMax" INTEGER,
    "workAuthCountry" TEXT,
    "visaType" TEXT,
    "visaExpiration" TIMESTAMP(3),
    "sponsorshipRequired" BOOLEAN NOT NULL DEFAULT false,
    "linkedin" TEXT,
    "github" TEXT,
    "portfolio" TEXT,
    "personalWebsite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'JOB_APPLICATION_OPERATIONS',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'JOB_APPLICATION_OPERATIONS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "size" TEXT,
    "headquarters" TEXT,
    "website" TEXT,
    "atsPlatform" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" TEXT,
    "salary" TEXT,
    "remoteStatus" TEXT,
    "jobUrl" TEXT,
    "source" TEXT,
    "postingDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "aiMatchScore" INTEGER,
    "status" "JobStatus" NOT NULL DEFAULT 'DISCOVERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "targetRoleArchetype" TEXT,
    "industry" TEXT,
    "keywords" TEXT[],
    "skillsEmphasized" TEXT[],
    "fileUrl" TEXT NOT NULL,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "storageLocation" TEXT NOT NULL DEFAULT 'vercel-blob',
    "createdById" TEXT,
    "uploadedById" TEXT,
    "ownerId" TEXT,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "assignedAssociateId" TEXT,
    "assignedManagerId" TEXT,
    "resumeVersionId" TEXT,
    "coverLetterId" TEXT,
    "portfolioId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'MODE_B_AUTO_SUBMIT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "customerComments" TEXT,
    "approvalDate" TIMESTAMP(3),
    "submissionTimestamp" TIMESTAMP(3),
    "submissionPlatform" TEXT,
    "confirmationNumber" TEXT,
    "submittedById" TEXT,
    "interviewReceived" BOOLEAN NOT NULL DEFAULT false,
    "offerReceived" BOOLEAN NOT NULL DEFAULT false,
    "rejected" BOOLEAN NOT NULL DEFAULT false,
    "closingReason" TEXT,
    "qualityScore" INTEGER,
    "aiMatchScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'CREATED',
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "relatedCustomerId" TEXT,
    "relatedApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "customerId" TEXT NOT NULL,
    "companyId" TEXT,
    "role" TEXT,
    "round" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "interviewType" TEXT,
    "interviewer" TEXT,
    "feedback" TEXT,
    "outcome" TEXT,
    "nextAction" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'PLATFORM_CHAT',
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "relatedCustomerId" TEXT NOT NULL,
    "relatedApplicationId" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'DELIVERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "actorLabel" TEXT NOT NULL DEFAULT 'SYSTEM',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "notes" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "seats_customerId_key" ON "seats"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_userId_key" ON "customers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerNumber_key" ON "customers"("customerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customers_stripeCustomerId_key" ON "customers"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_stripeSubscriptionId_key" ON "customers"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_customerId_key" ON "customer_profiles"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_previousVersionId_key" ON "documents"("previousVersionId");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_assignedManagerId_fkey" FOREIGN KEY ("assignedManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_assignedAssociateId_fkey" FOREIGN KEY ("assignedAssociateId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assignedAssociateId_fkey" FOREIGN KEY ("assignedAssociateId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assignedManagerId_fkey" FOREIGN KEY ("assignedManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "resume_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_relatedCustomerId_fkey" FOREIGN KEY ("relatedCustomerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_relatedApplicationId_fkey" FOREIGN KEY ("relatedApplicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_relatedCustomerId_fkey" FOREIGN KEY ("relatedCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_relatedApplicationId_fkey" FOREIGN KEY ("relatedApplicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
