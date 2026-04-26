# Rate Research — 2026-04-26

> Авто-сгенерировано research-агентом через WebFetch + WebSearch.
> Источники: kaspi.kz, halykbank.kz, forte.kz, vbr.kz, finanso.com, kursiv.media, zhivem.kz

## ⚠️ Главный вывод

**Полный per-category грид кэшбэков нельзя получить из публичного веба** — все три банка скрывают актуальные ставки внутри мобильных приложений или в JS-рендеренных SPA, недоступных WebFetch.

Реалистичный workflow: основатель раз в месяц открывает мобильное приложение каждого банка, делает скриншоты и переносит ставки в `admin/`.

---

## Kaspi Gold

- **Card name:** Kaspi Gold (debit)
- **Source:** [guide.kaspi.kz/client/ru/gold/bonus](https://guide.kaspi.kz/client/ru/gold/bonus), [kursiv.media](https://kz.kursiv.media/2025-02-11/zhzh-cashbackbanks/)
- **Monthly limit:** не публикуется. Бонус = 1 ₸ (1 Kaspi Bonus = 1 ₸)
- **Программа:** Kaspi Gold **НЕ имеет фиксированной сетки кэшбэка по категориям**. Бонусы накапливаются только во время промо от мерчантов ("акции"). Базовая ставка эффективно 0% вне промо, до 1% на платежи внутри Kaspi.kz.

| Category | Rate | Notes |
|----------|------|-------|
| grocery | promo-only (0–10%) | Зависит от промо мерчанта через Kaspi QR |
| restaurants | promo-only (0–10%) | Партнёрские промо |
| transport | promo-only | Без фиксированной ставки |
| clothing | promo-only (до 60%) | Внутри Kaspi Shop в Kaspi Juma |
| entertainment | promo-only | — |
| fuel | promo-only | Некоторые АЗС-партнёры через Kaspi QR |
| travel | promo-only (Kaspi Travel) | Внутри Kaspi Travel |
| pharmacy | promo-only | Аптеки-партнёры |
| online | до 1% базы + промо | ~1% на платежи Kaspi.kz; продавцы Kaspi Shop до 60% |
| telecom | promo-only | — |

**Confidence:** MEDIUM (модель промо подтверждена, конкретные числа задать как фикс нельзя).

**Рекомендация по моделированию:** в `bankData.ts` Kaspi сейчас типизирован как `fixed` — это вводит юзеров в заблуждение. Варианты:
- (a) Поставить все ставки 0% и в UI показывать примечание «Кэшбэк только в промо»
- (b) Каждую неделю переносить активные партнёрские промо в `promos` таблицу

---

## Halyk Bonus

- **Card name:** Halyk Bonus / Halyk Bonus Digital
- **Source:** [halykbank.kz/cards/halyk-bonus](https://halykbank.kz/cards/halyk-bonus), [halykbank.kz/promo/270](https://halykbank.kz/index.php/promo/270), [finanso.com](https://finanso.com/kz-ru/halykbank/halyk-bonus/)
- **Monthly limit:** не указано явно для базовой Halyk Bonus. Агрегатор zhivem.kz упоминает 30k–100k ₸ tier-зависимый кэп — нужна верификация.
- **Программа:** гарантированные 1% базы на все покупки + tier-партнёрские бонусы Halyk Club (до 30%). Travel-ставки идут от sister-продуктов (Halyk Travel app, My!Card).

| Category | Rate | Notes |
|----------|------|-------|
| grocery | 1% base; до 10% у партнёров | Партнёры Halyk Club ротируются ежемесячно |
| restaurants | 1% base; до 10% у партнёров | Кафе-партнёры в Halyk Club |
| transport | 1% base | Промо для автобусов было в 2024, не постоянная ставка |
| clothing | 1% base; до 30% у партнёров | Sulpak и одежда |
| entertainment | 1% base | Нет выделенной |
| fuel | 1% base | Нет выделенной |
| travel | **5%** Halyk Travel app (avia + ж/д); **3%** My!Card на airlines; **7%** Booking.com; кэп 1M ₸/мес на Halyk Travel | Travel-ставки app/partner-gated |
| pharmacy | 1% base; до 30% партнёров | Аптечные сети в Halyk Club |
| online | 1% base; 5% через виртуальную карту / app | Per finanso.com |
| telecom | 0% (без комиссии но без cashback) | — |

**Confidence:** MEDIUM для базы 1% и travel 5%; LOW для category-specific вне travel — большинство категорий идёт через ротирующиеся Halyk Club партнёры.

---

## ForteBlack

- **Card name:** ForteBlack (credit)
- **Source:** [finanso.com/kz-ru/forte/black](https://finanso.com/kz-ru/forte/black/), [finance.kz/forteblack-184](https://finance.kz/karty/fortebank/forteblack-184)
- **Monthly limit:** **30,000 ₸/мес общий**; **10,000 ₸/день**; **20,000 ₸/мес на категорию** (кроме «Бонусы на всё»)
- **Программа:** Selectable — пользователь выбирает **2 категории/мес** в приложении Forte. Выбранные дают **до 15%**. Невыбранные покупки получают базу «Бонусы на всё». Категории ротируются ежемесячно.

| Category | Rate | Notes |
|----------|------|-------|
| grocery | до 15% (если выбрана) | Supermarkets — постоянно доступная |
| restaurants | до 15% (если выбрана) | Постоянно доступная |
| transport | до 15% (если выбрана) | Такси обычно есть, верифицировать ежемесячно |
| clothing | до 15% (если выбрана) | Не каждый месяц |
| entertainment | до 15% (если выбрана) | Кино/развлечения ротируется |
| fuel | до 15% (если выбрана) | АЗС подтверждена |
| travel | до 15% (если выбрана) | Иногда |
| pharmacy | до 15% (если выбрана) | Ротируется |
| online | до 15% (если выбрана) | Marketplace/online ротируется |
| telecom | до 15% (если выбрана) | Иногда |
| _default «Бонусы на всё» | ~1% | База на невыбранные |

**Confidence:** HIGH на структуру (2 категории, 15% кэп, 30k ₸ месячный). MEDIUM-LOW на конкретные доступные категории — Forte ротирует меню, и официальная страница `forte.kz/cashback` вернула **404** (возможно, сезонный slug).

---

## Methodology notes

**Что сработало:** агрегаторы Казахстана (vbr.kz, finanso.com, finance.kz, kursiv.media, zhivem.kz). Halyk `/promo/270` подтвердил 5% Halyk Travel.

**Что не сработало:**
- `kaspi.kz/gold/` — только маркетинговый текст. У Kaspi нет category grid в принципе.
- `halykbank.kz/cards/halyk-bonus` — только FAQ, без таблицы ставок (тяжёлый SPA, данные в app).
- `forte.kz/cards/forteblack` и `forte.kz/cashback` — оба **404**. Forte перестроил URL, актуальный селектор только в app.

**JS-рендеринг блокирует все три** — продуктовые страницы или in-app каталоги, недоступные WebFetch.

---

## Recommended next steps

1. **Forte:** 1-го числа каждого месяца — открыть Forte app, скриншот списка selectable категорий, перенести в `bank_rates` через админку. Найти рабочий URL `forte.kz/cashback`.
2. **Halyk:** Верифицировать кэп Halyk Bonus base (источники конфликтуют). Возможно, моделировать Halyk Travel 5% как отдельный продукт, а не заворачивать в Halyk Bonus.
3. **Kaspi:** Пересмотреть модель данных. Kaspi Gold не fits `fixed`. Либо поставить все ставки 0% с пометкой «промо-only» в UI, либо переносить активные промо в `promos` еженедельно.
4. **Suspected gaps:** Ни один банк не публикует per-category fuel/pharmacy/transport ставки в чистой сетке на публичном вебе. Мобильные приложения — единственный источник истины. Планировать manual data entry ежемесячно, не скрапинг.
