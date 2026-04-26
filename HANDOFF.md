# HANDOFF.md — Quick Onboarding for Next Chat Session

> Прочитай этот файл первым в новом чате — он даст полный контекст за минуту.
> После прочтения переходи к [CLAUDE.md](CLAUDE.md), [STRATEGY.md](STRATEGY.md), [AGENTS.md](AGENTS.md).

---

## Текущее состояние проекта (последнее обновление: 2026-04-26)

**Cashbaq** — кэшбэк-оптимизатор для банков Казахстана (Expo + Supabase).
Проект НЕ запущен. Цель: реальная база ставок → запуск → органический рост.

---

## Что сделано в последней сессии

### Open PR: [#2](https://github.com/Arnurio/cashbaq/pull/2) — Phase 1.1 + 1.2

**Phase 1, задача №1 — `updated_at` + `source_url` в `bank_rates`:**
- Миграция `supabase/migrations/001_add_rate_metadata.sql` применена к Supabase (cdtnvqlxsbwcdiapbdkh)
- Триггер автоматически обновляет `updated_at` при каждом UPDATE
- Mobile UI ([app/card-detail.tsx](app/card-detail.tsx)) показывает «Обновлено N дн. назад» + иконка-ссылка на источник
- Admin ([admin/src/pages/Rates.tsx](admin/src/pages/Rates.tsx)) — цветовая индикация свежести (🟢🟡🔴) + поле для source_url
- Тип `RateMeta` в [lib/types.ts](lib/types.ts), `Bank.rateMeta?` опционально

**Phase 1, задача №2 — кнопка «Сообщить о неточности»:**
- Миграция `supabase/migrations/002_rate_reports.sql` применена к Supabase
- Mobile: `components/ReportInaccuracyModal.tsx` (bottom-sheet, Android-friendly) + кнопка в card-detail
- Admin: новая страница `/reports` — фильтры (Новые/Решено/Отклонено) + actions (resolve/reject/delete)

**Тесты:**
- 12 новых тестов в `lib/__tests__/api.test.ts` для rateMeta parsing
- **Полный suite: 59/59 ✅**, tsc чисто

**Research:**
- `docs/RATE_RESEARCH_2026-04-26.md` — изучены публичные страницы Kaspi/Halyk/Forte
- ⚠️ **Главное**: per-category грид нельзя получить из веба → нужен ручной апдейт раз в месяц из app каждого банка
- ⚠️ **Kaspi Gold не подходит под `fixed`** — у него только промо-акции (флаг для пересмотра модели данных)

---

## Что НЕ сделано (3 открытых решения для пользователя)

После merge PR #2 нужно выбрать одно:

### (A) Аудит реальных ставок через админку
Запустить `cd admin && npm install && npm run dev` → http://localhost:5173/rates
Открыть сайт/app каждого банка → сверить ставки → сохранить с `source_url`.
**Это разблокирует запуск.**

### (B) Пересмотр модели Kaspi (fixed → promo-based)
Kaspi Gold не имеет фиксированных категорий — только промо. Сейчас введём юзеров в заблуждение.
Варианты в `docs/RATE_RESEARCH_2026-04-26.md`.

### (C) Phase 2 — запуск
- Supabase Auth (Google + email)
- Push Notifications (Expo)
- Лендинг на Vercel
- App Store + Google Play submission
- Аналитика

---

## Команда параллельных агентов (уже настроена)

См. [AGENTS.md](AGENTS.md) — структура работы нескольких агентов через git worktrees.
Каждый агент берёт свою зону файлов, дирижёр (главный аккаунт) сводит через merge.

---

## Стек / Подключения

```
Mobile:    Expo SDK 54 + React Native 0.81 + TypeScript + expo-router v6
Admin:     Vite 8 + React 19 + TailwindCSS v4 (отдельный package.json в admin/)
Backend:   Supabase (URL: https://cdtnvqlxsbwcdiapbdkh.supabase.co)
Tests:     Jest + jest-expo (npx jest)
Repo:      https://github.com/Arnurio/cashbaq (branch: main)
```

---

## Команды для агента в новом чате

```bash
# 1. Подтянуть последнее
git pull origin main  # после merge PR #2

# 2. Проверить статус
git status
git log --oneline -10

# 3. Если нужны тесты
npx jest

# 4. Запустить админку для аудита (Вариант A)
cd admin && npm run dev

# 5. Запустить мобильное
npx expo start --web
```

---

## Подсказка для нового чата

Начни новый чат сообщением:
```
Прочитай HANDOFF.md и CLAUDE.md. Я выбираю вариант [A/B/C] из секции
"Что НЕ сделано". Продолжаем оттуда.
```

Это сэкономит токены — агент войдёт в контекст за 1 чтение вместо длинной переписки.
