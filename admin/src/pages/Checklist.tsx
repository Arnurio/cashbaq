import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Circle, RefreshCw, ExternalLink } from 'lucide-react';

const BANKS = [
  { id: 'kaspi',   name: 'Kaspi Gold',       url: 'https://guide.kaspi.kz/client/ru/gold',           ratesUrl: 'https://guide.kaspi.kz/client/ru/gold/bonus' },
  { id: 'halyk',   name: 'Halyk Bonus',       url: 'https://halykbank.kz/en/card/halyk-bonus-card',   ratesUrl: 'https://halykbank.kz/en/halykclub/promo' },
  { id: 'forte',   name: 'Forte Card',        url: 'https://bank.forte.kz/ru/cards',                  ratesUrl: 'https://forte.kz/cashbackplus' },
  { id: 'bcc',     name: 'BCC Card',          url: 'https://bcc.kz/cards',                            ratesUrl: 'https://club.bcc.kz/' },
  { id: 'freedom', name: 'Freedom Card',      url: 'https://bankffin.kz/ru/cards',                    ratesUrl: 'https://support.bankffin.kz/keshbek/kakoj-procent-po-keshbeku' },
  { id: 'bereke',  name: 'Bereke Card',       url: 'https://berekebank.kz/ru/visa-allin',             ratesUrl: 'https://berekebank.kz/ru/visa-allin' },
  { id: 'jusan',   name: 'Alatau City Card',  url: 'https://alataucitybank.kz/ru/cards',              ratesUrl: 'https://alataucitybank.kz/ru/cards' },
];

interface CheckState {
  [bankId: string]: { checked: boolean; checkedAt: string | null };
}

function getWeekStart(): Date {
  const now = new Date();
  const start = new Date(now);
  // Monday = 1, Sunday = 0; offset back to Monday
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekLabel(): string {
  return getWeekStart().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function getStorageKey(): string {
  return `cashbaq_audit_checklist_${getWeekStart().toISOString().slice(0, 10)}`;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function Checklist() {
  const [checks, setChecks] = useState<CheckState>({});
  const [staleCount, setStaleCount] = useState(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) setChecks(JSON.parse(saved));

    // Count rates not updated in 30+ days
    supabase
      .from('bank_rates')
      .select('updated_at')
      .then(({ data, error: err }) => {
        if (err) {
          setError('Не удалось загрузить ставки');
          return;
        }
        const stale = (data ?? []).filter((r: { updated_at: string | null }) => {
          if (!r.updated_at) return true;
          return daysSince(r.updated_at)! >= 30;
        });
        setStaleCount(stale.length);
      });
  }, []);

  const toggle = (bankId: string) => {
    setChecks((prev) => {
      const current = prev[bankId];
      const next: CheckState = {
        ...prev,
        [bankId]: {
          checked: !current?.checked,
          checkedAt: !current?.checked ? new Date().toISOString() : null,
        },
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    const cleared: CheckState = {};
    localStorage.setItem(getStorageKey(), JSON.stringify(cleared));
    setChecks(cleared);
  };

  const doneCount = BANKS.filter((b) => checks[b.id]?.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Еженедельный аудит ставок</h2>
          <p className="text-sm text-gray-500 mt-1">Неделя с {getWeekLabel()}</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2"
        >
          <RefreshCw size={14} />
          Сбросить
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {staleCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          ⚠️ <strong>{staleCount} ставок</strong> не обновлялись 30+ дней. Приоритет — проверить их через{' '}
          <a href="/rates" className="underline font-medium">Ставки</a>.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-6">
        {BANKS.map((bank) => {
          const state = checks[bank.id];
          const done = state?.checked ?? false;
          const days = daysSince(state?.checkedAt ?? null);

          return (
            <div key={bank.id} className="flex items-center gap-4 p-4">
              <button onClick={() => toggle(bank.id)} className="flex-shrink-0">
                {done
                  ? <CheckCircle2 size={24} className="text-brand" />
                  : <Circle size={24} className="text-gray-300" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {bank.name}
                </p>
                {done && days !== null && (
                  <p className="text-xs text-gray-400 mt-0.5">Проверено {days === 0 ? 'сегодня' : `${days} дн. назад`}</p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={bank.ratesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-600 hover:underline"
                >
                  Ставки
                  <ExternalLink size={12} />
                </a>
                <a
                  href={bank.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  Сайт
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900">Прогресс</p>
          <p className="text-sm text-gray-500">{doneCount} / {BANKS.length}</p>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${(doneCount / BANKS.length) * 100}%` }}
          />
        </div>
        {doneCount === BANKS.length && (
          <p className="text-sm text-brand font-medium mt-3 text-center">Все банки проверены!</p>
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Инструкция</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Открой сайт/приложение банка по ссылке</li>
          <li>Найди актуальную страницу ставок кэшбэка</li>
          <li>Сравни с данными в <a href="/rates" className="text-brand underline">Ставках</a></li>
          <li>Обнови расхождения, добавь <code className="bg-gray-100 px-1 rounded">source_url</code></li>
          <li>Отметь банк как проверенный</li>
        </ol>
      </div>
    </div>
  );
}
