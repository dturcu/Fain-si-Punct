-- ============================================================================
-- Audit Logs Table
-- ============================================================================
--
-- Stores security-relevant events: login success/failure, registrations,
-- password resets, admin actions, payment attempts, review deletions, etc.
--
-- Writes are fire-and-forget from lib/audit-log.js — the helper swallows
-- errors so audit logging cannot break the main auth / payment flow.
--
-- Run this in the Supabase SQL Editor after schema.sql and rls-policies.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id    UUID NULL,
  email      TEXT NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  metadata   JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for typical queries: recent events, per-user, per-event-type
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs (email) WHERE email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Row Level Security: service role only (no anon / authenticated access)
-- ---------------------------------------------------------------------------
-- Audit logs must never be readable or writable by end-users. The service_role
-- key used by API routes bypasses RLS, so enabling RLS with no policies
-- effectively locks the table to service_role-only access.

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Explicitly: no SELECT, INSERT, UPDATE, DELETE policies for anon / authenticated.
-- Any future need for admin dashboards to read audit logs should go through
-- a service-role API route, not direct client access.
