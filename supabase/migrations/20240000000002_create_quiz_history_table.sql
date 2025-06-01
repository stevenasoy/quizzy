-- Create quiz_history table
CREATE TABLE IF NOT EXISTS public.quiz_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT score_range CHECK (score >= 0 AND score <= 100)
);

-- Enable RLS
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own quiz history" 
    ON public.quiz_history 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz history" 
    ON public.quiz_history 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS quiz_history_user_id_idx ON public.quiz_history(user_id);
CREATE INDEX IF NOT EXISTS quiz_history_created_at_idx ON public.quiz_history(created_at);

-- Grant permissions
GRANT ALL ON public.quiz_history TO authenticated; 