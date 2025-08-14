-- AlterTable
ALTER TABLE "applications" ADD COLUMN "candidateCity" TEXT;
ALTER TABLE "applications" ADD COLUMN "candidateCountry" TEXT;
ALTER TABLE "applications" ADD COLUMN "candidateIP" TEXT;
ALTER TABLE "applications" ADD COLUMN "candidateLatitude" REAL;
ALTER TABLE "applications" ADD COLUMN "candidateLongitude" REAL;
ALTER TABLE "applications" ADD COLUMN "candidateState" TEXT;
