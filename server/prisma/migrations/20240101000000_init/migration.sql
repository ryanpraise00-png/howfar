-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'VOICE', 'DOCUMENT', 'LOCATION', 'CONTACT_CARD', 'SYSTEM');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('IMAGE', 'TEXT', 'VIDEO');

-- CreateTable
CREATE TABLE "User" (
    "id"           TEXT NOT NULL,
    "phone"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "about"        TEXT NOT NULL DEFAULT 'Hey there! I am using HowFar',
    "avatarUrl"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline"     BOOLEAN NOT NULL DEFAULT false,
    "twoStepPin"   TEXT,
    "twoStepEmail" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id"        TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "nickname"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "id"        TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id"          TEXT NOT NULL,
    "type"        "ChatType" NOT NULL,
    "name"        TEXT,
    "description" TEXT,
    "avatarUrl"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "id"                 TEXT NOT NULL,
    "chatId"             TEXT NOT NULL,
    "userId"             TEXT NOT NULL,
    "role"               "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isMuted"            BOOLEAN NOT NULL DEFAULT false,
    "mutedUntil"         TIMESTAMP(3),
    "isPinned"           BOOLEAN NOT NULL DEFAULT false,
    "isArchived"         BOOLEAN NOT NULL DEFAULT false,
    "disappearingMsgTtl" INTEGER,
    "lastReadMessageId"  TEXT,
    "unreadCount"        INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id"          TEXT NOT NULL,
    "chatId"      TEXT NOT NULL,
    "senderId"    TEXT NOT NULL,
    "type"        "MessageType" NOT NULL DEFAULT 'TEXT',
    "content"     TEXT,
    "mediaUrl"    TEXT,
    "mediaSize"   INTEGER,
    "mediaName"   TEXT,
    "duration"    INTEGER,
    "lat"         DOUBLE PRECISION,
    "lng"         DOUBLE PRECISION,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "replyToId"   TEXT,
    "isDeleted"   BOOLEAN NOT NULL DEFAULT false,
    "deletedFor"  TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReceipt" (
    "id"          TEXT NOT NULL,
    "messageId"   TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "readAt"      TIMESTAMP(3),

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id"        TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "emoji"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPost" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      "StatusType" NOT NULL,
    "content"   TEXT,
    "mediaUrl"  TEXT,
    "bgColor"   TEXT,
    "caption"   TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusView" (
    "id"           TEXT NOT NULL,
    "statusPostId" TEXT NOT NULL,
    "viewerId"     TEXT NOT NULL,
    "viewedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reaction"     TEXT,

    CONSTRAINT "StatusView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_ownerId_contactId_key" ON "Contact"("ownerId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_chatId_userId_key" ON "ChatMember"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReceipt_messageId_userId_key" ON "MessageReceipt"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusView_statusPostId_viewerId_key" ON "StatusView"("statusPostId", "viewerId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey"
    FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey"
    FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPost" ADD CONSTRAINT "StatusPost_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusView" ADD CONSTRAINT "StatusView_statusPostId_fkey"
    FOREIGN KEY ("statusPostId") REFERENCES "StatusPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StatusView" ADD CONSTRAINT "StatusView_viewerId_fkey"
    FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
