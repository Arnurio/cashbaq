# DESIGN_SYSTEM.md — Дизайн-система Cashbaq

> Читай этот файл перед тем, как добавлять новые экраны или компоненты.
> Здесь всё про цвета, шрифты, отступы и паттерны UI.

---

## ПРИНЦИПЫ ДИЗАЙНА

1. **Простота над функциональностью** — пользователь должен получить ответ за 2 тапа
2. **Доверие через прозрачность** — показывать дату обновления и источник ставки
3. **Тихий интерфейс** — нет лишних анимаций, нет избыточного текста
4. **Казахстанский рынок** — только русский язык в UI

---

## ЦВЕТА

### Мобильное приложение

```typescript
// Основные
const BRAND_GREEN = '#0D7C5F'     // Бренд, акценты, кнопки
const BACKGROUND = '#F6F8FA'      // Фон всех экранов
const WHITE = '#FFFFFF'           // Карточки, поверхности
const BLACK = '#000000'           // Редко, тени

// Текст
const TEXT_PRIMARY = '#1A1A1A'    // Основной текст
const TEXT_SECONDARY = '#6B7280'  // Вторичный, подписи
const TEXT_MUTED = '#9CA3AF'      // Плейсхолдеры, disabled

// Состояния
const SUCCESS = '#10B981'         // Успех, лучшая карта
const WARNING = '#F59E0B'         // Предупреждение
const ERROR = '#EF4444'           // Ошибка
const INFO = '#3B82F6'            // Информация

// Разделители
const BORDER = '#E5E7EB'          // Линии между элементами
const SHADOW = 'rgba(0,0,0,0.08)' // Тень карточек
```

### Admin Panel (темная тема)

```css
/* Фоны */
--bg-sidebar:     #111827;   /* Sidebar */
--bg-main:        #1F2937;   /* Основной фон */
--bg-card:        #374151;   /* Карточки, таблицы */
--bg-input:       #4B5563;   /* Инпуты */

/* Текст */
--text-primary:   #F9FAFB;
--text-secondary: #9CA3AF;

/* Акцент */
--accent:         #10B981;   /* Кнопки, ссылки (зелёный) */
--accent-hover:   #059669;

/* Индикаторы свежести ставок */
--fresh:    #10B981;   /* Обновлено < 30 дней */
--stale:    #F59E0B;   /* Обновлено 30-90 дней */
--outdated: #EF4444;   /* Обновлено > 90 дней */
```

---

## ТИПОГРАФИКА

### Шрифт: Manrope

Подключён в `app/_layout.tsx` через `expo-font`:

```typescript
const [fontsLoaded] = useFonts({
  'Manrope-Regular':    require('../assets/fonts/Manrope-Regular.ttf'),
  'Manrope-Medium':     require('../assets/fonts/Manrope-Medium.ttf'),
  'Manrope-SemiBold':   require('../assets/fonts/Manrope-SemiBold.ttf'),
  'Manrope-Bold':       require('../assets/fonts/Manrope-Bold.ttf'),
  'Manrope-ExtraBold':  require('../assets/fonts/Manrope-ExtraBold.ttf'),
})
```

### Шкала размеров

| Назначение | Размер | Вес | Семейство |
|-----------|--------|-----|-----------|
| Заголовок экрана | 28px | ExtraBold | Manrope |
| Заголовок секции | 20px | Bold | Manrope |
| Карточка (основной) | 17px | SemiBold | Manrope |
| Тело текста | 15px | Regular | Manrope |
| Подпись, метки | 13px | Medium | Manrope |
| Мелкий вспомогательный | 11px | Regular | Manrope |

### Правила

- **Заголовки страниц** — всегда ExtraBold, 28px, цвет #1A1A1A
- **Кэшбэк-процент** — Bold или ExtraBold, крупнее основного текста, цвет BRAND_GREEN
- **Суммы и числа** — SemiBold, моноширинный стиль через fontVariant: ['tabular-nums']
- **Русский язык** — только, без транслитерации

---

## ОТСТУПЫ И СЕТКА

```typescript
// Базовый юнит
const UNIT = 4

// Стандартные отступы
const SPACING = {
  xs:  4,    // внутри компонента
  sm:  8,    // между тесно связанными элементами
  md:  16,   // стандартный padding экрана
  lg:  24,   // между секциями
  xl:  32,   // крупные блоки
  xxl: 48,   // заголовок и первая секция
}

// Горизонтальный padding экрана
const SCREEN_PADDING = 16   // использовать везде одинаково
```

---

## КАРТОЧКИ И ПОВЕРХНОСТИ

### Карточка банка / карточка пользователя

```typescript
const cardStyle = {
  borderRadius: 16,
  padding: 16,
  // Градиент из bank.gradient[]
  // Тень:
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,     // Android
}
```

### Информационная карточка (белая)

```typescript
const infoCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}
```

---

## КНОПКИ

### Primary (основное действие)

```typescript
{
  backgroundColor: '#0D7C5F',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  // Текст: белый, SemiBold, 16px
}
```

### Secondary (вторичное действие)

