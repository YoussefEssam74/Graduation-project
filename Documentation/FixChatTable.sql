-- ============================================
-- FIX: Create chat_messages table
-- Run this in pgAdmin Query Tool
-- Database: intellifit_db
-- ============================================

-- Drop table if exists (clean start)
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create the chat_messages table
CREATE TABLE chat_messages (
    "ChatMessageId" SERIAL PRIMARY KEY,
    "SenderId" INTEGER NOT NULL,
    "ReceiverId" INTEGER NOT NULL,
    "Message" TEXT NOT NULL,
    "ConversationId" VARCHAR(100) NOT NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsPermanent" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "ReadAt" TIMESTAMP WITH TIME ZONE NULL,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_sender FOREIGN KEY ("SenderId") REFERENCES users("UserId") ON DELETE CASCADE,
    CONSTRAINT fk_receiver FOREIGN KEY ("ReceiverId") REFERENCES users("UserId") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_sender ON chat_messages("SenderId");
CREATE INDEX idx_chat_messages_receiver ON chat_messages("ReceiverId");
CREATE INDEX idx_chat_messages_conversation ON chat_messages("ConversationId");
CREATE INDEX idx_chat_messages_created_at ON chat_messages("CreatedAt" DESC);

-- Verify
SELECT 'chat_messages table created!' AS status;
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'chat_messages';
