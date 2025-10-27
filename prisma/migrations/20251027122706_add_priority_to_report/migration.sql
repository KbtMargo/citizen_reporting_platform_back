-- CreateEnum
CREATE TYPE "ReportPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "priority" "ReportPriority" NOT NULL DEFAULT 'NORMAL';
