-- CreateTable
CREATE TABLE "admin_password_resets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_password_resets_token_key" ON "admin_password_resets"("token");

-- CreateIndex
CREATE INDEX "admin_password_resets_userId_idx" ON "admin_password_resets"("userId");

-- CreateIndex
CREATE INDEX "admin_password_resets_token_idx" ON "admin_password_resets"("token");
