-- CreateEnum
CREATE TYPE "Vertical" AS ENUM ('law', 'accounting', 'ria', 'other');

-- CreateEnum
CREATE TYPE "PersonaRole" AS ENUM ('economic_buyer', 'champion', 'it', 'other');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('posture_assessment', 'red_teaming', 'remediation', 'ai_enablement');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('call', 'email', 'note', 'meeting', 'task');

-- CreateEnum
CREATE TYPE "RelatedKind" AS ENUM ('company', 'contact', 'deal', 'ticket');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'pending', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'working', 'nurture', 'converted', 'disqualified');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vertical" "Vertical" NOT NULL DEFAULT 'law',
    "website" TEXT,
    "domain" TEXT,
    "linkedinUrl" TEXT,
    "state" TEXT,
    "county" TEXT,
    "city" TEXT,
    "attorneyCount" INTEGER,
    "staffCount" INTEGER,
    "practiceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "independent" BOOLEAN NOT NULL DEFAULT true,
    "aiAdoptionSignals" JSONB NOT NULL DEFAULT '{}',
    "triggerEvents" JSONB NOT NULL DEFAULT '[]',
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "geoTier" TEXT NOT NULL DEFAULT 'us',
    "disqualified" BOOLEAN NOT NULL DEFAULT false,
    "leadStatus" "LeadStatus" NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "personaRole" "PersonaRole" NOT NULL DEFAULT 'other',
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'posture_assessment',
    "stage" TEXT NOT NULL DEFAULT 'new',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 5,
    "expectedClose" TIMESTAMP(3),
    "source" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "relatedType" "RelatedKind" NOT NULL,
    "relatedId" TEXT NOT NULL,
    "type" "ActivityKind" NOT NULL DEFAULT 'note',
    "body" TEXT NOT NULL DEFAULT '',
    "dueAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "priority" "TicketPriority" NOT NULL DEFAULT 'medium',
    "assignee" TEXT,
    "resolutionNotes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filterJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "weights" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "requested" INTEGER NOT NULL DEFAULT 0,
    "discovered" INTEGER NOT NULL DEFAULT 0,
    "qualified" INTEGER NOT NULL DEFAULT 0,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "activeAfter" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "Company_priorityScore_idx" ON "Company"("priorityScore");

-- CreateIndex
CREATE INDEX "Company_leadStatus_idx" ON "Company"("leadStatus");

-- CreateIndex
CREATE INDEX "Company_disqualified_idx" ON "Company"("disqualified");

-- CreateIndex
CREATE INDEX "Company_state_idx" ON "Company"("state");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Activity_relatedType_relatedId_idx" ON "Activity"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Ticket_companyId_idx" ON "Ticket"("companyId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_key_key" ON "PipelineStage"("key");

-- CreateIndex
CREATE INDEX "ProspectRun_createdAt_idx" ON "ProspectRun"("createdAt");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

