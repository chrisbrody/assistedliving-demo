-- ===========================================
-- FACILITY READY BOARD - DATABASE SCHEMA
-- ===========================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABLE: residents
-- ===========================================
-- The core directory of residents

CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  family_phone TEXT, -- Phone number for SMS notifications
  dietary_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: transport_events
-- ===========================================
-- The real-time pickup/appointment board

CREATE TYPE event_status AS ENUM (
  'scheduled',
  'prep_alert',
  'prepping',
  'ready',
  'departed',
  'cancelled'
);

CREATE TYPE event_type AS ENUM (
  'family_pickup',
  'doctor_appointment',
  'facility_van',
  'other'
);

CREATE TABLE transport_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  pickup_time TIMESTAMPTZ NOT NULL,
  event_type event_type DEFAULT 'family_pickup',
  purpose TEXT,
  status event_status DEFAULT 'scheduled',
  notes TEXT,
  family_phone_override TEXT, -- Override resident's default phone for this event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: notifications_log
-- ===========================================
-- Audit trail for all SMS/notifications sent

CREATE TYPE notification_type AS ENUM ('sms', 'email', 'push');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES transport_events(id) ON DELETE CASCADE,
  notification_type notification_type DEFAULT 'sms',
  recipient TEXT NOT NULL,
  message TEXT,
  status notification_status DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES for performance
-- ===========================================

CREATE INDEX idx_transport_events_status ON transport_events(status);
CREATE INDEX idx_transport_events_pickup_time ON transport_events(pickup_time);
CREATE INDEX idx_transport_events_date ON transport_events(((pickup_time AT TIME ZONE 'UTC')::date));
CREATE INDEX idx_residents_active ON residents(is_active);

-- ===========================================
-- FUNCTION: Auto-update updated_at timestamp
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_events_updated_at
  BEFORE UPDATE ON transport_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ENABLE REALTIME
-- ===========================================
-- This is critical for the live updates!

ALTER PUBLICATION supabase_realtime ADD TABLE transport_events;
ALTER PUBLICATION supabase_realtime ADD TABLE residents;

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
-- For the demo, we'll allow all operations
-- In production, you'd add proper auth policies

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for demo (no auth required)
CREATE POLICY "Allow all for residents" ON residents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transport_events" ON transport_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for notifications_log" ON notifications_log FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- SEED DATA (Demo residents)
-- ===========================================
-- Add some realistic demo data

INSERT INTO residents (full_name, room_number, family_phone, dietary_notes) VALUES
  ('Alice Gable', '102-A', NULL, 'Low sodium'),
  ('Robert Martinez', '104-B', NULL, 'Diabetic diet'),
  ('Dorothy Chen', '108-A', NULL, 'Regular'),
  ('William Thompson', '110-B', NULL, 'Mechanical soft'),
  ('Margaret Wilson', '112-A', NULL, 'Gluten free'),
  ('James Anderson', '114-B', NULL, 'Regular'),
  ('Patricia Brown', '116-A', NULL, 'Pureed'),
  ('Charles Davis', '118-B', NULL, 'Low sodium, diabetic');

-- ===========================================
-- TABLE: push_subscriptions
-- ===========================================
-- Store Web Push subscriptions for PWA notifications

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  view_type TEXT DEFAULT 'floor', -- 'admin' or 'floor' - which view subscribed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply auto-update trigger
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policy
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for push_subscriptions" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Index for quick lookup by endpoint
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX idx_push_subscriptions_view_type ON push_subscriptions(view_type);

-- ===========================================
-- VIEW: Today's pickups with resident info
-- ===========================================

CREATE VIEW todays_events AS
SELECT
  te.id,
  te.resident_id,
  r.full_name as resident_name,
  r.room_number,
  COALESCE(te.family_phone_override, r.family_phone) as family_phone,
  te.pickup_time,
  te.event_type,
  te.purpose,
  te.status,
  te.notes,
  te.created_at,
  te.updated_at
FROM transport_events te
JOIN residents r ON te.resident_id = r.id
WHERE (te.pickup_time AT TIME ZONE 'UTC')::date = CURRENT_DATE
  AND te.status != 'cancelled'
ORDER BY te.pickup_time ASC;
