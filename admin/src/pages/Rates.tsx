import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

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
}

export default function Rates() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [rates, setRates] = useState<Map<string, number>>(new Map());
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [b, r] = await Promise.all([
        supabase.from('banks').select('id, name, color').order('name'),
        supabase.from('bank_rates').select('*'),
      ]);
      if (b.data) setBanks(b.data);
      if (r.data) {
        const map = new Map<string, number>();
        (r.data as Rate[]).forEach((row) => map.set(`${row.bank_id}:${row.category_id}`, row.rate));
        setRates(map);
      }
    }
    load();
  }, []);

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

  async function saveAll() {
    setSaving(true);
    const upserts: Rate[] = [];
    const deletes: { bank_id: string; category_id: string }[] = [];

    for (const key of dirty) {
      const [bank_id, category_id] = key.split(':');
      const rate = rates.get(key);
      if (rate !== undefined && !isNaN(rate)) {
        upserts.push({ bank_id, category_id, rate });
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
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ставки кэшбэка</h1>
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
                <th key={cat.id} className="px-2 py-2.5 font-medium text-gray-500 text-center min-w-[70px]">
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
                  const isDirty = dirty.has(key);
                  return (
                    <td key={cat.id} className="px-1 py-1 text-center">
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
