# ARCHITECTURE.md — Техническая архитектура Cashbaq

> Читай этот файл перед тем, как трогать lib/ или глобальное состояние.
> Здесь — почему всё устроено именно так, а не справочник по файлам (это в CLAUDE.md).

---

## ОБЗОР: ТРИ НЕЗАВИСИМЫЕ ЧАСТИ

```
┌─────────────────────────────────────────────────────────┐
│                     ПОЛЬЗОВАТЕЛЬ                        │
│              (Android / iOS / Web)                      │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              EXPO MOBILE APP (корень)                   │
│  app/  ←  lib/  ←  components/  ←  assets/             │
│  expo-router v6 (file-based routing)                    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (Supabase REST API)
┌───────────────────────▼─────────────────────────────────┐
│                   SUPABASE                              │
│  PostgreSQL  +  REST API  +  RLS  +  Storage            │
│  Project: cdtnvqlxsbwcdiapbdkh                          │
└───────────────────────┬─────────────────────────────────┘
                        │ (только локально)
┌───────────────────────▼─────────────────────────────────┐
│            ADMIN PANEL (admin/)                         │
│  Vite 8  +  React 19  +  TailwindCSS v4                 │
│  Отдельный package.json, отдельные зависимости          │
└─────────────────────────────────────────────────────────┘
```

**Ключевое:** admin/ и mobile app — это два разных приложения. Они не обмениваются модулями. Единственная общая точка — Supabase.

---

## СЛОЙ ДАННЫХ: CACHE-FIRST АРХИТЕКТУРА

### Проблема которую решали

Supabase — внешний сервис. На медленном интернете приложение зависает на загрузке. На Expo Go / Web AsyncStorage не всегда работает надёжно.

### Решение: три уровня данных

```
Запрос данных:
1. Память (JS object в useData.ts)  ← мгновенно, теряется при закрытии
      ↓ промах
2. AsyncStorage (device storage)    ← быстро, сохраняется между сессиями
      ↓ промах или устарело
3. Supabase (network)               ← медленно, всегда актуально
      ↓ успех
   → обновить AsyncStorage
   → обновить память
   → уведомить все подписанные компоненты
```

### Реализация: useData.ts

`lib/useData.ts` — это глобальный store (без Redux, без Zustand, только React + callbacks).

```typescript
// Паттерн подписки (упрощённо)
const listeners = new Set<() => void>()

export function subscribeToData(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)   // cleanup
}

function notifyAll() {
  listeners.forEach(cb => cb())
}
```

**Почему не Context / Zustand / Redux:**
- Context вызывает ре-рендер всего дерева при любом изменении
- Zustand / Redux — лишняя зависимость для MVP
- Текущее решение: O(1) подписка, точечные обновления

**Что нельзя менять без понимания:**
- `notifyAll()` — вызывается после каждого обновления данных
- Cleanup в `useEffect` — без него memory leak

---

## БЕЗОПАСНОЕ ХРАНИЛИЩЕ: SafeStorage

### Почему не AsyncStorage напрямую

```typescript
// Проблема — это крашит Expo Go и web:
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('key', value)   // ❌ throws на web

// Решение — SafeStorage обёртка (lib/supabase.ts):
const SafeStorage = {
  getItem: async (key: string) => {
    try { return await AsyncStorage.getItem(key) }
    catch { return null }   // web/Expo Go — молча возвращаем null
  },
  setItem: async (key: string, value: string) => {
    try { await AsyncStorage.setItem(key, value) }
    catch { /* молчим */ }
  },
  removeItem: async (key: string) => {
    try { await AsyncStorage.removeItem(key) }
    catch { /* молчим */ }
  }
}
```

**Правило:** весь код использует `lib/storage.ts`. `lib/storage.ts` использует SafeStorage из `lib/supabase.ts`. Никогда — AsyncStorage напрямую.

---

## РОУТИНГ: EXPO-ROUTER V6

