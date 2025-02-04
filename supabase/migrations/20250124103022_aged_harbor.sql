/*
  # Authentication Schema Setup
  
  1. Changes
    - Add auth schema extensions if not exists
    - Enable auth schema for user management
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT ALL ON SCHEMA auth TO postgres, service_role;

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;