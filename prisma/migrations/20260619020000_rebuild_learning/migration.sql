-- Rebuild the Learning section: replace the flat track/item model with a
-- Track -> Module -> Item hierarchy plus per-founder goals. The old learning
-- tables are dropped (their content is intentionally wiped — see build spec).

-- DropTable (old flat learning model)
DROP TABLE IF EXISTS "LearningProgress" CASCADE;
DROP TABLE IF EXISTS "LearningItem" CASCADE;

-- CreateTable
CREATE TABLE "LearningTrack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "accentColor" TEXT NOT NULL DEFAULT 'emerald',
    "estDuration" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LearningTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningModule" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LearningModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningItem" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LearningItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningTrack_slug_key" ON "LearningTrack"("slug");
CREATE INDEX "LearningModule_trackId_idx" ON "LearningModule"("trackId");
CREATE INDEX "LearningItem_moduleId_idx" ON "LearningItem"("moduleId");
CREATE INDEX "LearningProgress_userId_idx" ON "LearningProgress"("userId");
CREATE UNIQUE INDEX "LearningProgress_userId_itemId_key" ON "LearningProgress"("userId", "itemId");
CREATE INDEX "LearningGoal_userId_idx" ON "LearningGoal"("userId");
CREATE UNIQUE INDEX "LearningGoal_userId_trackId_key" ON "LearningGoal"("userId", "trackId");

-- AddForeignKey
ALTER TABLE "LearningModule" ADD CONSTRAINT "LearningModule_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningGoal" ADD CONSTRAINT "LearningGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningGoal" ADD CONSTRAINT "LearningGoal_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
