import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, ExternalLink, Link2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'grocery', name: 'Продукты', emoji: '🛒' },
  { id: 'restaurants', name: 'Кафе', emoji: '🍽' },
  { id: 'transport', name: 'Транспорт', emoji: '🚕' },
  { id: 'clothing', name: 'Одежда', emoji: '👗' },
  { id: 'entertainment', name: 'Развлечения', emoji: '🎬' },
  { id: 'fuel', name: 'АЗС', emoji: '⛽' },
  { id: 'travel', name: 'Путешествия', emoji: '✈️' },
  { id: 'pharmacy', name: 'Аптеки', emoji: '💊' },
  { id: 'online', name: 'Онлайн', emoji: '🌐' },
  { id: 'telecom', name: 'Связь', emoji: '📱' },
  { id: '_selected', name: 'Выбранные', emoji: '⭐' },
  { id: '_default', name: 'По умолч.', emoji: '📌' },
];

interface Bank {
  id: string;
  name: string;
  color: string;
}

interface Rate {
  bank_id: string;
  category_id: string;
  rate: number;
  updated_at?: string;
  source_url?: string | null;
  verified_by?: 'user' | 'community' | 'bank_site' | 'ai_estimate' | null;
  verified_at?: string | null;
}

interface RateMeta {
  updatedAt: string;
  sourceUrl: string;
  verifiedBy: 'user' | 'community' | 'bank_site' | 'ai_estimate';
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)} г. назад`;
}

function freshnessColor(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 14) return 'text-green-600';
  if (days < 60) return 'text-amber-600';
  return 'text-red-600';
}

export default function Rates() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [rates, setRates] = useState<Map<string, number>>(new Map());
  const [meta, setMeta] = useState<Map<string, RateMeta>>(new Map());
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [editingSource, setEditingSource] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [b, r] = await Promise.all([
      supabase.from('banks').select('id, name, color').eq('is_active', true).order('name'),
      supabase.from('bank_rates').select('*'),
    ]);
    if (b.data) setBanks(b.data);
    if (r.data) {
      const ratesMap = new Map<string, number>();
      const metaMap = new Map<string, RateMeta>();
      (r.data as Rate[]).forEach((row) => {
        const key = `${row.bank_id}:${row.category_id}`;
        ratesMap.set(key, row.rate);
        metaMap.set(key, {
          updatedAt: row.updated_at ?? new Date().toISOString(),
          sourceUrl: row.source_url ?? '',
          verifiedBy: row.verified_by ?? 'ai_estimate',
        });
      });
      setRates(ratesMap);
      setMeta(metaMap);
    }
  }

  function getKey(bankId: string, catId: string) {
    return `${bankId}:${catId}`;
  }

  function updateRate(bankId: string, catId: string, val: string) {
    const key = getKey(bankId, catId);
    const newRates = new Map(rates);
    if (val === '') {
      newRates.delete(key);
    } else {
      newRates.set(key, parseFloat(val));
    }
    setRates(newRates);
    setDirty(new Set(dirty).add(key));
  }

  function updateSource(bankId: string, catId: string, url: string) {
    const key = getKey(bankId, catId);
    const newMeta = new Map(meta);
    const cur = newMeta.get(key) ?? { updatedAt: new Date().toISOString(), sourceUrl: '', verifiedBy: 'ai_estimate' as const };
    newMeta.set(key, { ...cur, sourceUrl: url });
    setMeta(newMeta);
    setDirty(new Set(dirty).add(key));
  }

  async function saveAll() {
    setSaving(true);
    const nowIso = new Date().toISOString();
    const upserts: {
      bank_id: string; category_id: string; rate: number;
      source_url: string | null;
      verified_by: 'user'; verified_at: string; updated_at: string;
    }[] = [];
    const deletes: { bank_id: string; category_id: string }[] = [];

    for (const key of dirty) {
      const [bank_id, category_id] = key.split(':');
      const rate = rates.get(key);
      const m = meta.get(key);
      if (rate !== undefined && !isNaN(rate)) {
        upserts.push({
          bank_id,
          category_id,
          rate,
          source_url: m?.sourceUrl?.trim() || null,
          verified_by: 'user',
          verified_at: nowIso,
          updated_at: nowIso,
        });
      } else {
        deletes.push({ bank_id, category_id });
      }
    }

    for (const u of upserts) {
      await supabase.from('bank_rates').upsert(u, { onConflict: 'bank_id,category_id' });
    }
    for (const d of deletes) {
      await supabase.from('bank_rates').delete().eq('bank_id', d.bank_id).eq('category_id', d.category_id);
    }

    setDirty(new Set());
    setSaving(false);
    setEditingSource(null);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ставки кэшбэка</h1>
          <p className="text-sm text-gray-500 mt-1">
            Показаны только активные банки. Сохранение помечает ставку как{' '}
            <span className="font-medium text-green-700">✓ verified</span> от пользователя.
            Кликни <Link2 size={12} className="inline" /> чтобы добавить источник.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Маркер: <span className="text-green-600">✓ verified</span> · <span className="text-red-500">⚠ AI</span>
            {' · '}Цвет даты: <span className="text-green-600">свежая</span> ·{' '}
            <span className="text-amber-600">2-8 нед.</span> ·{' '}
            <span className="text-red-600">более 2 мес.</span>
          </p>
        </div>
        {dirty.size > 0 && (
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Сохранение...' : `Сохранить (${dirty.size})`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
        <table className="text-sm w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">
                Банк
              </th>
              {CATEGORIES.map((cat) => (
                <th key={cat.id} className="px-2 py-2.5 font-medium text-gray-500 text-center min-w-[80px]">
                  <div className="flex flex-col items-center">
                    <span>{cat.emoji}</span>
                    <span className="text-[10px] mt-0.5">{cat.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banks.map((bank) => (
              <tr key={bank.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bank.color }} />
                    {bank.name}
                  </div>
                </td>
                {CATEGORIES.map((cat) => {
                  const key = getKey(bank.id, cat.id);
                  const val = rates.get(key);
                  const m = meta.get(key);
                  const isDirty = dirty.has(key);
                  const isEditing = editingSource === key;
                  return (
                    <td key={cat.id} className="px-1 py-1 text-center align-top">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className={`w-16 text-center border rounded px-1 py-1 text-sm ${
                          isDirty ? 'border-brand bg-brand-light' : 'border-gray-200'
                        }`}
                        value={val ?? ''}
                        onChange={(e) => updateRate(bank.id, cat.id, e.target.value)}
                        placeholder="—"
                      />
                      {val !== undefined && (
                        <div className="mt-1 flex flex-col items-center gap-0.5">
                          {m && (
                            <span
                              className={`text-[9px] font-semibold ${
                                m.verifiedBy === 'user' || m.verifiedBy === 'bank_site'
                                  ? 'text-green-600'
                                  : 'text-red-500'
                              }`}
                              title={`Источник: ${m.verifiedBy}`}
                            >
                              {m.verifiedBy === 'user' || m.verifiedBy === 'bank_site' ? '✓' : '⚠ AI'}
                            </span>
                          )}
                          {m && (
                            <span className={`text-[9px] ${freshnessColor(m.updatedAt)}`}>
                              {formatRelative(m.updatedAt)}
                            </span>
                          )}
                          {isEditing ? (
                            <input
                              type="url"
                              autoFocus
                              defaultValue={m?.sourceUrl ?? ''}
                              onBlur={(e) => {
                                updateSource(bank.id, cat.id, e.target.value);
                                setEditingSource(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                if (e.key === 'Escape') setEditingSource(null);
                              }}
                              placeholder="https://..."
                              className="w-20 text-[10px] border border-brand rounded px-1 py-0.5"
                            />
                          ) : m?.sourceUrl ? (
                            <a
                              href={m.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  setEditingSource(key);
                                }
                              }}
                              title="Открыть источник (Shift+click — редактировать)"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <button
                              onClick={() => setEditingSource(key)}
                              title="Добавить источник"
                              className="text-gray-300 hover:text-brand"
                            >
                              <Link2 size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
