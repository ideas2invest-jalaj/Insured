-- Insurance Renewal Management Portal - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for policy status
CREATE TYPE policy_status AS ENUM ('Paid', 'Pending', 'Overdue', 'Grace Period', 'Lapsed');

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    insurance_company TEXT NOT NULL,
    policy_number TEXT NOT NULL UNIQUE,
    premium_amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    issuance_date DATE NOT NULL,
    phone TEXT,
    email TEXT,
    status policy_status DEFAULT 'Pending',
    last_alert_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interaction logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    remark TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_policies_due_date ON policies(due_date);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_client_name ON policies(client_name);
CREATE INDEX IF NOT EXISTS idx_policies_insurance_company ON policies(insurance_company);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_policy_id ON interaction_logs(policy_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created_at ON interaction_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for policies updated_at
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable after initial setup
-- ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public read access for development (remove in production)
CREATE POLICY "Public read policies" ON policies FOR SELECT USING (true);
CREATE POLICY "Public read interaction_logs" ON interaction_logs FOR SELECT USING (true);
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

-- Policy mutations
CREATE POLICY "Public insert policies" ON policies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update policies" ON policies FOR UPDATE USING (true);
CREATE POLICY "Public delete policies" ON policies FOR DELETE USING (true);

-- Interaction log mutations
CREATE POLICY "Public insert interaction_logs" ON interaction_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update interaction_logs" ON interaction_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete interaction_logs" ON interaction_logs FOR DELETE USING (true);

-- User mutations
CREATE POLICY "Public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update users" ON users FOR UPDATE USING (true);
