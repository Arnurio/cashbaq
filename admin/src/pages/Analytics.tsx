import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart2, TrendingUp, CreditCard, Tag } from 'lucide-react';

interface EventRow {
  event: string;
  properties: Record<string, unknown>;
  created_at: string;
}

interface CountEntry { label: string; count: number }

function topN(rows: EventRow[], key: string, n = 8): CountEntry[] {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const val = String(r.properties[key] ?? 'unknown');
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

const CATEGORY_NAMES: Record<string, string> = {
  grocery: '🛒 Продукты',
  restaurants: '🍽 Рестораны',
  transport: '🚌 Транспорт',
  clothing: '👕 Одежда',
  entertainment: '🎭 Развлечения',
  fuel: '⛽ Топливо',
  travel: '✈️ Путешествия',
  pharmacy: '💊 Аптека',
  online: '🛍 Онлайн',
  telecom: '📱 Связь',
};

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="bg-brand-light p-3 rounded-lg">
        <Icon size={20} className="text-brand" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function BarList({ title, data }: { title: string; data: CountEntry[] }) {
  const max = data[0]?.count ?? 1;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map(({ label, count }) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{CATEGORY_NAMES[label] ?? label}</span>
              <span className="font-semibold text-gray-900">{count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Нет данных</p>
        )}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('analytics_events')
      .select('event, properties, created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5000)
      .then(({ data, error: err }) => {
        if (err) setError('Не удалось загрузить события');
        else setEvents((data as EventRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const totalEvents = events.length;
  const categoryEvents = events.filter((e) => e.event === 'category_selected');
  const cardAddedEvents = events.filter((e) => e.event === 'card_added');
  const reportEvents = events.filter((e) => e.event === 'inaccuracy_reported');

  const topCategories = topN(categoryEvents, 'category');
  const topBanks = topN(cardAddedEvents, 'bank_id');

  if (loading) {
    return <div className="text-gray-500 text-sm">Загрузка аналитики...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Аналитика</h2>
      <p className="text-sm text-gray-500 mb-6">За последние 30 дней</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Всего событий" value={totalEvents} icon={BarChart2} />
        <StatCard title="Выборов категорий" value={categoryEvents.length} icon={Tag} />
        <StatCard title="Добавлено карт" value={cardAddedEvents.length} icon={CreditCard} />
        <StatCard title="Жалоб на ставки" value={reportEvents.length} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarList title="Топ категорий" data={topCategories} />
        <BarList title="Топ добавляемых карт (банк)" data={topBanks} />
      </div>
    </div>
  );
}
