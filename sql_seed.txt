-- ============================================
-- Cashbaq: seed data
-- ============================================

-- Banks
INSERT INTO banks (id, name, card_name, color, gradient_start, gradient_end, bg_color, type, description, note, url, has_lounge, has_insurance, monthly_limit, daily_limit, config) VALUES
  ('kaspi', 'Kaspi', 'Kaspi Gold', '#E53935', '#E53935', '#C62828', '#FFEBEE', 'fixed', 'Фиксированный кэшбэк 1% на основные категории', 'Самая популярная карта в КЗ', 'https://kaspi.kz', false, false, 30000, NULL, '{}'),
  ('halyk', 'Halyk', 'Halyk Bonus', '#1B5E20', '#2E7D32', '#1B5E20', '#E8F5E9', 'fixed', 'Фиксированный кэшбэк, travel до 7%', 'Лучшая карта для путешествий', 'https://halykbank.kz', false, false, 50000, NULL, '{}'),
  ('forte', 'Forte', 'ForteBlack', '#212121', '#424242', '#212121', '#F5F5F5', 'selectable', 'Выбери 3 категории с кэшбэком до 15%', 'Максимальный кэшбэк при правильном выборе', 'https://forte.kz', true, true, 30000, 10000, '{"maxCategories": 3}'),
  ('bcc', 'BCC', '#картакарта', '#1565C0', '#1976D2', '#1565C0', '#E3F2FD', 'selectable', 'Выбери 3 категории с кэшбэком до 10%', 'Хороший вариант для тех кто хочет выбирать категории', 'https://bcc.kz', false, false, 20000, NULL, '{"maxCategories": 3}'),
  ('freedom', 'Freedom', 'Freedom Card', '#6A1B9A', '#7B1FA2', '#6A1B9A', '#F3E5F5', 'leveled', 'От 1% до 4% + бонус NFC до +2%', '4 уровня: чем больше тратишь, тем больше кэшбэк', 'https://freedomfinance.kz', true, true, 50000, NULL, '{"levels": {"standard": {"base": 1, "nfc": 0.5}, "silver": {"base": 2, "nfc": 1}, "gold": {"base": 3, "nfc": 1.5}, "platinum": {"base": 4, "nfc": 2}}}'),
  ('bereke', 'Bereke', 'Bereke Card', '#00695C', '#00796B', '#00695C', '#E0F2F1', 'subscription', 'Кэшбэк зависит от суммы депозита: 0–7%', 'Чем больше депозит, тем выше кэшбэк', 'https://berekebank.kz', false, false, 30000, NULL, '{"tiers": {"zero": 0, "basic": 1, "medium": 3, "high": 5, "max": 7}}'),
  ('jusan', 'Jusan', 'Jusan Card', '#F57F17', '#F9A825', '#F57F17', '#FFF8E1', 'fixed', 'Продукты 3%, аптеки 3%, АЗС 2%, остальное 1%', 'Хороший кэшбэк на продукты и аптеки', 'https://jusan.kz', false, false, 30000, NULL, '{}');

-- Bank rates
INSERT INTO bank_rates (bank_id, category_id, rate) VALUES
  -- Kaspi
  ('kaspi', 'grocery', 1),
  ('kaspi', 'restaurants', 1),
  ('kaspi', 'fuel', 1),
  -- Halyk
  ('halyk', 'grocery', 1),
  ('halyk', 'restaurants', 1),
  ('halyk', 'transport', 1),
  ('halyk', 'clothing', 1),
  ('halyk', 'entertainment', 1),
  ('halyk', 'fuel', 1),
  ('halyk', 'travel', 7),
  ('halyk', 'pharmacy', 1),
  ('halyk', 'online', 1),
  ('halyk', 'telecom', 1),
  -- Forte (selectable: _selected / _default meta-rates)
  ('forte', '_selected', 15),
  ('forte', '_default', 1),
  -- BCC (selectable)
  ('bcc', '_selected', 10),
  ('bcc', '_default', 1),
  -- Jusan
  ('jusan', 'grocery', 3),
  ('jusan', 'pharmacy', 3),
  ('jusan', 'fuel', 2),
  ('jusan', 'restaurants', 1),
  ('jusan', 'transport', 1),
  ('jusan', 'clothing', 1),
  ('jusan', 'entertainment', 1),
  ('jusan', 'travel', 1),
  ('jusan', 'online', 1),
  ('jusan', 'telecom', 1);

