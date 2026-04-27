import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Grid3X3, Megaphone, Lightbulb, Flag, BarChart2, ClipboardList, Bell } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/banks', icon: Building2, label: 'Банки' },
  { to: '/rates', icon: Grid3X3, label: 'Ставки' },
  { to: '/promos', icon: Megaphone, label: 'Промо' },
  { to: '/tips', icon: Lightbulb, label: 'Советы' },
  { to: '/reports', icon: Flag, label: 'Жалобы' },
  { to: '/notifications', icon: Bell, label: 'Уведомления' },
  { to: '/analytics', icon: BarChart2, label: 'Аналитика' },
  { to: '/checklist', icon: ClipboardList, label: 'Аудит' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-brand">Cashbaq Admin</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-light text-brand'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
