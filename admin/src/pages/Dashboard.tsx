import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Megaphone, Lightbulb, Tag, Grid3X3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [counts, setCounts] = useState({ banks: 0, categories: 0, promos: 0, tips: 0, rates: 0 });

  useEffect(() => {
    async function load() {
      const [b, c, p, t, r] = await Promise.all([
        supabase.from('banks').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('promos').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('tips').select('id', { count: 'exact', head: true }),
        supabase.from('bank_rates').select('bank_id', { count: 'exact', head: true }),
      ]);
      setCounts({
        banks: b.count ?? 0,
        categories: c.count ?? 0,
        promos: p.count ?? 0,
        tips: t.count ?? 0,
        rates: r.count ?? 0,
      });
    }
    load();
  }, []);

  const cards = [
    { label: 'Банков',     count: counts.banks,      icon: Building2, to: '/banks',      color: 'bg-blue-50 text-blue-600' },
    { label: 'Категорий',  count: counts.categories, icon: Tag,       to: '/categories', color: 'bg-violet-50 text-violet-600' },
    { label: 'Ставок',     count: counts.rates,      icon: Grid3X3,   to: '/rates',      color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Промо-акций',count: counts.promos,     icon: Megaphone, to: '/promos',     color: 'bg-orange-50 text-orange-600' },
    { label: 'Советов',    count: counts.tips,       icon: Lightbulb, to: '/tips',       color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-1">Управление контентом приложения Cashbaq</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(({ label, count, icon: Icon, to, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={18} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/categories"
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            <Tag size={15} />
            Управлять категориями
          </Link>
          <Link
            to="/promos"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Megaphone size={15} />
            Добавить промо
          </Link>
          <Link
            to="/rates"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Grid3X3 size={15} />
            Редактировать ставки
          </Link>
          <Link
            to="/banks"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Building2 size={15} />
            Банки
          </Link>
        </div>
      </div>
    </div>
  );
}
