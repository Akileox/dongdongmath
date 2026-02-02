-- Add supporting columns to learning_logs
ALTER TABLE learning_logs 
ADD COLUMN IF NOT EXISTS related_exam_ids text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS student_notes jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS missing_exam_records jsonb DEFAULT '{}';

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES auth.users(id) NOT NULL,
    receiver_id uuid REFERENCES auth.users(id) NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Optional: Allow update (mark as read)
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages" ON messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Fix FKs to point to profiles (public schema) so PostgREST can join them
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_sender_id_fkey' AND table_name = 'messages') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_receiver_id_fkey' AND table_name = 'messages') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_receiver_id_fkey;
    END IF;
END $$;

ALTER TABLE messages 
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);
