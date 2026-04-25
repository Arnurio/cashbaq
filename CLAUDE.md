# CLAUDE.md — Контекст проекта Cashbaq

## Проект
**Cashbaq** — кэшбэк-оптимизатор для банков Казахстана.
Пользователь добавляет свои карты, выбирает категорию покупки → приложение показывает какой картой выгоднее платить.

## Стек
- **Mobile:** Expo SDK 54 + React Native 0.81 + TypeScript 5.9
- **Routing:** expo-router v6 (file-based)
- **Backend:** Supabase (PostgreSQL + REST API)
- **Admin panel:** Vite 8 + React 19 + TailwindCSS v4 (отдельное приложение в `admin/`)
- **Icons:** lucide-react-native (mobile), lucide-react (admin)
- **Font:** Manrope (Google Fonts)
- **Testing:** Jest + jest-expo
- **Web deploy:** Vercel
- **Mobile deploy:** EAS Build

## Supabase
- URL: `https://cdtnvqlxsbwcdiapbdkh.supabase.co`
- Key (anon): `sb_publishable_t_ZX1tPKl9q93fdiVU-LeA_rrnK4Sv5`
- Клиент захардкожен в: `lib/supabase.ts`, `admin/src/lib/supabase.ts`, `admin/seed.js`

## Структура проекта
```
app/                  # Экраны мобильного приложения (expo-router)
  _layout.tsx         # Root layout (шрифты, onboarding, ErrorBoundary)
  onboarding.tsx      # Онбординг
  find.tsx            # "Чем платить?" (модал)
  add-card.tsx        # Добавление карты (модал)
  card-detail.tsx     # Детали карты
  (tabs)/
    index.tsx         # Главная (рекомендации)
    cards.tsx         # Список карт пользователя
    tips.tsx          # Советы

lib/                  # Логика и утилиты
  supabase.ts         # Supabase клиент (SafeStorage обёртка)
  api.ts              # fetchBanks/fetchPromos/fetchTips + кэш
  types.ts            # TypeScript типы (Bank, UserCard, Category, Promo, Tip)
  constants.ts        # 10 категорий покупок
  cashback.ts         # Расчёт кэшбэка (getCardRate, getBestCard, getMarketBestRate)
  storage.ts          # AsyncStorage: карты пользователя + onboarding flag
  useData.ts          # Глобальный хук (cache-first → Supabase refresh)
  bankData.ts         # Статический fallback данных банков

admin/                # Отдельное Vite-приложение (своё package.json)
  src/pages/          # Dashboard, Banks, Rates, Promos, Tips (CRUD)
  seed.js             # Скрипт заполнения БД
```

## Банки (7 шт.)
- **Kaspi** (`kaspi`) — fixed
- **Halyk** (`halyk`) — fixed
- **Forte** (`forte`) — selectable (3 категории)
- **BCC** (`bcc`) — selectable (3 категории)
- **Freedom** (`freedom`) — leveled (standard/silver/gold/platinum + NFC)
- **Bereke** (`bereke`) — fixed / subscription
- **Jusan** (`jusan`) — fixed

## Типы кэшбэка (BankType)
- `fixed` — фиксированные ставки по категориям
- `selectable` — пользователь выбирает N категорий с повышенным %
- `leveled` — зависит от уровня карты + NFC бонус
- `subscription` — зависит от тарифа/депозита

## База данных (6 таблиц)
- `banks` — список банков с цветами, градиентами, типом, конфигом
- `bank_rates` — ставки (bank_id + category_id → rate)
- `promos` — промо-акции
- `tips` / `tip_items` — советы
- `user_cards` — карты пользователей (RLS: только владелец)

## Дизайн
- Brand color: `#0D7C5F`
- Background: `#F6F8FA`
- Шрифт: Manrope (5 начертаний)
- Каждый банк имеет свой цвет и градиент

## Важные правила
1. **НЕ обновлять Expo SDK** без явного разрешения — может сломать совместимость
2. **Интерфейс на русском** языке
3. **Админка** запускается только локально (`cd admin && npm run dev`) — не деплоить
4. **AsyncStorage** обёрнут в SafeStorage (try/catch) — для работы на web и Expo Go
5. **Данные** загружаются cache-first: сначала из AsyncStorage, потом обновление из Supabase
6. **Нет авторизации** в MVP — карты хранятся локально
7. **Коммить** после каждого значимого изменения
8. SQL-схема в `sql_init.txt`, дополнительные RLS в `rls.txt`

## Запуск
```bash
# Mobile dev
npm install && npx expo start

# Web
npx expo start --web

# Admin panel
cd admin && npm install && npm run dev

# Seed DB
node admin/seed.js
```

## GitHub
- Repo: https://github.com/Arnurio/cashbaq.git
- Branch: main
- Bundle ID: com.cashbaq.app
- EAS Project ID: 32cc8607-6968-472c-a1b0-208c0276db2e
