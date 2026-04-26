import { supabase } from './supabase';

type EventName =
  | 'category_selected'
  | 'best_card_shown'
  | 'card_added'
  | 'card_removed'
  | 'inaccuracy_reported';

// Fire-and-forget — never blocks UI, never throws
export function trackEvent(
  event: EventName,
  properties: Record<string, unknown> = {}
): void {
  supabase
    .from('analytics_events')
    .insert({ event, properties })
    .then(() => {}, () => {});
}
