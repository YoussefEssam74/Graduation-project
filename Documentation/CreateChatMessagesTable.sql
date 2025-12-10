-- ============================================
-- NOTE: This file is for reference only!
-- The chat_messages table is now created via EF Core migrations.
-- 
-- To apply migrations, run:
-- dotnet ef database update --project Infrastructure/Presistence --startup-project Graduation-Project
-- ============================================

-- Fix Database for Fresh Migration (if needed)
-- Run this script to clean up existing enum types and prepare for migration

-- Drop existing enum types (if they exist from previous runs)
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS equipment_status CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Verify all types are dropped
SELECT 'All enum types dropped successfully' AS status;

-- ============================================
-- AFTER running the above, run:
-- dotnet ef database update --project Infrastructure/Presistence --startup-project Graduation-Project
-- ============================================

-- Reference: chat_messages table structure (created by migration)

CREATE TABLE IF NOT EXISTS chat_messages (
    "ChatMessageId" SERIAL PRIMARY KEY,
    "SenderId" INTEGER NOT NULL,
    "ReceiverId" INTEGER NOT NULL,
    "Message" TEXT NOT NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReadAt" TIMESTAMP WITH TIME ZONE,
    "ConversationId" VARCHAR(50) NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "IsPermanent" BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign keys
    CONSTRAINT fk_chat_messages_sender FOREIGN KEY ("SenderId") 
        REFERENCES users("UserId") ON DELETE RESTRICT,
    CONSTRAINT fk_chat_messages_receiver FOREIGN KEY ("ReceiverId") 
        REFERENCES users("UserId") ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_chat_messages_conversation_id 
    ON chat_messages ("ConversationId");

CREATE INDEX IF NOT EXISTS ix_chat_messages_sender_receiver 
    ON chat_messages ("SenderId", "ReceiverId");

CREATE INDEX IF NOT EXISTS ix_chat_messages_created_at 
    ON chat_messages ("CreatedAt");

CREATE INDEX IF NOT EXISTS ix_chat_messages_expires_at 
    ON chat_messages ("ExpiresAt");

CREATE INDEX IF NOT EXISTS ix_chat_messages_conversation_created 
    ON chat_messages ("ConversationId", "CreatedAt");

-- Verify table creation
SELECT 'chat_messages table created successfully' AS status;

-- Show table structure
\d chat_messages;