-- Promos
INSERT INTO promos (bank_id, title, description, category_id, rate, emoji, end_date, is_new, is_active) VALUES
  ('forte', 'Forte × Starbucks', '10% кэшбэк в Starbucks', 'restaurants', 10, '☕', '2026-04-30', true, true),
  ('halyk', 'Halyk × Sinooil', '4% кэшбэк на АЗС Sinooil', 'fuel', 4, '⛽', '2026-05-15', false, true),
  ('freedom', 'Freedom × Arbuz', '26% кэшбэк в Arbuz', 'grocery', 26, '🍉', '2026-05-31', true, true),
  ('bcc', 'BCC × Kino.kz', '5% кэшбэк на Kino.kz', 'entertainment', 5, '🎬', '2026-04-30', false, true);

-- Tips
INSERT INTO tips (id, icon, color, title, subtitle, sort_order) VALUES
  ('lounge', '✈️', NULL, 'Бесплатные лаунжи', NULL, 1),
  ('insurance', '🛡', NULL, 'Страховка путешественников', NULL, 2),
  ('bonus-vs-cash', '💡', NULL, 'Бонусы vs деньги', NULL, 3),
  ('cash-withdrawal', '🏧', NULL, 'Снятие наличных', NULL, 4),
  ('nfc', '📱', NULL, 'NFC-бонус', NULL, 5);

-- Tip items
INSERT INTO tip_items (tip_id, bank_id, card_name, description, how_to, sort_order) VALUES
  -- lounge
  ('lounge', 'forte', 'ForteBlack', 'ForteBlack — бесплатный доступ в лаунжи аэропортов', NULL, 1),
  ('lounge', 'freedom', 'Freedom Platinum', 'Freedom Platinum — лаунжи по Priority Pass', NULL, 2),
  ('lounge', NULL, NULL, 'Проверь условия: количество визитов может быть ограничено', NULL, 3),
  -- insurance
  ('insurance', 'forte', 'ForteBlack', 'ForteBlack включает страховку при выезде за рубеж', NULL, 1),
  ('insurance', 'freedom', 'Freedom Gold/Platinum', 'Freedom Gold/Platinum — страховка для путешествий', NULL, 2),
  ('insurance', NULL, NULL, 'Покрытие до $50 000 в зависимости от банка', NULL, 3),
  -- bonus-vs-cash
  ('bonus-vs-cash', NULL, 'Kaspi, Halyk', 'Kaspi, Halyk — кэшбэк начисляется бонусами', NULL, 1),
  ('bonus-vs-cash', NULL, 'Forte, Freedom', 'Forte, Freedom — реальные деньги на счёт', NULL, 2),
  ('bonus-vs-cash', NULL, NULL, 'Бонусы могут сгореть, деньги — нет', NULL, 3),
  -- cash-withdrawal
  ('cash-withdrawal', 'kaspi', 'Kaspi Gold', 'Kaspi Gold — бесплатно в своих банкоматах', NULL, 1),
  ('cash-withdrawal', 'freedom', 'Freedom Card', 'Freedom — бесплатно до 500 000 ₸/мес', NULL, 2),
  ('cash-withdrawal', 'forte', 'ForteBlack', 'ForteBlack — без комиссии до 1 000 000 ₸/мес', NULL, 3),
  -- nfc
  ('nfc', 'freedom', 'Freedom Card', 'Freedom даёт +0.5–2% при оплате через NFC', NULL, 1),
  ('nfc', NULL, NULL, 'Добавь карту в Apple/Google Pay', NULL, 2),
  ('nfc', NULL, NULL, 'Бонус зависит от уровня: Standard +0.5%, Platinum +2%', NULL, 3);
