// Edge Function: send-push
// Triggered by admin to push a notification to all devices that have a card from `bank_id`.
//
// Auth: requires a valid Supabase Auth JWT (admin-only) — verify_jwt is enabled by default.
// Sends via the free Expo Push API. Batches into chunks of 100 (Expo's max).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

interface PushRequest {
  bank_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: cors });
  }

  let payload: PushRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { bank_id, title, body, data } = payload;
  if (!bank_id || !title || !body) {
    return new Response(JSON.stringify({ error: 'bank_id, title, body required' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Use service role to bypass RLS and read all push_subscriptions
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('push_token')
    .contains('bank_ids', [bank_id])
    .eq('enabled', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'no subscribers' }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  const failures: string[] = [];

  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const chunk = subs.slice(i, i + BATCH_SIZE).map((s) => ({
      to: s.push_token,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      priority: 'high',
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
      else failures.push(`chunk ${i}: ${res.status}`);
    } catch (e) {
      failures.push(`chunk ${i}: ${(e as Error).message}`);
    }
  }

  return new Response(
    JSON.stringify({ sent, total: subs.length, failures }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  );
});
