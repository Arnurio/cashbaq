# Cashbaq

Кэшбэк-оптимизатор для банков Казахстана. Добавь карты → выбери категорию → узнай, какой картой выгоднее платить.

## Стек

- **Mobile:** Expo SDK 54 + React Native 0.81 + TypeScript
- **Routing:** expo-router v6
- **Backend:** Supabase (PostgreSQL)
- **Admin:** Vite + React 19 + TailwindCSS v4
- **Deploy:** Vercel (web) + EAS Build (mobile)

## Банки

Kaspi · Halyk · Forte · BCC · Freedom · Bereke · Jusan

## Быстрый старт

```bash
npm install
npx expo start
```

### Admin панель (только локально)

```bash
cd admin && npm install && npm run dev
```

### Тесты

```bash
npx jest
```

### EAS Build (Android APK)

```bash
eas build --platform android --profile preview
```

## Структура

```
app/          # Экраны (expo-router)
lib/          # API, типы, утилиты кэшбэка
components/   # UI компоненты
admin/        # Админ-панель (отдельное Vite-приложение)
docs/         # Исследования и документация
```

## Переменные окружения

Supabase URL и anon key захардкожены в `lib/supabase.ts` (публичные, только анон-доступ).

## Статус

MVP в разработке. Нет авторизации — карты хранятся локально.
