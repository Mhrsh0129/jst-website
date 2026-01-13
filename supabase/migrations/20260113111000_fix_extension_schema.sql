-- Fix: Move extensions out of public schema for security
-- Based on Supabase Security Advisor recommendation

-- 1. Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Move pg_trgm to extensions schema
-- We use a DO block to handle cases where it might already be moved
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE
        extname = 'pg_trgm'
) THEN
ALTER EXTENSION pg_trgm
SET
    SCHEMA extensions;

END IF;

END $$;