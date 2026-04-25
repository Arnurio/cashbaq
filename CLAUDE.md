# CLAUDE.md — Cashbaq Project Context

> Этот файл читается автоматически каждым AI-агентом (Claude Code, Google Antigravity и др.)
> при открытии проекта. Он синхронизируется между всеми участниками через git.
> НЕ удалять и НЕ переименовывать.

---

## ПРОЕКТ

**Cashbaq** — кэшбэк-оптимизатор для банков Казахстана.
Пользователь добавляет карты, выбирает категорию покупки → приложение показывает какой картой выгоднее платить.

- **Интерфейс:** русский язык
- **Рынок:** Казахстан
- **Бизнес-модель:** бесплатно, без рекламы
- **MVP статус:** нет авторизации, карты хранятся локально

---

## СТЕК

| Слой | Технология |
|------|-----------|
| Mobile | Expo SDK 54 + React Native 0.81 + TypeScript 5.9 |
| Routing | expo-router v6 (file-based) |
| Backend | Supabase (PostgreSQL + REST API) |
| Admin | Vite 8 + React 19 + TailwindCSS v4 (`admin/`) |
| Icons | lucide-react-native (mobile), lucide-react (admin) |
| Font | Manrope (5 начертаний) |
| Testing | Jest + jest-expo |
| Web deploy | Vercel |
| Mobile deploy | EAS Build |

---

## SUPABASE

```
URL:  https://cdtnvqlxsbwcdiapbdkh.supabase.co
Key:  sb_publishable_t_ZX1tPKl9q93fdiVU-LeA_rrnK4Sv5  (anon)
```

Клиент захардкожен в: `lib/supabase.ts`, `admin/src/lib/supabase.ts`, `admin/seed.js`

### Таблицы (6 шт.)
- `banks` — банки с цветами, градиентами, типом кэшбэка, конфигом
- `bank_rates` — ставки (`bank_id + category_id → rate`)
- `promos` — промо-акции
- `tips` / `tip_items` — советы
- `user_cards` — карты пользователей (RLS: только владелец)

### RLS
- `banks`, `bank_rates`, `promos`, `tips`, `tip_items` — публичный SELECT + открытый INSERT/UPDATE/DELETE для админки
- `user_cards` — доступ только владельцу (`auth.uid() = user_id`)

---

## СТРУКТУРА ФАЙЛОВ

```
app/
  _layout.tsx         # Root layout (шрифты, onboarding, ErrorBoundary)
  onboarding.tsx      # Онбординг
  find.tsx            # "Чем платить?" (модал)
  add-card.tsx        # Добавление карты (модал)
  card-detail.tsx     # Детали карты
  (tabs)/
    index.tsx         # Главная (рекомендации)
    cards.tsx         # Список карт пользователя
    tips.tsx          # Советы

lib/
  supabase.ts         # Supabase клиент + SafeStorage обёртка (try/catch для web/Expo Go)
  api.ts              # fetchBanks / fetchPromos / fetchTips + кэш
  types.ts            # TypeScript типы: Bank, UserCard, Category, Promo, Tip
  constants.ts        # 10 категорий покупок
  cashback.ts         # getCardRate / getBestCard / getMarketBestRate
  storage.ts          # AsyncStorage: карты пользователя + onboarding flag
  useData.ts          # Глобальный хук (cache-first → Supabase refresh + notify)
  bankData.ts         # Статический fallback данных банков

components/
  WowModal.tsx        # Модальное окно

admin/                # Отдельное Vite-приложение (своё package.json)
  seed.js             # Скрипт заполнения БД
  src/pages/          # Dashboard, Banks, Rates, Promos, Tips (CRUD)
```

---

## БАНКИ И ТИПЫ КЭШБЭКА

| Банк | ID | Тип |
|------|----|-----|
| Kaspi | `kaspi` | `fixed` |
| Halyk | `halyk` | `fixed` |
| Forte | `forte` | `selectable` (3 категории) |
| BCC | `bcc` | `selectable` (3 категории) |
| Freedom | `freedom` | `leveled` (standard/silver/gold/platinum + NFC) |
| Bereke | `bereke` | `fixed` / `subscription` |
| Jusan | `jusan` | `fixed` |

---

## КАТЕГОРИИ ПОКУПОК (10 шт.)

`grocery` · `restaurants` · `transport` · `clothing` · `entertainment` · `fuel` · `travel` · `pharmacy` · `online` · `telecom`

---

## ДИЗАЙН

- Brand color: `#0D7C5F`
- Background: `#F6F8FA`
- Шрифт: Manrope

---

## КОМАНДЫ ЗАПУСКА

```bash
# Mobile dev
npm install && npx expo start

# Web
npx expo start --web

# Admin panel (только локально, не деплоить)
cd admin && npm install && npm run dev

# Seed DB
node admin/seed.js

# EAS Build (APK preview)
eas build --platform android --profile preview
```

---

## ПРАВИЛА ПРОЕКТА

1. **НЕ обновлять Expo SDK** без явного разрешения
2. **Интерфейс на русском** языке
3. **Админка** — только локально, не деплоить
4. **AsyncStorage** обёрнут в SafeStorage (try/catch) — критично для web и Expo Go
5. **Данные** загружаются cache-first: AsyncStorage → Supabase refresh
6. **Нет авторизации** в MVP — карты хранятся локально
7. **Коммитить** после каждого значимого изменения
8. SQL-схема: `sql_init.txt`, RLS для админки: `rls.txt`

---

## GITHUB

