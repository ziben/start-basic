CREATE TABLE "ai_conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversation_userId_idx" ON "ai_conversation"("userId");
CREATE INDEX "ai_conversation_createdAt_idx" ON "ai_conversation"("createdAt");
CREATE INDEX "ai_message_conversationId_idx" ON "ai_message"("conversationId");
CREATE INDEX "ai_message_createdAt_idx" ON "ai_message"("createdAt");

ALTER TABLE "ai_conversation"
ADD CONSTRAINT "ai_conversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_message"
ADD CONSTRAINT "ai_message_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ai_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
