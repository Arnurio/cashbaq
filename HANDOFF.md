# HANDOFF.md — Quick Onboarding for Next Chat Session

> Прочитай этот файл первым. CLAUDE.md и STRATEGY.md — для деталей.

**Последнее обновление:** 2026-04-26 (после Phase 2 + DB cleanup)

---

## Состояние проекта

**Cashbaq** — кэшбэк-оптимизатор для банков Казахстана (Expo + Supabase).
**Готовность к запуску:** ~80%. Код и данные в порядке. Осталось — EAS Build + сабмит в сторы.

---

## Что сделано в последней сессии (PR #3)

### A — Ставки в БД (актуальные данные)
- `bank_rates`: Halyk 10 категорий (travel 5%, остальные 1%, telecom 0%)
- `bank_rates`: Jusan/Alatau 10 категорий (продукты/аптеки/рестораны 3%, АЗС 2%)
- `bank_rates`: Forte/BCC `_selected`/`_default` (15%/1% и 10%/1%)
- Freedom: levels config (standard/silver/gold/platinum + NFC)
- Bereke: subscription tiers (0/1/3/5/7%)
- Kaspi: тип `promo`, без фиксированных ставок

### B — Модель Kaspi
- `BankType` расширен: добавлен `'promo'`
- `app/find.tsx`: показывает «Только акции» бейдж для promo-карт
- DB constraint обновлён через миграцию

### C — Phase 2
- **Auth:** `lib/auth.ts` + `app/login.tsx` (email/password + skip)
- **Push:** `lib/notifications.ts` + auto-register в `_layout.tsx`
- **Landing:** `landing/index.html` — маркетинговая страница (отдельный Vercel deploy)

### Подготовка к сторам
- Иконка перерисована: `assets/icon.svg` → все размеры PNG (`scripts/gen-icons.js`)
- `STORE_LISTING.md` обновлён (Jusan→Alatau, Kaspi→promo)
- 5 скриншотов 1290×2796 в `assets/screenshots/` (`scripts/gen-screenshots.js`)

### БД-контент
- `tips` + `tip_items`: 4 совета (travel, grocery, fuel, hidden) с 12 пунктами
- `promos`: 6 партнёрских акций (Forte×Magnum, Halyk×Booking, Kaspi Juma и др.)

### Прочее
- Jusan Bank → Alatau City Bank во всём коде и БД
- Тесты: 59/59 ✅

---

## Что НЕ сделано (план для нового чата)

### 🚀 Критично для запуска

#### Шаг 1 — Удалить demo-карты из seed
В `admin/seed.js` или БД могут быть демо-карты `demo_kaspi`. Проверить и убрать:
```bash
grep -r "demo_" lib/ app/ admin/seed.js
```

#### Шаг 2 — EAS Build production (Android AAB)
```bash
eas build -p android --profile production
```
Перед этим проверить `eas.json` и `app.json` (версия, bundleId).

#### Шаг 3 — Apple Developer account ($99/год)
**Требует пользователя.** Без него iOS build не отправить.
После регистрации:
```bash
eas build -p ios --profile production
eas submit -p ios
```

#### Шаг 4 — Сабмит в Google Play
- Создать app в Play Console
- Загрузить AAB из шага 2
- Использовать тексты из `STORE_LISTING.md`
- Скриншоты из `assets/screenshots/`
- Иконка `assets/icon.png`

#### Шаг 5 — Деплой лендинга
```bash
cd landing && vercel --prod
```
Привязать домен (cashbaq.kz если есть).

### 🔧 Необязательно перед запуском

- **Verify реальные ставки** — открыть приложения банков, сверить (research doc говорит confidence MEDIUM/LOW)
- **Sentry** для отслеживания крашей в проде
- **Аналитика** — какие категории/банки популярны
- **Telegram-канал** — пустой создать, дать ссылку в приложении

### 📈 Phase 3 (после запуска)

- Контент-маркетинг
- Реферальная система
- Краудсорс промо от пользователей

---

## Подсказка для нового чата

```
Прочитай HANDOFF.md и CLAUDE.md.
Я хочу делать [Шаг 1/2/3/4/5] из секции "Что НЕ сделано".
Продолжаем оттуда.
```

---

## Текущее состояние БД (cdtnvqlxsbwcdiapbdkh)

| Таблица | Записи | Статус |
|---------|--------|--------|
| banks | 7 | ✅ типы исправлены, configs полные |
| bank_rates | 24 | ✅ Halyk/Jusan/Forte/BCC покрыты |
| tips | 4 | ✅ заполнено |
| tip_items | 12 | ✅ заполнено |
| promos | 6 | ✅ заполнено |
| rate_reports | 0 | пусто (фича работает) |
| user_cards | 0 | пусто (auth не используется массово) |

---

## Стек

```
Mobile:    Expo SDK 54 + React Native 0.81 + TypeScript + expo-router v6
Admin:     Vite 8 + React 19 + TailwindCSS v4
Backend:   Supabase (https://cdtnvqlxsbwcdiapbdkh.supabase.co)
Tests:     Jest + jest-expo (npx jest) — 59/59 ✅
Repo:      https://github.com/Arnurio/cashbaq (branch: main)
```

---

## Команды

```bash
# Pull
git pull origin main

# Tests
npx jest

# Web dev
npx expo start --web

# Static export (для скриншотов и Vercel)
npx expo export -p web

# Generate icons
node scripts/gen-icons.js

# Generate store screenshots (server должен работать на :3000)
node scripts/gen-screenshots.js

# EAS production build
eas build -p android --profile production
```

---

## 💰 Привычки экономии токенов

1. Не вставляй файлы в чат целиком → `lib/api.ts:30-60`
2. Конкретика вместо «исследуй» → конкретный файл и проблема
3. `/compact` когда контекст разрос
4. Делегируй ресёрч: `Используй subagent Explore чтобы найти ...`
5. Один файл за раз
6. `.claude/settings.json` allowlist уже настроен

---

## Открытые PR

- **#3** — текущая ветка `claude/pensive-northcutt-c9cd14`. Содержит всё из этой сессии.
  После merge → можно начинать Шаг 1 из плана.

---

## 🔗 Полезные ресурсы Anthropic

| Репозиторий | Зачем |
|-------------|-------|
| [anthropics/claude-code](https://github.com/anthropics/claude-code) | Hooks, examples |
| [anthropics/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) | Паттерны промптов |
| [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code/overview) | Официальные доки |
