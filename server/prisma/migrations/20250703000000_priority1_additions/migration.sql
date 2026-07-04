-- Add isStarred to Message
ALTER TABLE "Message" ADD COLUMN "isStarred" BOOLEAN NOT NULL DEFAULT false;

-- Create CallKind enum
CREATE TYPE "CallKind" AS ENUM ('VOICE', 'VIDEO');

-- Create CallDirection enum
CREATE TYPE "CallDirection" AS ENUM ('INCOMING', 'OUTGOING', 'MISSED');

-- Create Call table
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "kind" "CallKind" NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- Create Report table
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for Call
ALTER TABLE "Call" ADD CONSTRAINT "Call_initiatorId_fkey"
  FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Call" ADD CONSTRAINT "Call_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for Report
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey"
  FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
