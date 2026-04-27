// Edge Function: send-push
// Triggered by admin to push a notification to all devices that have a card from `bank_id`.
//
// Auth: requires a valid Supabase Auth JWT (admin-only) — verify_jwt is enabled.
// Sends via the free Expo Push API in parallel batches of 100.
// Parses ticket responses and disables tokens that Expo reports as DeviceNotRegistered.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

interface PushRequest {
  bank_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;
const MAX_TITLE = 100;
const MAX_BODY = 300;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: cors });

  let payload: PushRequest;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const { bank_id, title, body, data } = payload;
  if (!bank_id || !title?.trim() || !body?.trim()) {
    return json(400, { error: 'bank_id, title, body required' });
  }
  if (title.length > MAX_TITLE) return json(400, { error: `title > ${MAX_TITLE}` });
  if (body.length > MAX_BODY)   return json(400, { error: `body > ${MAX_BODY}` });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('push_token')
    .contains('bank_ids', [bank_id])
    .eq('enabled', true);

  if (error) return json(500, { error: error.message });
  if (!subs || subs.length === 0) {
    return json(200, { sent: 0, total: 0, message: 'no subscribers' });
  }

  // Build chunks of 100 (Expo's max batch size) and send all in parallel
  const chunks: typeof subs[] = [];
  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    chunks.push(subs.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.allSettled(
    chunks.map(async (chunk) => {
      const messages = chunk.map((s) => ({
        to: s.push_token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        // priority is Android (FCM) only; iOS ignores
        priority: 'high',
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) throw new Error(`expo http ${res.status}`);
      const respBody = await res.json() as { data?: ExpoTicket[] };
      return { tokens: chunk.map((s) => s.push_token), tickets: respBody.data ?? [] };
    })
  );

  // Collect dead tokens — Expo signals DeviceNotRegistered when the app was uninstalled
  // or token rotated. Disable these so future sends skip them and audience counts shrink.
  const deadTokens: string[] = [];
  let sent = 0;
  const failures: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected') {
      failures.push(`chunk ${i}: ${r.reason?.message ?? r.reason}`);
      continue;
    }
    const { tokens, tickets } = r.value;
    tickets.forEach((t, idx) => {
      if (t.status === 'ok') {
        sent++;
      } else if (t.details?.error === 'DeviceNotRegistered') {
        deadTokens.push(tokens[idx]);
      } else {
        failures.push(`${tokens[idx]?.slice(0, 20)}…: ${t.message ?? 'error'}`);
      }
    });
  }

  if (deadTokens.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ enabled: false })
      .in('push_token', deadTokens);
  }

  return json(200, {
    sent,
    total: subs.length,
    cleaned: deadTokens.length,
    failures: failures.slice(0, 10),
  });
});
