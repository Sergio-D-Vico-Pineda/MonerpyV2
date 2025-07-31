-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "familyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "color" TEXT NOT NULL DEFAULT '#6172F3',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "Account_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accountType", "balance", "color", "createdAt", "deletedAt", "familyId", "id", "name", "updatedAt") SELECT "accountType", "balance", "color", "createdAt", "deletedAt", "familyId", "id", "name", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE INDEX "Account_familyId_idx" ON "Account"("familyId");
CREATE INDEX "Account_accountType_idx" ON "Account"("accountType");
CREATE TABLE "new_AccountBalance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "cashBalance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "AccountBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AccountBalance" ("accountId", "balance", "cashBalance", "createdAt", "date", "deletedAt", "id", "updatedAt") SELECT "accountId", "balance", "cashBalance", "createdAt", "date", "deletedAt", "id", "updatedAt" FROM "AccountBalance";
DROP TABLE "AccountBalance";
ALTER TABLE "new_AccountBalance" RENAME TO "AccountBalance";
CREATE INDEX "AccountBalance_accountId_date_idx" ON "AccountBalance"("accountId", "date" DESC);
CREATE UNIQUE INDEX "AccountBalance_accountId_date_key" ON "AccountBalance"("accountId", "date");
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "familyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6172F3',
    "parentId" INTEGER,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "Category_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("color", "createdAt", "deletedAt", "familyId", "id", "name", "parentId", "updatedAt") SELECT "color", "createdAt", "deletedAt", "familyId", "id", "name", "parentId", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_familyId_idx" ON "Category"("familyId");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE TABLE "new_Family" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT
);
INSERT INTO "new_Family" ("createdAt", "deletedAt", "id", "name", "updatedAt") SELECT "createdAt", "deletedAt", "id", "name", "updatedAt" FROM "Family";
DROP TABLE "Family";
ALTER TABLE "new_Family" RENAME TO "Family";
CREATE TABLE "new_RecurringTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfMonth" INTEGER,
    "dayOfWeek" INTEGER,
    "timeOfDay" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "maxOccurrences" INTEGER,
    "occurrencesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "RecurringTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecurringTransaction" ("accountId", "amount", "categoryId", "createdAt", "dayOfMonth", "dayOfWeek", "deletedAt", "description", "endDate", "frequency", "id", "maxOccurrences", "occurrencesCount", "startDate", "timeOfDay", "type", "updatedAt", "userId") SELECT "accountId", "amount", "categoryId", "createdAt", "dayOfMonth", "dayOfWeek", "deletedAt", "description", "endDate", "frequency", "id", "maxOccurrences", "occurrencesCount", "startDate", "timeOfDay", "type", "updatedAt", "userId" FROM "RecurringTransaction";
DROP TABLE "RecurringTransaction";
ALTER TABLE "new_RecurringTransaction" RENAME TO "RecurringTransaction";
CREATE INDEX "RecurringTransaction_accountId_idx" ON "RecurringTransaction"("accountId");
CREATE INDEX "RecurringTransaction_userId_idx" ON "RecurringTransaction"("userId");
CREATE INDEX "RecurringTransaction_type_idx" ON "RecurringTransaction"("type");
CREATE TABLE "new_RecurringTransactionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recurringTransactionId" INTEGER NOT NULL,
    "generatedTransactionId" INTEGER,
    "executionTime" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "RecurringTransactionLog_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "RecurringTransaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransactionLog_generatedTransactionId_fkey" FOREIGN KEY ("generatedTransactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecurringTransactionLog" ("createdAt", "executionTime", "generatedTransactionId", "id", "recurringTransactionId", "updatedAt") SELECT "createdAt", "executionTime", "generatedTransactionId", "id", "recurringTransactionId", "updatedAt" FROM "RecurringTransactionLog";
DROP TABLE "RecurringTransactionLog";
ALTER TABLE "new_RecurringTransactionLog" RENAME TO "RecurringTransactionLog";
CREATE UNIQUE INDEX "RecurringTransactionLog_generatedTransactionId_key" ON "RecurringTransactionLog"("generatedTransactionId");
CREATE INDEX "RecurringTransactionLog_recurringTransactionId_idx" ON "RecurringTransactionLog"("recurringTransactionId");
CREATE INDEX "RecurringTransactionLog_generatedTransactionId_idx" ON "RecurringTransactionLog"("generatedTransactionId");
CREATE TABLE "new_Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "familyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#e99537',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "Tag_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("color", "createdAt", "deletedAt", "familyId", "id", "name", "updatedAt") SELECT "color", "createdAt", "deletedAt", "familyId", "id", "name", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE INDEX "Tag_familyId_idx" ON "Tag"("familyId");
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "categoryId", "createdAt", "date", "deletedAt", "id", "name", "type", "updatedAt", "userId") SELECT "accountId", "amount", "categoryId", "createdAt", "date", "deletedAt", "id", "name", "type", "updatedAt", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_accountId_date_idx" ON "Transaction"("accountId", "date" DESC);
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX "Transaction_deletedAt_idx" ON "Transaction"("deletedAt");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "familyId" INTEGER,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "deletedAt" TEXT,
    CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "deletedAt", "email", "familyId", "id", "passwordHash", "role", "updatedAt", "username") SELECT "createdAt", "deletedAt", "email", "familyId", "id", "passwordHash", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_familyId_idx" ON "User"("familyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
