-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz NOT NULL,
  selected_merchant_ids jsonb,
  switch_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (Row Level Security) but allow service role to do everything
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: allow anon/service to insert and read (for the API routes)
CREATE POLICY "Allow all for service" ON onboarding_sessions
  FOR ALL USING (true) WITH CHECK (true);
