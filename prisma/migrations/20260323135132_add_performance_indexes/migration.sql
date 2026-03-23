-- CreateIndex
CREATE INDEX "ApiKey_skillId_idx" ON "ApiKey"("skillId");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_status_idx" ON "ApiKey"("status");

-- CreateIndex
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");
