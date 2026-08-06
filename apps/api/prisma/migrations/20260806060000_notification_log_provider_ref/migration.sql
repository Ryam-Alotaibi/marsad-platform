ALTER TABLE "notification_logs" ADD COLUMN "isMock" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_logs" ADD COLUMN "providerRef" TEXT;