```
app/
├── _layout.tsx         ← Root layout (шрифты, ErrorBoundary, onboarding check)
├── onboarding.tsx      ← /onboarding
├── find.tsx            ← /find (modal)
├── add-card.tsx        ← /add-card (modal)
├── card-detail.tsx     ← /card-detail?id=xxx
└── (tabs)/
    ├── _layout.tsx     ← Tab navigator config
    ├── index.tsx       ← / (главная, рекомендации)
    ├── cards.tsx       ← /cards
    └── tips.tsx        ← /tips
```

**Как работает роутинг:**
- Каждый файл в `app/` = маршрут
- `(tabs)/` — группа без влияния на URL, создаёт tab navigator
- `_layout.tsx` — провайдеры и обёртки для своего уровня
- Модалы: `presentation: 'modal'` в Stack.Screen конфиге в `app/_layout.tsx`

**Навигация:**
```typescript
router.push('/find')                    // перейти
router.push({ pathname: '/card-detail', params: { id } })  // с параметрами
router.back()                           // назад
```

**Опасность:** создание нового файла в `app/` автоматически создаёт маршрут. Случайные файлы (тесты, утилиты) — не класть в `app/`.

---

## БИЗНЕС-ЛОГИКА: КЭШБЭК

Весь расчёт — в `lib/cashback.ts`. Три типа карт, три разных алгоритма:

```
fixed
  getCardRate(card, category) → всегда один rate из bank_rates
  Пример: Halyk Gold даёт 5% на продукты всегда

selectable
  getCardRate(card, category) → rate только если category в card.selectedCategories
  Если не выбрана → 0%
  Пример: Forte — пользователь выбирает 3 категории, остальные = 0

leveled
  getCardRate(card, category) → rate зависит от card.level + card.nfc
  Уровни: standard / silver / gold / platinum
  NFC множитель добавляется поверх уровня
  Пример: Freedom Platinum с NFC даёт максимальный кэшбэк
```

**Функции публичного API cashback.ts:**

```typescript
getCardRate(card: UserCard, category: CategoryId): number
getBestCard(cards: UserCard[], category: CategoryId): UserCard | null
getMarketBestRate(banks: Bank[], category: CategoryId): number
```

**Инвариант:** `getBestCard` никогда не возвращает карту с rate = 0, если есть карта с rate > 0.

---

## СХЕМА БАЗЫ ДАННЫХ

```
banks
├── id (text, PK)          ← 'kaspi', 'halyk', 'freedom'...
├── name (text)
├── color (text)           ← hex для UI
├── gradient (text[])      ← для карточки карты
├── cashback_type (text)   ← 'fixed' | 'selectable' | 'leveled'
├── config (jsonb)         ← selectable_count, levels[], nfc_bonus...
└── is_active (boolean)    ← false = скрыт из UI

bank_rates
├── id (uuid, PK)
├── bank_id (FK → banks.id)
├── category_id (text)     ← 'grocery' | 'restaurants' | ...
├── rate (numeric)         ← процент кэшбэка (5.0 = 5%)
├── level (text)           ← для leveled: 'standard' | 'silver'...
├── updated_at (timestamptz)
├── source_url (text)      ← URL источника ставки
├── verified_by (text)     ← 'user' | 'community' | 'bank_site' | 'ai_estimate'
└── verified_at (timestamptz)

user_cards
├── id (uuid, PK)
├── user_id (uuid)         ← auth.uid() (RLS)
├── bank_id (FK → banks.id)
├── card_name (text)
├── level (text)           ← для leveled карт
├── nfc (boolean)          ← для leveled карт
└── selected_categories (text[])  ← для selectable карт

rate_reports           ← жалобы на неточные ставки
├── id (uuid, PK)
├── bank_id, category_id, current_rate, suggested_rate
├── comment (text)
├── status (text)     ← 'new' | 'resolved' | 'rejected'
└── created_at
```

**Отношения:**
```
banks (1) ──< bank_rates (N)   [bank_id]
banks (1) ──< user_cards (N)   [bank_id]
```

