import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';

interface TipItem {
  id: number;
  tip_id: string;
  bank_id: string | null;
  card_name: string | null;
  description: string;
  how_to: string | null;
  sort_order: number;
}

interface Tip {
  id: string;
  icon: string | null;
  color: string | null;
  title: string;
  subtitle: string | null;
  sort_order: number;
}

interface Bank {
  id: string;
  name: string;
}

export default function Tips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [items, setItems] = useState<TipItem[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [editingItem, setEditingItem] = useState<TipItem | null>(null);
  const [isNewTip, setIsNewTip] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'tip' | 'item'; id: string | number } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [t, i, b] = await Promise.all([
      supabase.from('tips').select('*').order('sort_order'),
      supabase.from('tip_items').select('*').order('sort_order'),
      supabase.from('banks').select('id, name').order('name'),
    ]);
    if (t.data) setTips(t.data);
    if (i.data) setItems(i.data);
    if (b.data) setBanks(b.data);
  }

  // ── Tip CRUD ──────────────────────────────────────

  function openNewTip() {
    const maxSort = tips.reduce((max, t) => Math.max(max, t.sort_order), 0);
    setEditingTip({
      id: '',
      icon: '💡',
      color: '#0D7C5F',
      title: '',
      subtitle: '',
      sort_order: maxSort + 1,
    });
    setIsNewTip(true);
  }

  async function saveTip() {
    if (!editingTip || !editingTip.title.trim()) return;
    setSaving(true);

    if (isNewTip) {
      const newId = editingTip.title
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 32);
      const { error } = await supabase.from('tips').insert({
        id: newId || `tip_${Date.now()}`,
        title: editingTip.title,
        icon: editingTip.icon,
        color: editingTip.color,
        subtitle: editingTip.subtitle,
        sort_order: editingTip.sort_order,
      });
      if (error) alert('Ошибка: ' + error.message);
    } else {
      const { id, ...data } = editingTip;
      await supabase.from('tips').update(data).eq('id', id);
    }

    setSaving(false);
    setEditingTip(null);
    setIsNewTip(false);
    loadAll();
  }

  async function deleteTip(tipId: string) {
    // Delete items first, then tip
    await supabase.from('tip_items').delete().eq('tip_id', tipId);
    await supabase.from('tips').delete().eq('id', tipId);
    setConfirmDelete(null);
    loadAll();
  }

  async function moveTip(tipId: string, direction: 'up' | 'down') {
    const idx = tips.findIndex((t) => t.id === tipId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tips.length) return;

    const a = tips[idx];
    const b = tips[swapIdx];
    await Promise.all([
      supabase.from('tips').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('tips').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    loadAll();
  }

  // ── TipItem CRUD ──────────────────────────────────

  function openNewItem(tipId: string) {
    const tipItems = items.filter((i) => i.tip_id === tipId);
    const maxSort = tipItems.reduce((max, i) => Math.max(max, i.sort_order), 0);
    setEditingItem({
      id: 0,
      tip_id: tipId,
      bank_id: null,
      card_name: null,
      description: '',
      how_to: null,
      sort_order: maxSort + 1,
    });
    setIsNewItem(true);
  }

  async function saveItem() {
    if (!editingItem || !editingItem.description.trim()) return;
    setSaving(true);

    if (isNewItem) {
      const { id, ...data } = editingItem;
      const { error } = await supabase.from('tip_items').insert(data);
      if (error) alert('Ошибка: ' + error.message);
    } else {
      const { id, ...data } = editingItem;
      await supabase.from('tip_items').update(data).eq('id', id);
    }

    setSaving(false);
    setEditingItem(null);
    setIsNewItem(false);
    loadAll();
  }

  async function deleteItem(itemId: number) {
    await supabase.from('tip_items').delete().eq('id', itemId);
    setConfirmDelete(null);
    loadAll();
  }

  async function moveItem(itemId: number, tipId: string, direction: 'up' | 'down') {
    const tipItems = items.filter((i) => i.tip_id === tipId).sort((a, b) => a.sort_order - b.sort_order);
    const idx = tipItems.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tipItems.length) return;

    const a = tipItems[idx];
    const b = tipItems[swapIdx];
    await Promise.all([
      supabase.from('tip_items').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('tip_items').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Советы</h1>
        <button
          onClick={openNewTip}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} />
          Добавить совет
        </button>
      </div>

      <div className="space-y-3">
        {tips.map((tip, tipIdx) => {
          const tipItems = items.filter((i) => i.tip_id === tip.id).sort((a, b) => a.sort_order - b.sort_order);
          const isOpen = expanded === tip.id;

          return (
            <div key={tip.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Tip header */}
              <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveTip(tip.id, 'up'); }}
                    disabled={tipIdx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                    title="Вверх"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveTip(tip.id, 'down'); }}
                    disabled={tipIdx === tips.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                    title="Вниз"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div onClick={() => setExpanded(isOpen ? null : tip.id)} className="flex items-center flex-1 min-w-0">
                  {isOpen ? <ChevronDown size={18} className="text-gray-400 shrink-0" /> : <ChevronRight size={18} className="text-gray-400 shrink-0" />}
                  <span className="ml-2 text-lg">{tip.icon}</span>
                  {tip.color && (
                    <span className="ml-2 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tip.color }} />
                  )}
                  <span className="ml-3 font-medium text-gray-900 truncate">{tip.title}</span>
                  <span className="ml-2 text-sm text-gray-400 shrink-0">{tipItems.length} пунктов</span>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingTip({ ...tip }); setIsNewTip(false); }}
                    className="text-brand hover:underline text-sm"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'tip', id: tip.id }); }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Удалить совет"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Tip items */}
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                  {tipItems.map((item, itemIdx) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                      <div className="flex flex-col items-center gap-0.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveItem(item.id, tip.id, 'up')}
                          disabled={itemIdx === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <GripVertical size={12} className="text-gray-300" />
                        <button
                          onClick={() => moveItem(item.id, tip.id, 'down')}
                          disabled={itemIdx === tipItems.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{item.description}</p>
                        {item.card_name && (
                          <p className="text-xs text-gray-500 mt-1">Карта: {item.card_name}</p>
                        )}
                        {item.bank_id && (
                          <p className="text-xs text-gray-500 mt-0.5">Банк: {banks.find(b => b.id === item.bank_id)?.name ?? item.bank_id}</p>
                        )}
                        {item.how_to && (
                          <p className="text-xs text-gray-500 mt-0.5">Как: {item.how_to}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingItem({ ...item }); setIsNewItem(false); }}
                          className="text-brand hover:underline text-sm"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'item', id: item.id })}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Удалить пункт"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openNewItem(tip.id)}
                    className="flex items-center gap-2 text-sm text-brand hover:underline mt-2"
                  >
                    <Plus size={14} />
                    Добавить пункт
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tips.length === 0 && (
        <p className="text-center text-gray-400 mt-12">Нет советов. Нажмите «Добавить совет» чтобы создать первый.</p>
      )}

      {/* ── Edit / Create tip modal ── */}
      {editingTip && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isNewTip ? 'Новый совет' : 'Редактировать совет'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingTip.title}
                  onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                  placeholder="Напр. Бесплатные лаунжи"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingTip.subtitle ?? ''}
                  onChange={(e) => setEditingTip({ ...editingTip, subtitle: e.target.value || null })}
                  placeholder="Краткое описание"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Иконка</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editingTip.icon ?? ''}
                    onChange={(e) => setEditingTip({ ...editingTip, icon: e.target.value || null })}
                    placeholder="💡"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                      value={editingTip.color ?? '#0D7C5F'}
                      onChange={(e) => setEditingTip({ ...editingTip, color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingTip.color ?? ''}
                      onChange={(e) => setEditingTip({ ...editingTip, color: e.target.value || null })}
                      placeholder="#0D7C5F"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
                <input
                  type="number"
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingTip.sort_order}
                  onChange={(e) => setEditingTip({ ...editingTip, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setEditingTip(null); setIsNewTip(false); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={saveTip}
                disabled={saving || !editingTip.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Сохранение...' : isNewTip ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit / Create tip item modal ── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isNewItem ? 'Новый пункт' : 'Редактировать пункт'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Описание пункта совета"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название карты</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingItem.card_name ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, card_name: e.target.value || null })}
                  placeholder="Напр. Kaspi Gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Банк</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingItem.bank_id ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, bank_id: e.target.value || null })}
                >
                  <option value="">— Не указан —</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Как сделать</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingItem.how_to ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, how_to: e.target.value || null })}
                  placeholder="Инструкция для пользователя"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
                <input
                  type="number"
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editingItem.sort_order}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setEditingItem(null); setIsNewItem(false); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={saveItem}
                disabled={saving || !editingItem.description.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Сохранение...' : isNewItem ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete dialog ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Удалить?</h2>
            <p className="text-sm text-gray-600 mb-6">
              {confirmDelete.type === 'tip'
                ? 'Совет и все его пункты будут удалены. Это действие нельзя отменить.'
                : 'Пункт будет удалён. Это действие нельзя отменить.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'tip') deleteTip(confirmDelete.id as string);
                  else deleteItem(confirmDelete.id as number);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
