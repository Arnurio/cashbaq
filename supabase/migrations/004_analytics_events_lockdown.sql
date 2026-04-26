-- Lock down analytics_events:
--   1. Whitelist event names (prevents arbitrary string spam)
--   2. Cap properties size (prevents JSONB bombs)
-- SELECT lockdown deferred until admin gets a real auth flow — admin currently
-- uses the anon key, so revoking anon SELECT would break the dashboard.

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_event_whitelist
  CHECK (event IN (
    'category_selected',
    'best_card_shown',
    'card_added',
    'card_removed',
    'inaccuracy_reported'
  ));

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_properties_size
  CHECK (octet_length(properties::text) < 2048);
