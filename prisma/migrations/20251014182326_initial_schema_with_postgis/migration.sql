-- ============================================================
-- Enable PostGIS (safe / idempotent)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- ENUM TYPES (safe creation)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('RESIDENT', 'OSBB_ADMIN', 'RECIPIENT', 'ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportStatus') THEN
    CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM ('STATUS_UPDATE', 'RESPONSE', 'REMINDER', 'SYSTEM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationPriority') THEN
    CREATE TYPE "NotificationPriority" AS ENUM ('URGENT', 'NORMAL', 'LOW');
  END IF;
END$$;

-- ============================================================
-- TABLES (safe creation)
-- ============================================================

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'RESIDENT',
  "osbbId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "OSBB" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "address" TEXT,
  "invitationCode" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "icon" TEXT
);

CREATE TABLE IF NOT EXISTS "Recipient" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "contactInfo" TEXT
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "lat" DECIMAL(9,6) NOT NULL,
  "lng" DECIMAL(9,6) NOT NULL,
  "geom" geography(Point,4326),
  "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
  "authorId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "ReportUpdate" (
  "id" TEXT PRIMARY KEY,
  "description" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'STATUS_UPDATE',
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" TEXT NOT NULL,
  "reportId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "File" (
  "id" TEXT PRIMARY KEY,
  "bucket" TEXT NOT NULL,
  "key" TEXT NOT NULL UNIQUE,
  "mime" TEXT,
  "bytes" INTEGER,
  "reportId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES (safe creation)
-- ============================================================
CREATE INDEX IF NOT EXISTS "Report_authorId_idx" ON "Report"("authorId");
CREATE INDEX IF NOT EXISTS "Report_categoryId_idx" ON "Report"("categoryId");
CREATE INDEX IF NOT EXISTS "Report_recipientId_idx" ON "Report"("recipientId");
CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report"("status");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_reportId_idx" ON "Notification"("reportId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_createdAt_idx" ON "Notification"("isRead","createdAt");

-- ============================================================
-- FOREIGN KEYS (safe creation)
-- ============================================================

DO $$
BEGIN
  -- User → OSBB
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_osbbId_fkey') THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_osbbId_fkey"
      FOREIGN KEY ("osbbId") REFERENCES "OSBB"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- Report relations
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Report_authorId_fkey') THEN
    ALTER TABLE "Report"
      ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Report_categoryId_fkey') THEN
    ALTER TABLE "Report"
      ADD CONSTRAINT "Report_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Report_recipientId_fkey') THEN
    ALTER TABLE "Report"
      ADD CONSTRAINT "Report_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  -- ReportUpdate relations
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReportUpdate_reportId_fkey') THEN
    ALTER TABLE "ReportUpdate"
      ADD CONSTRAINT "ReportUpdate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReportUpdate_authorId_fkey') THEN
    ALTER TABLE "ReportUpdate"
      ADD CONSTRAINT "ReportUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  -- Notification relations
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_reportId_fkey') THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- File relation
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'File_reportId_fkey') THEN
    ALTER TABLE "File"
      ADD CONSTRAINT "File_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- ============================================================
-- GIST index for geography(Point,4326)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'report_geom_gist_idx'
  ) THEN
    EXECUTE 'CREATE INDEX report_geom_gist_idx ON "Report" USING GIST ("geom")';
  END IF;
END$$;
