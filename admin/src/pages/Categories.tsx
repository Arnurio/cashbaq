import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Store, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface Category {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  is_active: boolean;
}

interface Place {
  id: number;
  category_id: string;
  name: string;
  sort_order: number;
}

const COMMON_EMOJIS = [
  '🛒','🍽️','🚕','👗','🎬','⛽','✈️','💊','🌐','📱',
  '🏠','🏋️','💇','📚','🎮','🎵','🐾','🌿','☕','🍕',
  '🚂','⚽','🎁','💳','🏥','🛠️','🧹','📦','🏪','💡',
];

const emptyForm = { id: '', name: '', emoji: '📦', sort_order: 0, is_active: true };

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [placesMap, setPlacesMap] = useState<Map<string, Place[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Category modal
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<Category>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Places panel
  const [placesCategory, setPlacesCategory] = useState<Category | null>(null);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [addingPlace, setAddingPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<{ id: number; name: string } | null>(null);
  const newPlaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [catsRes, placesRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('category_places').select('*').order('sort_order'),
    ]);
    if (catsRes.error) toast.error('Не удалось загрузить категории');
    else setCategories(catsRes.data ?? []);

    if (placesRes.data) {
      const map = new Map<string, Place[]>();
      for (const p of placesRes.data as Place[]) {
        if (!map.has(p.category_id)) map.set(p.category_id, []);
        map.get(p.category_id)!.push(p);
      }
      setPlacesMap(map);
    }
    setLoading(false);
  }

  // ── Category CRUD ──────────────────────────────────

  function openAdd() {
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1;
    setForm({ ...emptyForm, sort_order: nextOrder });
    setModal('add');
    setShowEmojiPicker(false);
  }

  function openEdit(cat: Category) {
    setForm({ ...cat });
    setModal('edit');
    setShowEmojiPicker(false);
  }

  async function saveCategory() {
    if (!form.name.trim()) { toast.error('Введите название'); return; }
    if (!form.id.trim() && modal === 'add') { toast.error('Введите ID категории'); return; }
    setSaving(true);
    if (modal === 'add') {
      const { error } = await supabase.from('categories').insert({
        id: form.id.trim().toLowerCase().replace(/\s+/g, '_'),
        name: form.name.trim(), emoji: form.emoji,
        sort_order: form.sort_order, is_active: form.is_active,
      });
      if (error) toast.error('Ошибка: ' + error.message);
      else { toast.success('Категория добавлена'); setModal(null); await load(); }
    } else {
      const { error } = await supabase.from('categories').update({
        name: form.name.trim(), emoji: form.emoji,
        sort_order: form.sort_order, is_active: form.is_active,
      }).eq('id', form.id);
      if (error) toast.error('Ошибка: ' + error.message);
      else { toast.success('Категория обновлена'); setModal(null); await load(); }
    }
    setSaving(false);
  }

  async function removeCategory() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Ошибка удаления: ' + error.message);
    else { toast.success(`«${deleteTarget.name}» удалена`); setDeleteTarget(null); await load(); }
  }

  async function move(cat: Category, dir: 'up' | 'down') {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === cat.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('categories').update({ sort_order: other.sort_order }).eq('id', cat.id),
      supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', other.id),
    ]);
    await load();
  }

  async function toggleActive(cat: Category) {
    const { error } = await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    if (error) toast.error('Ошибка');
    else { toast.info(`${cat.name} ${cat.is_active ? 'отключена' : 'включена'}`); await load(); }
  }

  // ── Places CRUD ────────────────────────────────────

  function openPlaces(cat: Category) {
    setPlacesCategory(cat);
    setNewPlaceName('');
    setEditingPlace(null);
  }

  async function addPlace() {
    if (!placesCategory || !newPlaceName.trim()) return;
    setAddingPlace(true);
    const existing = placesMap.get(placesCategory.id) ?? [];
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(p => p.sort_order)) + 1 : 1;
    const { error } = await supabase.from('category_places').insert({
      category_id: placesCategory.id,
      name: newPlaceName.trim(),
      sort_order: nextOrder,
    });
    if (error) toast.error('Ошибка добавления');
    else { setNewPlaceName(''); await load(); newPlaceRef.current?.focus(); }
    setAddingPlace(false);
  }

  async function savePlace(place: Place, newName: string) {
    if (!newName.trim()) { setEditingPlace(null); return; }
    const { error } = await supabase.from('category_places').update({ name: newName.trim() }).eq('id', place.id);
    if (error) toast.error('Ошибка');
    else { setEditingPlace(null); await load(); }
  }

  async function removePlace(place: Place) {
    const { error } = await supabase.from('category_places').delete().eq('id', place.id);
    if (error) toast.error('Ошибка удаления');
    else await load();
  }

  async function movePlace(place: Place, dir: 'up' | 'down') {
    if (!placesCategory) return;
    const list = (placesMap.get(placesCategory.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const idx = list.findIndex(p => p.id === place.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const other = list[swapIdx];
    await Promise.all([
      supabase.from('category_places').update({ sort_order: other.sort_order }).eq('id', place.id),
      supabase.from('category_places').update({ sort_order: place.sort_order }).eq('id', other.id),
    ]);
    await load();
  }

  // ── Render ─────────────────────────────────────────

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const active = sorted.filter(c => c.is_active);
  const inactive = sorted.filter(c => !c.is_active);
  const currentPlaces = placesCategory
    ? (placesMap.get(placesCategory.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-gray-500 text-sm mt-1">{active.length} активных · {inactive.length} скрытых</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors shadow-sm"
        >
          <Plus size={16} />
          Добавить категорию
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            {active.map((cat, i) => (
              <CategoryCard
                key={cat.id} cat={cat}
                placesCount={placesMap.get(cat.id)?.length ?? 0}
                isFirst={i === 0} isLast={i === active.length - 1}
                onEdit={() => openEdit(cat)}
                onDelete={() => setDeleteTarget(cat)}
                onMoveUp={() => move(cat, 'up')}
                onMoveDown={() => move(cat, 'down')}
                onToggle={() => toggleActive(cat)}
                onPlaces={() => openPlaces(cat)}
              />
            ))}
          </div>

          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Скрытые</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {inactive.map(cat => (
                  <CategoryCard
                    key={cat.id} cat={cat}
                    placesCount={placesMap.get(cat.id)?.length ?? 0}
                    isFirst={false} isLast={false} dimmed
                    onEdit={() => openEdit(cat)}
                    onDelete={() => setDeleteTarget(cat)}
                    onMoveUp={() => move(cat, 'up')}
                    onMoveDown={() => move(cat, 'down')}
                    onToggle={() => toggleActive(cat)}
                    onPlaces={() => openPlaces(cat)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Places panel ───────────────────────────── */}
      {placesCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-40">
          <div className="bg-white h-full w-full max-w-sm flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{placesCategory.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{placesCategory.name}</p>
                  <p className="text-xs text-gray-400">{currentPlaces.length} магазинов</p>
                </div>
              </div>
              <button onClick={() => setPlacesCategory(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Places list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1.5">
              {currentPlaces.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Store size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Нет магазинов</p>
                  <p className="text-xs mt-1">Добавьте первый бренд ниже</p>
                </div>
              )}
              {currentPlaces.map((place, i) => (
                <div
                  key={place.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 group hover:border-gray-200"
                >
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => movePlace(place, 'up')}
                      disabled={i === 0}
                      className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ArrowUp size={10} />
                    </button>
                    <button
                      onClick={() => movePlace(place, 'down')}
                      disabled={i === currentPlaces.length - 1}
                      className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ArrowDown size={10} />
                    </button>
                  </div>

                  {/* Name — inline edit */}
                  {editingPlace?.id === place.id ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm bg-white border border-brand rounded px-2 py-1 focus:outline-none"
                      value={editingPlace.name}
                      onChange={e => setEditingPlace({ ...editingPlace, name: e.target.value })}
                      onBlur={() => savePlace(place, editingPlace.name)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') savePlace(place, editingPlace.name);
                        if (e.key === 'Escape') setEditingPlace(null);
                      }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm text-gray-800 cursor-text"
                      onDoubleClick={() => setEditingPlace({ id: place.id, name: place.name })}
                      title="Двойной клик — редактировать"
                    >
                      {place.name}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingPlace({ id: place.id, name: place.name })}
                      className="p-1 rounded text-gray-400 hover:text-brand hover:bg-brand-lighter transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => removePlace(place)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new place */}
            <div className="px-5 pb-5 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Добавить бренд / магазин</p>
              <div className="flex gap-2">
                <input
                  ref={newPlaceRef}
                  type="text"
                  value={newPlaceName}
                  onChange={e => setNewPlaceName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addPlace(); }}
                  placeholder="Название бренда..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <button
                  onClick={addPlace}
                  disabled={!newPlaceName.trim() || addingPlace}
                  className="px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {addingPlace ? '...' : <><Plus size={14} />Добавить</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit category modal ───────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'add' ? 'Новая категория' : 'Редактировать категорию'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Иконка</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-14 h-14 bg-gray-50 border-2 border-gray-200 rounded-xl text-3xl flex items-center justify-center hover:border-brand transition-colors"
                  >
                    {form.emoji}
                  </button>
                  <p className="text-xs text-gray-500">Нажмите чтобы выбрать</p>
                </div>
                {showEmojiPicker && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-10 gap-1">
                    {COMMON_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => { setForm(f => ({ ...f, emoji: e })); setShowEmojiPicker(false); }}
                        className={`text-xl p-1 rounded-lg hover:bg-white transition-colors ${form.emoji === e ? 'bg-white ring-2 ring-brand' : ''}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Продукты"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* ID */}
              {modal === 'add' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ID <span className="text-gray-400 font-normal">(латиница, без пробелов)</span>
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    placeholder="grocery"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <p className="text-xs text-gray-400 mt-1">Нельзя изменить после создания.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-500">{form.id}</div>
                </div>
              )}

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Порядок</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  min={1}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Active */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Активна</p>
                  <p className="text-xs text-gray-400">Показывается в приложении</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                  {form.is_active
                    ? <ToggleRight size={32} className="text-brand" />
                    : <ToggleLeft size={32} className="text-gray-300" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Отмена
              </button>
              <button
                onClick={saveCategory}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : modal === 'add' ? 'Добавить' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-4xl text-center mb-4">{deleteTarget.emoji}</div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Удалить «{deleteTarget.name}»?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Все ставки и магазины этой категории тоже удалятся. Нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                Отмена
              </button>
              <button onClick={removeCategory} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  cat, placesCount, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown, onToggle, onPlaces, dimmed,
}: {
  cat: Category;
  placesCount: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onPlaces: () => void;
  dimmed?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 group hover:shadow-md transition-all ${dimmed ? 'opacity-50' : ''}`}>
      {/* Top row: emoji + sort arrows */}
      <div className="flex items-start justify-between">
        <div className="text-3xl">{cat.emoji}</div>
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onMoveUp} disabled={isFirst}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed">
            <ArrowUp size={12} />
          </button>
          <button onClick={onMoveDown} disabled={isLast}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed">
            <ArrowDown size={12} />
          </button>
        </div>
      </div>

      {/* Name + ID */}
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{cat.name}</p>
        <p className="text-xs font-mono text-gray-400 mt-0.5">{cat.id}</p>
      </div>

      {/* Places badge */}
      <button
        onClick={onPlaces}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand transition-colors self-start"
      >
        <Store size={12} />
        <span>{placesCount > 0 ? `${placesCount} магазинов` : 'Добавить магазины'}</span>
      </button>

      {/* Actions row */}
      <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
        <button onClick={onToggle} title={cat.is_active ? 'Скрыть' : 'Показать'}
          className="flex-1 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
          {cat.is_active
            ? <ToggleRight size={14} className="mx-auto text-brand" />
            : <ToggleLeft size={14} className="mx-auto" />}
        </button>
        <button onClick={onEdit}
          className="flex-1 py-1 text-xs text-gray-500 hover:text-brand hover:bg-brand-lighter rounded-lg transition-colors flex items-center justify-center">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete}
          className="flex-1 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
