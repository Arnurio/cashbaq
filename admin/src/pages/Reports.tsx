import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Trash2, ExternalLink } from 'lucide-react';

const CATEGORIES: Record<string, { name: string; emoji: string }> = {
  grocery: { name: 'Продукты', emoji: '🛒' },
  restaurants: { name: 'Кафе', emoji: '🍽' },
  transport: { name: 'Транспорт', emoji: '🚕' },
  clothing: { name: 'Одежда', emoji: '👗' },
  entertainment: { name: 'Развлечения', emoji: '🎬' },
  fuel: { name: 'АЗС', emoji: '⛽' },
  travel: { name: 'Путешествия', emoji: '✈️' },
  pharmacy: { name: 'Аптеки', emoji: '💊' },
  online: { name: 'Онлайн', emoji: '🌐' },
  telecom: { name: 'Связь', emoji: '📱' },
};

type Status = 'new' | 'resolved' | 'rejected';

interface Report {
  id: string;
  bank_id: string;
  category_id: string;
  current_rate: number | null;
  suggested_rate: number | null;
  comment: string | null;
  source_url: string | null;
  status: Status;
  created_at: string;
  banks?: { name: string } | null;
}

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'resolved', label: 'Решено' },
  { key: 'rejected', label: 'Отклонено' },
  { key: 'all', label: 'Все' },
];

const STATUS_BADGE: Record<Status, string> = {
  new: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<Status, string> = {
  new: 'Новая',
  resolved: 'Решено',
  rejected: 'Отклонено',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | Status>('new');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('rate_reports')
      .select('*, banks(name)')
      .order('created_at', { ascending: false });
    if (data) setReports(data as Report[]);
    setLoading(false);
  }

  async function setStatus(id: string, status: Status) {
    await supabase.from('rate_reports').update({ status }).eq('id', id);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Удалить жалобу безвозвратно?')) return;
    await supabase.from('rate_reports').delete().eq('id', id);
    await load();
  }

  const filtered = useMemo(
    () => (filter === 'all' ? reports : reports.filter((r) => r.status === filter)),
    [reports, filter]
  );

  const counts = useMemo(() => {
    const c: Record<'all' | Status, number> = { all: 0, new: 0, resolved: 0, rejected: 0 };
    for (const r of reports) {
      c.all++;
      c[r.status]++;
    }
    return c;
  }, [reports]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Жалобы на ставки</h1>
        <p className="text-sm text-gray-500 mt-1">
          Краудсорс от пользователей. «Решено» = ставку обновил в разделе «Ставки».
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f.key
                ? 'bg-brand text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} <span className="opacity-60">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Загрузка...</p>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Жалоб пока нет</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="text-sm w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Банк</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Категория</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Было</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Предложено</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Комментарий</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const cat = CATEGORIES[r.category_id];
              return (
                <tr key={r.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.banks?.name ?? r.bank_id}
                  </td>
                  <td className="px-4 py-3">
                    {cat ? `${cat.emoji} ${cat.name}` : r.category_id}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.current_rate !== null ? `${r.current_rate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand">
                    {r.suggested_rate !== null ? `${r.suggested_rate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[280px]">
                    <div className="line-clamp-3">{r.comment ?? '—'}</div>
                    {r.source_url && (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mt-1"
                      >
                        <ExternalLink size={11} /> источник
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status !== 'resolved' && (
                        <button
                          onClick={() => setStatus(r.id, 'resolved')}
                          title="Отметить решённой"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button
                          onClick={() => setStatus(r.id, 'rejected')}
                          title="Отклонить"
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(r.id)}
                        title="Удалить"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