```typescript
{
  backgroundColor: 'transparent',
  borderWidth: 1.5,
  borderColor: '#0D7C5F',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  // Текст: BRAND_GREEN, SemiBold, 16px
}
```

### Destructive (удалить)

```typescript
{
  backgroundColor: '#FEE2E2',
  borderRadius: 12,
  // Текст: #EF4444, SemiBold
}
```

---

## ИКОНКИ

### Мобилка: lucide-react-native

```typescript
import { CreditCard, ChevronRight, Star } from 'lucide-react-native'

// Стандартные размеры
const ICON_SM = 16    // inline в тексте
const ICON_MD = 20    // рядом с текстом
const ICON_LG = 24    // самостоятельные иконки
const ICON_XL = 32    // акцентные, hero-иконки

// Цвет: всегда явно передавать
<CreditCard size={ICON_MD} color={TEXT_SECONDARY} />
```

### Admin: lucide-react

```tsx
import { CreditCard } from 'lucide-react'
// Размер через className: 'w-4 h-4', 'w-5 h-5', 'w-6 h-6'
```

**Критично:** не перепутать пакеты. `lucide-react` в мобилке = краш на Android.

---

## МОДАЛЬНЫЕ ОКНА

Два типа модалов:

### Stack Modal (системный, через expo-router)

```typescript
// app/_layout.tsx
<Stack.Screen name="find" options={{ presentation: 'modal' }} />
// Открывается снизу, системная анимация
```

### WowModal (кастомный, components/WowModal.tsx)

Используется для результатов поиска, подтверждений. Backdrop с blur, белая карточка снизу.

```typescript
import WowModal from '../components/WowModal'
// Props: visible, onClose, title, children
```

---

## ЭКРАНЫ — СТРУКТУРА

Каждый экран следует одному паттерну:

```typescript
export default function ScreenName() {
  // 1. Данные (хуки вверху)
  const { banks, cards } = useData()
  const [localState, setLocalState] = useState(...)

  // 2. Обработчики
  const handleAction = useCallback(() => { ... }, [deps])

  // 3. Early returns (loading, empty state)
  if (!banks.length) return <LoadingView />

  // 4. Рендер
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* контент */}
      </ScrollView>
    </SafeAreaView>
  )
}

// 5. Стили внизу файла
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  content:   { padding: SCREEN_PADDING },
})
```

---

## СОСТОЯНИЯ КОМПОНЕНТОВ

Каждый список / загружаемый контент должен иметь три состояния:

| Состояние | Что показывать |
|-----------|---------------|
| Loading | Skeleton или ActivityIndicator (цвет BRAND_GREEN) |
| Empty | Иллюстрация + объясняющий текст + CTA |
| Error | Текст ошибки + кнопка "Попробовать снова" |
| Success | Основной контент |

---

## ГРАДИЕНТЫ БАНКОВ

Каждый банк имеет массив `gradient` в `banks.config` для отображения карточки:

```
Kaspi:    ['#E8001E', '#C0001A']   ← красный
Halyk:    ['#008000', '#005A00']   ← зелёный
Freedom:  ['#1A1A2E', '#16213E']   ← тёмно-синий
Forte:    ['#FF6B00', '#E55A00']   ← оранжевый
BCC:      ['#1E3A8A', '#1E40AF']   ← синий
Bereke:   ['#7C3AED', '#6D28D9']   ← фиолетовый
Jusan:    ['#0EA5E9', '#0284C7']   ← голубой
```

---

## TOAST / УВЕДОМЛЕНИЯ

### Мобилка

Используй `Alert.alert()` для важных ошибок. Для тихих уведомлений — нет библиотеки, реализовать через абсолютно позиционированный View с анимацией.

### Admin

`components/Toast.tsx` — кастомный toast. Типы: `success` / `error` / `warning` / `info`.

```typescript
import { useToast } from '../components/Toast'
const { showToast } = useToast()
showToast('Ставка сохранена', 'success')
```

---

## ADMIN PANEL: UI ПАТТЕРНЫ

### Таблица с данными

Стандартная структура страницы admin:
1. Header: заголовок + кнопка "Добавить"
2. Фильтры/поиск (если нужно)
3. Таблица с hover-highlight
4. Строка: данные + кнопки Edit/Delete в последней колонке
5. Модал добавления/редактирования

### Индикатор свежести ставок

```tsx
// Цвет зависит от даты обновления
const freshness = (updatedAt: string) => {
  const days = daysSince(updatedAt)
  if (days < 30)  return { color: 'text-green-400', label: `${days}д` }
  if (days < 90)  return { color: 'text-yellow-400', label: `${days}д` }
  return           { color: 'text-red-400', label: `${days}д` }
}
```

---

## ЧТО НЕ ДЕЛАТЬ

- ❌ Не использовать системные шрифты (San Francisco, Roboto) — только Manrope
- ❌ Не добавлять анимации без необходимости — лишняя сложность
- ❌ Не менять BRAND_GREEN без обсуждения — это цвет бренда
- ❌ Не использовать inline стили (`style={{ color: 'red' }}`) — только StyleSheet.create
- ❌ Не добавлять splash screens / лоадеры дольше 2 секунд — пользователи уходят
- ❌ Не переключать на английский в UI — только русский
