-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_recipientId_fkey";

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
