-- Add resident approval fields for FOR_OTHER requests.
ALTER TABLE "KeyRequest" ADD COLUMN "requestReason" TEXT;
ALTER TABLE "KeyRequest" ADD COLUMN "approvalToken" TEXT;
ALTER TABLE "KeyRequest" ADD COLUMN "approvalCodeHash" TEXT;
ALTER TABLE "KeyRequest" ADD COLUMN "approvalCodeAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "KeyRequest" ADD COLUMN "approvalExpiresAt" TIMESTAMP(3);
ALTER TABLE "KeyRequest" ADD COLUMN "approvalRespondedAt" TIMESTAMP(3);
ALTER TABLE "KeyRequest" ADD COLUMN "approvalDeniedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "KeyRequest_approvalToken_key" ON "KeyRequest"("approvalToken");
