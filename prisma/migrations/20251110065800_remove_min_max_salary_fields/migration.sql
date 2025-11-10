/*
  Warnings:

  - You are about to drop the column `maxSalary` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `minSalary` on the `jobs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "location" TEXT,
    "salary" TEXT,
    "requirements" TEXT,
    "experienceLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "embedCode" TEXT,
    "imageUrl" TEXT,
    "bannerImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "formId" TEXT,
    CONSTRAINT "jobs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jobs_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "jobs_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_jobs" ("assigneeId", "bannerImageUrl", "createdAt", "creatorId", "department", "description", "embedCode", "experienceLevel", "formId", "id", "imageUrl", "isExternal", "location", "position", "requirements", "salary", "status", "title", "updatedAt") SELECT "assigneeId", "bannerImageUrl", "createdAt", "creatorId", "department", "description", "embedCode", "experienceLevel", "formId", "id", "imageUrl", "isExternal", "location", "position", "requirements", "salary", "status", "title", "updatedAt" FROM "jobs";
DROP TABLE "jobs";
ALTER TABLE "new_jobs" RENAME TO "jobs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
