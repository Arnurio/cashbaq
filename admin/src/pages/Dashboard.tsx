import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Megaphone, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [counts, setCounts] = useState({ banks: 0, promos: 0, tips: 0 });

  useEffect(() => {
    async function load() {
      const [b, p, t] = await Promise.all([
        supabase.from('banks').select('id', { count: 'exact', head: true }),
        supabase.from('promos').select('id', { count: 'exact', head: true }),
        supabase.from('tips').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({
        banks: b.count ?? 0,
        promos: p.count ?? 0,
        tips: t.count ?? 0,
      });
    }
    load();
  }, []);

  const cards = [
    { label: 'Банки', count: counts.banks, icon: Building2, to: '/banks' },
    { label: 'Промо-акции', count: counts.promos, icon: Megaphone, to: '/promos' },
    { label: 'Советы', count: counts.tips, icon: Lightbulb, to: '/tips' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Дашборд</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {cards.map(({ label, count, icon: Icon, to }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                <Icon size={20} className="text-brand" />
              </div>
              <span className="text-sm text-gray-500">{label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{count}</p>
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые ссылки</h2>
        <div className="flex gap-3">
          <Link to="/promos" className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90">
            + Добавить промо
          </Link>
          <Link to="/rates" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Редактировать ставки
          </Link>
          <Link to="/banks" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Управление банками
          </Link>
        </div>
      </div>
    </div>
  );
}
