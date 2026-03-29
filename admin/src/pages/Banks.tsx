import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, X } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  card_name: string;
  color: string;
  type: string;
  description: string;
  note: string;
  url: string;
  monthly_limit: number | null;
  daily_limit: number | null;
  has_lounge: boolean;
  has_insurance: boolean;
  config: Record<string, unknown>;
}

export default function Banks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBanks();
  }, []);

  async function loadBanks() {
    const { data } = await supabase.from('banks').select('*').order('name');
    if (data) setBanks(data);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const { id, ...rest } = editing;
    await supabase.from('banks').update(rest).eq('id', id);
    setSaving(false);
    setEditing(null);
    loadBanks();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Банки</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Банк</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Карта</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Тип</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Лимит/мес</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Лимит/день</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banks.map((bank) => (
              <tr key={bank.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }} />
                    {bank.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{bank.card_name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{bank.type}</span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {bank.monthly_limit?.toLocaleString('ru-RU') ?? '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {bank.daily_limit?.toLocaleString('ru-RU') ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing({ ...bank })}
                    className="text-brand hover:underline text-sm"
                  >
                    Изменить
                  </button>
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
              <h2 className="text-lg font-semibold text-gray-900">Редактирование: {editing.name}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметка</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editing.note ?? ''}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Лимит/мес</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.monthly_limit ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, monthly_limit: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Лимит/день</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editing.daily_limit ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, daily_limit: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.has_lounge}
                    onChange={(e) => setEditing({ ...editing, has_lounge: e.target.checked })}
                    className="accent-brand"
                  />
                  Lounge
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.has_insurance}
                    onChange={(e) => setEditing({ ...editing, has_insurance: e.target.checked })}
                    className="accent-brand"
                  />
                  Страховка
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={save}
                disabled={saving}
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
