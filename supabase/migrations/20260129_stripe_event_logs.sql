-- Stripe Event Logs for Webhook Idempotency
-- This table tracks processed Stripe webhook events to prevent duplicate processing

CREATE TABLE IF NOT EXISTS public.stripe_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure we never process the same event twice
  CONSTRAINT stripe_event_logs_event_id_unique UNIQUE(stripe_event_id)
);

-- Index for quick lookups by event ID
CREATE INDEX IF NOT EXISTS idx_stripe_event_logs_event_id
  ON public.stripe_event_logs(stripe_event_id);

-- Index for querying by event type (useful for debugging/analytics)
CREATE INDEX IF NOT EXISTS idx_stripe_event_logs_event_type
  ON public.stripe_event_logs(event_type);

-- Index for querying recent events
CREATE INDEX IF NOT EXISTS idx_stripe_event_logs_processed_at
  ON public.stripe_event_logs(processed_at DESC);

-- RLS: Only service role can access (webhooks use service role)
ALTER TABLE public.stripe_event_logs ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - service role bypasses RLS
-- This ensures only webhooks (which use service role) can write to this table

-- Cleanup old events after 30 days (optional - can be run as a cron job)
-- DELETE FROM public.stripe_event_logs WHERE processed_at < NOW() - INTERVAL '30 days';

COMMENT ON TABLE public.stripe_event_logs IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN public.stripe_event_logs.stripe_event_id IS 'Unique event ID from Stripe (evt_xxx)';
COMMENT ON COLUMN public.stripe_event_logs.event_type IS 'Stripe event type (e.g., checkout.session.completed)';
COMMENT ON COLUMN public.stripe_event_logs.processed_at IS 'When the event was processed';
