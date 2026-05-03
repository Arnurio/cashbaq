import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Grid3X3, Megaphone,
  Lightbulb, Flag, BarChart2, Tag,
} from 'lucide-react';

const mainLinks = [
  { to: '/',          icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/banks',     icon: Building2,       label: 'Банки' },
  { to: '/categories',icon: Tag,             label: 'Категории' },
  { to: '/rates',     icon: Grid3X3,         label: 'Ставки' },
  { to: '/promos',    icon: Megaphone,       label: 'Промо-акции' },
  { to: '/tips',      icon: Lightbulb,       label: 'Советы' },
];

const secondaryLinks = [
  { to: '/reports',   icon: Flag,     label: 'Жалобы' },
  { to: '/analytics', icon: BarChart2, label: 'Аналитика' },
];

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/8'
        }`
      }
    >
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-60 bg-gray-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">%</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">Cashbaq</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Контент</p>
        {mainLinks.map(link => <NavItem key={link.to} {...link} />)}

        <div className="h-4" />
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Данные</p>
        {secondaryLinks.map(link => <NavItem key={link.to} {...link} />)}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/8">
        <p className="text-gray-600 text-xs">Казахстан · MVP</p>
      </div>
    </aside>
  );
}