**Правило видимости ставок в UI:**
```sql
WHERE banks.is_active = true
  AND bank_rates.verified_by IN ('user', 'bank_site')
  AND bank_rates.verified_at > NOW() - INTERVAL '90 days'
```

---

## МОДУЛЬНЫЕ ЗАВИСИМОСТИ

```
lib/constants.ts    ← базовый, никого не импортирует
     ↑
lib/types.ts        ← импортирует constants
     ↑
lib/supabase.ts     ← импортирует ничего из lib/
lib/storage.ts      ← импортирует supabase (SafeStorage)
lib/api.ts          ← импортирует types, supabase
lib/cashback.ts     ← импортирует types, constants
lib/useData.ts      ← импортирует api, storage, types
     ↑
app/* components    ← импортируют useData, types, cashback
```

**Ни один модуль не импортирует из `app/`.** Только app/ импортирует из lib/.

**Admin/ полностью изолирован:** `admin/src/lib/supabase.ts` — своя копия клиента, не из корня.

---

## ОБРАБОТКА ОШИБОК

**Принцип:** падаем тихо на уровне данных, шумим на уровне UI только если пользователь видит пустоту.

```
Уровень 1 — SafeStorage: catch → null (никогда не падаем)
Уровень 2 — api.ts: catch → возвращаем кэш или пустой массив
Уровень 3 — useData.ts: catch → notifyAll с пустыми данными
Уровень 4 — компоненты: show empty state или skeleton
Уровень 5 — app/_layout.tsx: ErrorBoundary (последний рубеж)
```

**Исключение:** операции записи (добавление карты) — показываем ошибку пользователю через Alert/Toast.

---

## ADMIN PANEL АРХИТЕКТУРА

Admin/ — это отдельный SPA. Не React Native, не Expo. Обычный браузерный React.

```
admin/src/
├── App.tsx              ← Router + Layout + Sidebar
├── lib/supabase.ts      ← ОТДЕЛЬНЫЙ Supabase client
├── components/
│   ├── Layout.tsx       ← Dark sidebar navigation
│   └── Toast.tsx        ← Toast notification system
└── pages/
    ├── Dashboard.tsx    ← Статистика
    ├── Banks.tsx        ← CRUD банков
    ├── Categories.tsx   ← CRUD категорий + брендов/магазинов
    ├── Rates.tsx        ← CRUD ставок + цветовая индикация свежести
    ├── Promos.tsx       ← CRUD промо-акций
    ├── Tips.tsx         ← CRUD советов
    └── Reports.tsx      ← Просмотр + модерация жалоб
```

**Почему admin отдельно:** RLS открыт для admin (INSERT/UPDATE/DELETE без ограничений). Нельзя случайно включить в мобильный bundle — это дыра безопасности.

---

## ПРОИЗВОДИТЕЛЬНОСТЬ И ОГРАНИЧЕНИЯ

| Ограничение | Причина | Решение |
|-------------|---------|---------|
| Supabase free tier: 500MB DB | Бесплатный план | 7 банков × 10 категорий = 70 строк, ок |
| Supabase: 50k requests/month | Бесплатный план | Cache-first снижает запросы |
| Expo Go не поддерживает AsyncStorage полностью | Expo Go sandbox | SafeStorage |
| Web (expo-router) — beta | Expo Web experimental | Только для тестирования |

---

## ИЗВЕСТНЫЕ ТЕХНИЧЕСКИЕ ДОЛГИ

1. **Kaspi cashback_type = 'fixed'** — неверно, у Kaspi нет фиксированных категорий. Нужно новый тип `promo_only` или скрыть логику расчёта. (см. STRATEGY.md)

2. **useData.ts** — нет инвалидации кэша по времени. Данные могут быть суточной давности.

3. **lib/bankData.ts** — статический fallback банков. Устаревает вместе с БД. Нужна автогенерация.

4. **Admin/** — нет аутентификации. Открыт на localhost:5173. Критично если деплоить.

5. **TypeScript** — `Bank.config` имеет тип `any`. Нужен дискриминированный union.
