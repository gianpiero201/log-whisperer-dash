-- Create or replace a cron job to invoke the monitor-endpoints Edge Function every minute
-- Uses anon key in Authorization header (function has verify_jwt = false)

-- Unschedule existing job if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitor-endpoints-every-minute') THEN
    PERFORM cron.unschedule('monitor-endpoints-every-minute');
  END IF;
END $$;

-- Schedule the job (runs every minute)
SELECT
  cron.schedule(
    'monitor-endpoints-every-minute',
    '* * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://eypbmnritdshiiketlgq.supabase.co/functions/v1/monitor-endpoints',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cGJtbnJpdGRzaGlpa2V0bGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjQyOTgsImV4cCI6MjA3Mjk0MDI5OH0.5qxfiNYd5GWySrJ7EyW-VHAEoNB8aFzQrlOND6OU4to"}'::jsonb,
        body := '{}'::jsonb
      );
    $$
  );
