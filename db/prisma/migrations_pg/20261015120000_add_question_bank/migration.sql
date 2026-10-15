BEGIN;

-- CreateEnum
CREATE TYPE "QuestionBankScope" AS ENUM ('PERSONAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "BankQuestionStatus" AS ENUM ('DRAFT', 'READY', 'DISABLED');

-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "scope" "QuestionBankScope" NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_question" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "stem" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "status" "BankQuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "fingerprint" TEXT NOT NULL,
    "sourceQuestionId" TEXT,
    "sourceBankName" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_knowledge_point" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "question_knowledge_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_paper" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_paper_section" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "question_paper_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_paper_item" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "sourceBankName" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "score" DECIMAL(6,2) NOT NULL,
    "answerLines" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "question_paper_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_import_batch" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "importedCount" INTEGER NOT NULL,
    "duplicateCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BankQuestionToQuestionKnowledgePoint" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BankQuestionToQuestionKnowledgePoint_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "question_bank_ownerId_scope_archived_idx" ON "question_bank"("ownerId", "scope", "archived");

-- CreateIndex
CREATE INDEX "question_bank_scope_archived_idx" ON "question_bank"("scope", "archived");

-- CreateIndex
CREATE INDEX "bank_question_bankId_status_updatedAt_idx" ON "bank_question"("bankId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "bank_question_subject_stage_type_idx" ON "bank_question"("subject", "stage", "type");

-- CreateIndex
CREATE UNIQUE INDEX "bank_question_bankId_fingerprint_key" ON "bank_question"("bankId", "fingerprint");

-- CreateIndex
CREATE INDEX "question_knowledge_point_parentId_idx" ON "question_knowledge_point"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "question_knowledge_point_bankId_name_key" ON "question_knowledge_point"("bankId", "name");

-- CreateIndex
CREATE INDEX "question_paper_ownerId_archived_updatedAt_idx" ON "question_paper"("ownerId", "archived", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "question_paper_section_paperId_position_key" ON "question_paper_section"("paperId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "question_paper_item_sectionId_position_key" ON "question_paper_item"("sectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "question_import_batch_requestKey_key" ON "question_import_batch"("requestKey");

-- CreateIndex
CREATE INDEX "question_import_batch_actorId_createdAt_idx" ON "question_import_batch"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "question_import_batch_bankId_createdAt_idx" ON "question_import_batch"("bankId", "createdAt");

-- CreateIndex
CREATE INDEX "_BankQuestionToQuestionKnowledgePoint_B_index" ON "_BankQuestionToQuestionKnowledgePoint"("B");

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question" ADD CONSTRAINT "bank_question_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_knowledge_point" ADD CONSTRAINT "question_knowledge_point_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_knowledge_point" ADD CONSTRAINT "question_knowledge_point_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "question_knowledge_point"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_paper_section" ADD CONSTRAINT "question_paper_section_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "question_paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_paper_item" ADD CONSTRAINT "question_paper_item_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "question_paper_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_import_batch" ADD CONSTRAINT "question_import_batch_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_import_batch" ADD CONSTRAINT "question_import_batch_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BankQuestionToQuestionKnowledgePoint" ADD CONSTRAINT "_BankQuestionToQuestionKnowledgePoint_A_fkey" FOREIGN KEY ("A") REFERENCES "bank_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BankQuestionToQuestionKnowledgePoint" ADD CONSTRAINT "_BankQuestionToQuestionKnowledgePoint_B_fkey" FOREIGN KEY ("B") REFERENCES "question_knowledge_point"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Public banks belong to the platform and survive deletion of a maintainer account.
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_scope_owner_check"
CHECK (
    ("scope" = 'PERSONAL' AND "ownerId" IS NOT NULL)
    OR ("scope" = 'PUBLIC' AND "ownerId" IS NULL)
);

ALTER TABLE "bank_question" ADD CONSTRAINT "bank_question_difficulty_check"
CHECK ("difficulty" BETWEEN 1 AND 5);

ALTER TABLE "question_paper_item" ADD CONSTRAINT "question_paper_item_values_check"
CHECK ("score" >= 0 AND "score" <= 9999 AND "answerLines" BETWEEN 0 AND 30);

COMMIT;
