import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Bank, Promo, Tip } from './types';

const CACHE_KEYS = {
  BANKS: 'cashbaq_cache_banks',
  PROMOS: 'cashbaq_cache_promos',
  TIPS: 'cashbaq_cache_tips',
} as const;

// ── helpers ──────────────────────────────────────────

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore cache write errors
  }
}

// ── fetchBanks ───────────────────────────────────────

export async function fetchBanks(): Promise<Bank[]> {
  const { data: banksRaw, error: banksErr } = await supabase
    .from('banks')
    .select('*');

  if (banksErr || !banksRaw) throw banksErr;

  const { data: ratesRaw, error: ratesErr } = await supabase
    .from('bank_rates')
    .select('*');

  if (ratesErr || !ratesRaw) throw ratesErr;

  // Group rates by bank_id
  const ratesByBank = new Map<string, Record<string, number>>();
  for (const r of ratesRaw) {
    if (!ratesByBank.has(r.bank_id)) ratesByBank.set(r.bank_id, {});
    ratesByBank.get(r.bank_id)![r.category_id] = Number(r.rate);
  }

  const banks: Bank[] = banksRaw.map((b) => ({
    id: b.id,
    name: b.name,
    card: b.card_name,
    color: b.color,
    bg: b.bg_color,
    gradient: [b.gradient_start, b.gradient_end] as [string, string],
    type: b.type,
    desc: b.description ?? '',
    note: b.note ?? '',
    url: b.url ?? '',
    lounge: b.has_lounge,
    insurance: b.has_insurance,
    limits: {
      monthly: b.monthly_limit ?? 0,
      daily: b.daily_limit ?? undefined,
    },
    config: b.config ?? {},
    baseRates: ratesByBank.get(b.id) ?? {},
  }));

  await setCache(CACHE_KEYS.BANKS, banks);
  return banks;
}

// ── fetchPromos ──────────────────────────────────────

export async function fetchPromos(): Promise<Promo[]> {
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('is_active', true);

  if (error || !data) throw error;

  const promos: Promo[] = data.map((p) => ({
    bankId: p.bank_id,
    title: p.title,
    desc: p.description ?? '',
    category: p.category_id ?? '',
    rate: Number(p.rate),
    emoji: p.emoji ?? '',
    endDate: p.end_date ?? '',
    isNew: p.is_new,
  }));

  await setCache(CACHE_KEYS.PROMOS, promos);
  return promos;
}

// ── fetchTips ────────────────────────────────────────

export async function fetchTips(): Promise<Tip[]> {
  const { data: tipsRaw, error: tipsErr } = await supabase
    .from('tips')
    .select('*')
    .order('sort_order');

  if (tipsErr || !tipsRaw) throw tipsErr;

  const { data: itemsRaw, error: itemsErr } = await supabase
    .from('tip_items')
    .select('*')
    .order('sort_order');

  if (itemsErr || !itemsRaw) throw itemsErr;

  const itemsByTip = new Map<string, { text: string; emoji: string; bankId?: string }[]>();
  for (const item of itemsRaw) {
    if (!itemsByTip.has(item.tip_id)) itemsByTip.set(item.tip_id, []);
    itemsByTip.get(item.tip_id)!.push({
      text: item.description,
      emoji: item.card_name ? '🏦' : '💡',
      bankId: item.bank_id ?? undefined,
    });
  }

  const tips: Tip[] = tipsRaw.map((t) => ({
    id: t.id,
    title: t.title,
    emoji: t.icon ?? '',
    items: itemsByTip.get(t.id) ?? [],
  }));

  await setCache(CACHE_KEYS.TIPS, tips);
  return tips;
}

// ── Cache-first loaders ──────────────────────────────

export async function getCachedBanks(): Promise<Bank[] | null> {
  return getCache<Bank[]>(CACHE_KEYS.BANKS);
}

export async function getCachedPromos(): Promise<Promo[] | null> {
  return getCache<Promo[]>(CACHE_KEYS.PROMOS);
}

export async function getCachedTips(): Promise<Tip[] | null> {
  return getCache<Tip[]>(CACHE_KEYS.TIPS);
}
