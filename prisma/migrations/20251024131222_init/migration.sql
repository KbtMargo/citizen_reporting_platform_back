-- DropIndex
DROP INDEX "public"."report_geom_gist_idx";

-- AlterTable
ALTER TABLE "OSBB" ALTER COLUMN "invitationCode" DROP DEFAULT;