```
Repo:       https://github.com/Arnurio/cashbaq.git
Branch:     main
Bundle ID:  com.cashbaq.app
EAS ID:     32cc8607-6968-472c-a1b0-208c0276db2e
Owner:      arnurio
```

---

---

# ПРАВИЛА РАБОТЫ С AI-АГЕНТОМ (для всех участников)

> Этот раздел обязателен к прочтению. Он снижает количество крашей и потерь работы.
> Актуально для Google Antigravity, Claude Code и любых других AI-агентов.

---

## ПОЧЕМУ АГЕНТ КРАШИТСЯ

| Причина | Решение |
|---------|---------|
| Слишком длинная задача → длинный ответ | Разбить на шаги по 1 файлу |
| Бесконечный процесс (dev server) | Запускать в фоне, не ждать завершения |
| Огромный файл прочитан целиком | Указывать строки: "строки 1-80" |
| Контекст потерян после краша | Явно дать контекст в начале нового чата |
| Несколько файлов правятся параллельно | Один файл за раз |
| Перегрузка серверов | Подождать 30-60 секунд, повторить |

---

## ПРАВИЛО 1 — РАЗБИВАЙ ЗАДАЧУ НА ШАГИ

**Плохо:**
```
"Добавь авторизацию, новый экран и деплой"
```

**Хорошо:**
```
Шаг 1: Добавь Supabase Auth в lib/supabase.ts
Шаг 2: Создай экран app/login.tsx
Шаг 3: Обнови app/_layout.tsx для проверки авторизации
```

Один шаг = один файл = надёжно.

---

## ПРАВИЛО 2 — КОММИТ ПОСЛЕ КАЖДОГО ШАГА

После каждого шага:
```
"Закоммить текущие изменения"
```

Это точка восстановления. Если что-то сломалось — `git reset --hard HEAD`.

---

## ПРАВИЛО 3 — НЕ ЗАПУСКАЙ БЕСКОНЕЧНЫЕ ПРОЦЕССЫ

`npm run dev`, `expo start` — не завершаются сами.

**Правильно:**
```
"Запусти dev-сервер в фоне и проверь что он стартовал"
```

Агент запустит в фоне и сразу проверит статус — без зависания.

---

## ПРАВИЛО 4 — ДАВАЙ КОНТЕКСТ В НАЧАЛЕ КАЖДОГО ЧАТА

Каждый новый чат = чистый контекст. Не пиши просто "продолжай".

**Хорошо:**
```
"Мы добавляли авторизацию в Cashbaq. Экран app/login.tsx уже создан.
Следующий шаг — подключить Supabase Auth в app/_layout.tsx"
```

---

## ПРАВИЛО 5 — НЕ ЧИТАЙ БОЛЬШИЕ ФАЙЛЫ ЦЕЛИКОМ

**Плохо:**
```
"Покажи весь файл app/(tabs)/index.tsx"
```

**Хорошо:**
```
"Покажи строки 1-60 файла app/(tabs)/index.tsx"
```

Файлы >300 строк нужно читать частями.

---

## ПРАВИЛО 6 — ОДИН ФАЙЛ ЗА РАЗ

**Плохо:**
```
"Отредактируй api.ts, types.ts и index.tsx одновременно"
```

**Хорошо:**
```
Шаг 1: Добавь тип в types.ts
Шаг 2: Используй его в api.ts
```

---

## ПРАВИЛО 7 — ПРОВЕРЯЙ ПОСЛЕ КАЖДОГО ДЕЙСТВИЯ

```
"Покажи текущее состояние файла"
"Проверь git status"
"Запусти тесты"
```

Ранняя проверка = меньше накопленных проблем.

---

## ЧТО ДЕЛАТЬ ПРИ СБОЕ

### Ответ оборвался
```
"Продолжай с [конкретного места]"
```
Если не помогает — новый чат с контекстом.

### Файл сломан после правки
```bash
git diff [файл]           # посмотри что изменилось
git checkout -- [файл]    # откати файл
git reset --hard HEAD     # откати всё к последнему коммиту
```

### Агент "забыл" проект
```
"Прочитай CLAUDE.md"
```
Этот файл восстановит весь контекст.

### Сервер агента упал (overload)
Подожди 30-60 секунд → попробуй снова с той же задачей.

---

## ЧЕКЛИСТ ПЕРЕД НАЧАЛОМ РАБОТЫ

- [ ] Последний код запушен (`git status` чистый)
- [ ] Знаешь конкретную задачу (не "сделай всё")
- [ ] Задача разбита на 3-5 шагов
- [ ] `npm install` выполнен

---

## СИНХРОНИЗАЦИЯ МЕЖДУ УЧАСТНИКАМИ

Этот файл (`CLAUDE.md`) хранится в git и даёт **одинаковый контекст** всем,
кто работает с проектом — независимо от аккаунта или устройства.

**Workflow для нескольких участников:**
```bash
# Перед началом работы — всегда забирай последнее
git pull origin main

# После своих изменений — пушь
git add .
git commit -m "описание изменений"
git push origin main
```

Если два человека работают одновременно:
- Каждый работает в своей ветке: `git checkout -b feature/имя-фичи`
- Вливается через Pull Request в `main`
- После merge — все делают `git pull`

---

## ЛАЙФХАКИ

1. **"Составь план"** — перед большой задачей агент разобьёт её на шаги
2. **"Коммить после каждого шага"** — скажи это в начале, агент будет делать автоматически
3. **"Покажи что изменилось"** — агент сделает walkthrough всех правок
4. **Не мешай вопросы и команды** — сначала спроси ("как лучше?"), потом команда ("делай вариант 2")
