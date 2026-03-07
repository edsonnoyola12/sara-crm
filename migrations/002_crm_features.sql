-- Migration: CRM Feature Tables
-- Run this on Supabase SQL Editor
-- Tables: custom_fields, documents, audit_log, lead_activities, tasks, workflows,
--         approval_requests, approval_rules, api_tokens, webhook_configs, field_permissions

-- 1. Custom Fields
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'property', 'mortgage')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'boolean', 'url')),
  options JSONB DEFAULT '[]',
  required BOOLEAN DEFAULT false,
  visible BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_fields(entity_type);

-- 2. Add custom_data to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- 3. Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'otro',
  uploaded_by TEXT,
  uploaded_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- 4. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
  changes JSONB DEFAULT '{}',
  user_id TEXT,
  user_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- 5. Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL,
  team_member_id TEXT,
  team_member_name TEXT,
  activity_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at DESC);

-- 6. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  category TEXT NOT NULL DEFAULT 'otro' CHECK (category IN ('llamada', 'tramite', 'documento', 'seguimiento', 'notaria', 'avaluo', 'otro')),
  assigned_to TEXT,
  assigned_to_name TEXT,
  lead_id TEXT,
  lead_name TEXT,
  property_id TEXT,
  property_name TEXT,
  created_by TEXT,
  created_by_name TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- 7. Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT false,
  trigger JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  executions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Approval Requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  requested_by TEXT,
  requested_by_name TEXT,
  approved_by TEXT,
  approved_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  details JSONB DEFAULT '{}',
  reason TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status);

-- 9. Approval Rules
CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,
  description TEXT,
  requires_role TEXT DEFAULT 'admin',
  auto_approve_threshold NUMERIC,
  active BOOLEAN DEFAULT true
);

-- Insert default rules
INSERT INTO approval_rules (type, description, requires_role, active) VALUES
  ('discount', 'Descuentos sobre precio de lista', 'coordinador', true),
  ('reservation', 'Reservacion de unidad', 'coordinador', true),
  ('cancellation', 'Cancelacion de reserva/venta', 'admin', true),
  ('price_change', 'Cambio de precio de propiedad', 'admin', true),
  ('commission_change', 'Cambio de comision', 'admin', true),
  ('lead_delete', 'Eliminacion de lead', 'coordinador', true),
  ('refund', 'Reembolso al cliente', 'admin', true)
ON CONFLICT (type) DO NOTHING;

-- 10. API Tokens
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '[]',
  created_by TEXT,
  created_by_name TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Webhook Configs
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB DEFAULT '[]',
  secret TEXT,
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  failure_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Field Permissions
CREATE TABLE IF NOT EXISTS field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  role TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  UNIQUE(entity_type, field_name, role)
);
CREATE INDEX IF NOT EXISTS idx_field_perms_role ON field_permissions(role);

-- 13. Supabase Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow authenticated uploads
CREATE POLICY IF NOT EXISTS "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY IF NOT EXISTS "Allow authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY IF NOT EXISTS "Allow authenticated delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
