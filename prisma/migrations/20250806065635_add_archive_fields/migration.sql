-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "candidateName" TEXT,
    "candidateEmail" TEXT,
    "candidatePhone" TEXT,
    "resume" TEXT,
    "coverLetter" TEXT,
    "remarks" TEXT,
    "resumePath" TEXT,
    "formData" TEXT NOT NULL,
    "sourceDomain" TEXT,
    "sourceUrl" TEXT,
    "userAgent" TEXT,
    "candidateCity" TEXT,
    "candidateState" TEXT,
    "candidateCountry" TEXT,
    "candidateLatitude" REAL,
    "candidateLongitude" REAL,
    "candidateIP" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "archivedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobId" TEXT NOT NULL,
    "applicantId" TEXT,
    CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_applications" ("applicantId", "candidateCity", "candidateCountry", "candidateEmail", "candidateIP", "candidateLatitude", "candidateLongitude", "candidateName", "candidatePhone", "candidateState", "coverLetter", "createdAt", "formData", "id", "jobId", "remarks", "resume", "resumePath", "sourceDomain", "sourceUrl", "status", "updatedAt", "userAgent") SELECT "applicantId", "candidateCity", "candidateCountry", "candidateEmail", "candidateIP", "candidateLatitude", "candidateLongitude", "candidateName", "candidatePhone", "candidateState", "coverLetter", "createdAt", "formData", "id", "jobId", "remarks", "resume", "resumePath", "sourceDomain", "sourceUrl", "status", "updatedAt", "userAgent" FROM "applications";
DROP TABLE "applications";
ALTER TABLE "new_applications" RENAME TO "applications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
