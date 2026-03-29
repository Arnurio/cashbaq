import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, X, Trash2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'grocery', name: 'Продукты' },
  { id: 'restaurants', name: 'Кафе и рестораны' },
  { id: 'transport', name: 'Транспорт' },
  { id: 'clothing', name: 'Одежда' },
  { id: 'entertainment', name: 'Развлечения' },
  { id: 'fuel', name: 'АЗС' },
  { id: 'travel', name: 'Путешествия' },
  { id: 'pharmacy', name: 'Аптеки' },
  { id: 'online', name: 'Онлайн-покупки' },
  { id: 'telecom', name: 'Связь' },
];

interface Bank {
  id: string;
  name: string;
}

interface Promo {
  id: number;
  bank_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  rate: number | null;
  emoji: string | null;
  end_date: string | null;
  is_new: boolean;
  is_active: boolean;
}

const emptyPromo: Omit<Promo, 'id'> = {
  bank_id: '',
  title: '',
  description: '',
  category_id: '',
  rate: null,
  emoji: '',
  end_date: '',
  is_new: false,
  is_active: true,
};

export default function Promos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [editing, setEditing] = useState<Partial<Promo> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [p, b] = await Promise.all([
      supabase.from('promos').select('*').order('id', { ascending: false }),
      supabase.from('banks').select('id, name').order('name'),
    ]);
    if (p.data) setPromos(p.data);
    if (b.data) setBanks(b.data);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const { id, ...data } = editing;
    if (id) {
      await supabase.from('promos').update(data).eq('id', id);
    } else {
      await supabase.from('promos').insert(data);
    }
    setSaving(false);
    setEditing(null);
    loadAll();
  }

  async function toggleActive(promo: Promo) {
    await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id);
    loadAll();
  }

  async function remove(id: number) {
    if (!confirm('Удалить эту промо-акцию?')) return;
    await supabase.from('promos').delete().eq('id', id);
    loadAll();
  }

  const bankMap = new Map(banks.map((b) => [b.id, b.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Промо-акции</h1>
        <button
          onClick={() => setEditing({ ...emptyPromo })}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Промо</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Банк</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Категория</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Ставка</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">До</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promos.map((promo) => (
              <tr key={promo.id} className={`hover:bg-gray-50 ${!promo.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {promo.emoji} {promo.title}
                  {promo.is_new && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded font-bold">NEW</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{bankMap.get(promo.bank_id) ?? promo.bank_id}</td>
                <td className="px-4 py-3 text-gray-600">
                  {CATEGORIES.find((c) => c.id === promo.category_id)?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-brand">
                  {promo.rate ? `${promo.rate}%` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {promo.end_date
                    ? new Date(promo.end_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(promo)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      promo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {promo.is_active ? 'Активна' : 'Неактивна'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setEditing({ ...promo })} className="text-brand hover:underline text-sm">
                      Изменить
                    </button>
                    <button onClick={() => remove(promo.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing.id ? 'Редактирование' : 'Новая промо-акция'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Банк</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editing.bank_id ?? ''}
                  onChange={(e) => setEditing({ ...editing, bank_id: e.target.value })}
                >
                  <option value="">Выберите банк</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.title ?? ''}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.emoji ?? ''}
                    onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.category_id ?? ''}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
                  >
                    <option value="">—</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ставка %</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.rate ?? ''}
                    onChange={(e) => setEditing({ ...editing, rate: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.end_date ?? ''}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_new ?? false}
                    onChange={(e) => setEditing({ ...editing, is_new: e.target.checked })}
                    className="accent-brand"
                  />
                  NEW бейдж
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_active ?? true}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    className="accent-brand"
                  />
                  Активна
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Отмена
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.bank_id || !editing.title}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
