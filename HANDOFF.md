# HANDOFF.md — Quick Onboarding for Next Chat Session

> Прочитай этот файл первым в новом чате — он даст полный контекст за минуту.
> После прочтения переходи к [CLAUDE.md](CLAUDE.md), [STRATEGY.md](STRATEGY.md), [AGENTS.md](AGENTS.md).

---

## Текущее состояние проекта (последнее обновление: 2026-05-05)

**Cashbaq** — кэшбэк-оптимизатор для банков Казахстана (Expo + Supabase).
Проект НЕ запущен. Главный блокер: владелец не занёс реальные ставки в БД.

---

## Что сделано (полный список)

### Инфраструктура и данные
- ✅ Supabase: 7 таблиц (`banks`, `bank_rates`, `promos`, `tips`, `tip_items`, `user_cards`, `rate_reports`)
- ✅ Миграции: `001_init`, `001_add_rate_metadata`, `002_rate_reports`, `003_analytics_events`, `004_verification_metadata`
- ✅ `bank_rates` имеет: `rate`, `updated_at`, `source_url`, `verified_by`, `verified_at`, `verified_note`
- ✅ `banks` имеет: `is_active` — Kaspi/Halyk/Freedom активны, Forte/BCC/Bereke/Alatau City скрыты
- ✅ `banks.type` CHECK constraint включает `'promo'` (Kaspi = promo-тип)

### Mobile app
- ✅ Все 3 таба: главная (рекомендации), карты, советы
- ✅ Модалы: find.tsx, add-card.tsx, card-detail.tsx
- ✅ Онбординг
- ✅ Кнопка «Сообщить о неточности» + `ReportInaccuracyModal`
- ✅ Бейдж верификации: зелёный **✓** для `user`/`bank_site`, янтарный **AI** для `ai_estimate`
- ✅ Дата обновления ставок («Обновлено N дней назад»)
- ✅ Ссылка на источник ставки (иконка ExternalLink)
- ✅ Kaspi модель = `promo`: возвращает 0 по всем категориям, промо-акции идут через `promos`

### Admin panel (`admin/`)
- ✅ Banks, Rates, Categories, Promos, Tips, Reports — полный CRUD
- ✅ Rates: бейдж ✓/⚠AI per ячейка, автоматически `verified_by='user'` при сохранении
- ✅ Analytics dashboard

### Качество
- ✅ **59/59 тестов**, TypeScript чист
- ✅ `lib/__tests__/fixtures/testBanks.ts` — все 7 банков для тестов cashback-движка

---

## Состояние базы данных (прямо сейчас)

| Банк | is_active | Ставок в bank_rates | verified_by |
|------|-----------|---------------------|-------------|
| Kaspi | ✅ true | 0 (promo-тип, не нужны) | — |
| Halyk | ✅ true | 9 (все категории) | ai_estimate ⚠️ |
| Freedom | ✅ true | 0 ← **ПУСТО** | — |
| Forte | ❌ false | 2 (скрыты) | ai_estimate |
| BCC | ❌ false | 2 (скрыты) | ai_estimate |
| Bereke | ❌ false | 0 | — |
| Alatau City (Jusan) | ❌ false | 9 (скрыты) | ai_estimate |

---

## Главный блокер → следующий шаг (для ВЛАДЕЛЬЦА, не агента)

**Freedom не имеет ни одной ставки.** Halyk имеет 9 ставок — все `ai_estimate` и некоторые явно неточны (rate=1.00 для всех категорий).

Нужно: открыть приложение Freedom и Halyk на телефоне → занести реальные ставки через `cd admin && npm run dev` → http://localhost:5173/rates. После сохранения ставки автоматически получат `verified_by='user'` и зелёный ✓ в мобилке.

---

## Открытые задачи для агентов

### (A) Phase 2 — Запуск
- [ ] Supabase Auth (Google + email)
- [ ] Push Notifications (Expo)
- [ ] Лендинг на Vercel (`landing/` папка уже есть)
- [ ] App Store + Google Play submission
- [ ] Аналитика событий

### (B) Расширение банков
Для каждого неактивного банка: получить реальные ставки от владельца → занести через admin → `UPDATE banks SET is_active=true WHERE id='forte'`

### (C) Улучшения UX
- Экран «Сравнение карт» для одной категории
- Фильтр на главном экране по банку
- Пустое состояние для Freedom (0 ставок сейчас)

---

## Стек / Подключения

```
Mobile:    Expo SDK 54 + React Native 0.81 + TypeScript + expo-router v6
Admin:     Vite 8 + React 19 + TailwindCSS v4 (отдельный package.json в admin/)
Backend:   Supabase (URL: [REDACTED])
Tests:     Jest + jest-expo (npx jest) — 59/59
Repo:      https://github.com/Arnurio/cashbaq (branch: main)
```

---

## Команды для агента в новом чате

```bash
# 1. Подтянуть последнее
git pull origin main

# 2. Проверить статус
git status
git log --oneline -10

# 3. Тесты
npx jest

# 4. TypeScript
npx tsc --noEmit

# 5. Запустить админку для аудита ставок
cd admin && npm run dev

# 6. Запустить мобильное
npx expo start --web
```

---

## Подсказка для нового чата

```
Прочитай HANDOFF.md и CLAUDE.md. Я хочу сделать [задача из секции "Открытые задачи"].
```

---

## Иерархия верификации ставок

| Уровень | verified_by | UX-маркер в мобилке |
|---------|-------------|---------------------|
| 🟢 A | `user` | зелёный ✓ |
| 🟡 B | `community` | зелёный ✓ |
| 🟠 C | `bank_site` | зелёный ✓ + ссылка |
| 🔴 D | `ai_estimate` | янтарный AI |

Ставка показывается пользователю при любом `verified_by`, но AI-ставки помечены визуально.

---

## 💰 Привычки экономии токенов

### 1. Не вставляй файлы в чат целиком
❌ «Вот мой код, посмотри [paste 500 строк]»
✅ «Посмотри `lib/api.ts:30-60`» — агент сам прочитает только нужные строки.

### 2. Конкретика вместо «исследуй»
❌ «Проверь весь проект на баги»
✅ «Проверь `app/card-detail.tsx` на потенциальные null-ошибки»

### 3. Используй `/compact` когда контекст разрос
Команда `/compact` сжимает историю чата, оставляя ключевые факты.

### 4. Делегируй ресёрч субагентам
```
Используй subagent Explore чтобы найти ...
Используй subagent general-purpose чтобы исследовать ...
```

### 5. Один файл за раз при больших правках

### 6. Закрывай задачу одним PR
