import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

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
  const toast = useToast();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Promo> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [p, b, c] = await Promise.all([
      supabase.from('promos').select('*').order('id', { ascending: false }),
      supabase.from('banks').select('id, name').order('name'),
      supabase.from('categories').select('id, name, emoji').eq('is_active', true).order('sort_order'),
    ]);
    if (p.data) setPromos(p.data);
    if (b.data) setBanks(b.data);
    if (c.data) setCategories(c.data);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const { id, ...data } = editing;
    if (id) {
      const { error } = await supabase.from('promos').update(data).eq('id', id);
      if (error) toast.error('Ошибка сохранения');
      else toast.success('Промо обновлено');
    } else {
      const { error } = await supabase.from('promos').insert(data);
      if (error) toast.error('Ошибка создания');
      else toast.success('Промо добавлено');
    }
    setSaving(false);
    setEditing(null);
    loadAll();
  }

  async function toggleActive(promo: Promo) {
    await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id);
    toast.info(`${promo.title} ${promo.is_active ? 'деактивирована' : 'активирована'}`);
    loadAll();
  }

  async function remove() {
    if (!deleteTarget) return;
    await supabase.from('promos').delete().eq('id', deleteTarget.id);
    toast.success('Промо удалено');
    setDeleteTarget(null);
    loadAll();
  }

  const bankMap = new Map(banks.map(b => [b.id, b.name]));
  const catMap = new Map(categories.map(c => [c.id, `${c.emoji} ${c.name}`]));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Промо-акции</h1>
          <p className="text-gray-500 text-sm mt-1">{promos.filter(p => p.is_active).length} активных</p>
        </div>
        <button
          onClick={() => setEditing({ ...emptyPromo })}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors shadow-sm"
        >
          <Plus size={16} />
          Добавить промо
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
            {promos.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Нет промо-акций</td></tr>
            )}
            {promos.map(promo => (
              <tr key={promo.id} className={`hover:bg-gray-50 transition-colors ${!promo.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {promo.emoji} {promo.title}
                  {promo.is_new && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded font-bold">NEW</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{bankMap.get(promo.bank_id) ?? promo.bank_id}</td>
                <td className="px-4 py-3 text-gray-600">{catMap.get(promo.category_id ?? '') ?? '—'}</td>
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
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      promo.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {promo.is_active ? 'Активна' : 'Неактивна'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditing({ ...promo })}
                      className="text-sm text-brand hover:underline font-medium"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => setDeleteTarget(promo)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing.id ? 'Редактировать промо' : 'Новая промо-акция'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Банк</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={editing.bank_id ?? ''}
                  onChange={e => setEditing({ ...editing, bank_id: e.target.value })}
                >
                  <option value="">Выберите банк</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    value={editing.title ?? ''}
                    onChange={e => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Кэшбэк на продукты"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Emoji</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand"
                    value={editing.emoji ?? ''}
                    onChange={e => setEditing({ ...editing, emoji: e.target.value })}
                    placeholder="🛒"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  rows={2}
                  value={editing.description ?? ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    value={editing.category_id ?? ''}
                    onChange={e => setEditing({ ...editing, category_id: e.target.value })}
                  >
                    <option value="">—</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ставка %</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    value={editing.rate ?? ''}
                    onChange={e => setEditing({ ...editing, rate: e.target.value ? Number(e.target.value) : null })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Дата окончания</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    value={editing.end_date ?? ''}
                    onChange={e => setEditing({ ...editing, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-6 py-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_new ?? false}
                    onChange={e => setEditing({ ...editing, is_new: e.target.checked })}
                    className="accent-brand w-4 h-4"
                  />
                  NEW бейдж
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_active ?? true}
                    onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                    className="accent-brand w-4 h-4"
                  />
                  Активна
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.bank_id || !editing.title}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Удалить промо?</h2>
            <p className="text-sm text-gray-500 mb-6">«{deleteTarget.emoji} {deleteTarget.title}» будет удалена безвозвратно.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={remove}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
