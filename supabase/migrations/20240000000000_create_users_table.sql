-- Create a secure schema for our application
CREATE SCHEMA IF NOT EXISTS "public";

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" UUID NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "last_login" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE
);

-- Set up Row Level Security (RLS)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" 
    ON "public"."users" 
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON "public"."users" 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Create policy for inserting new users (needed for signup)
CREATE POLICY "Users can insert their own profile" 
    ON "public"."users" 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "public"."users" ("email");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "public"."users" ("created_at");

-- Grant necessary privileges
GRANT USAGE ON SCHEMA "public" TO "anon", "authenticated";
GRANT ALL ON "public"."users" TO "anon", "authenticated";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO "anon", "authenticated"; 