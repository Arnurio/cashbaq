import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface Category {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  is_active: boolean;
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
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<Category>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error) { toast.error('Не удалось загрузить категории'); }
    else setCategories(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order)) + 1
      : 1;
    setForm({ ...emptyForm, sort_order: nextOrder });
    setModal('add');
    setShowEmojiPicker(false);
  }

  function openEdit(cat: Category) {
    setForm({ ...cat });
    setModal('edit');
    setShowEmojiPicker(false);
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Введите название'); return; }
    if (!form.id.trim() && modal === 'add') { toast.error('Введите ID категории'); return; }

    setSaving(true);
    if (modal === 'add') {
      const { error } = await supabase.from('categories').insert({
        id: form.id.trim().toLowerCase().replace(/\s+/g, '_'),
        name: form.name.trim(),
        emoji: form.emoji,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });
      if (error) { toast.error('Ошибка: ' + error.message); }
      else { toast.success('Категория добавлена'); setModal(null); await load(); }
    } else {
      const { error } = await supabase.from('categories').update({
        name: form.name.trim(),
        emoji: form.emoji,
        sort_order: form.sort_order,
        is_active: form.is_active,
      }).eq('id', form.id);
      if (error) { toast.error('Ошибка: ' + error.message); }
      else { toast.success('Категория обновлена'); setModal(null); await load(); }
    }
    setSaving(false);
  }

  async function remove() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Ошибка удаления: ' + error.message); }
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
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id);
    if (error) toast.error('Ошибка');
    else {
      toast.info(`${cat.name} ${cat.is_active ? 'отключена' : 'включена'}`);
      await load();
    }
  }

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const active = sorted.filter(c => c.is_active);
  const inactive = sorted.filter(c => !c.is_active);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-gray-500 text-sm mt-1">
            {active.length} активных · {inactive.length} скрытых
          </p>
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
          {/* Active categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            {active.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                isFirst={i === 0}
                isLast={i === active.length - 1}
                onEdit={() => openEdit(cat)}
                onDelete={() => setDeleteTarget(cat)}
                onMoveUp={() => move(cat, 'up')}
                onMoveDown={() => move(cat, 'down')}
                onToggle={() => toggleActive(cat)}
              />
            ))}
          </div>

          {/* Inactive */}
          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Скрытые</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {inactive.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    isFirst={false}
                    isLast={false}
                    onEdit={() => openEdit(cat)}
                    onDelete={() => setDeleteTarget(cat)}
                    onMoveUp={() => move(cat, 'up')}
                    onMoveDown={() => move(cat, 'down')}
                    onToggle={() => toggleActive(cat)}
                    dimmed
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'add' ? 'Новая категория' : 'Редактировать категорию'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Иконка</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-14 h-14 bg-gray-50 border-2 border-gray-200 rounded-xl text-3xl flex items-center justify-center hover:border-brand transition-colors"
                  >
                    {form.emoji}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Нажмите чтобы выбрать</p>
                  </div>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              {/* ID — only for new */}
              {modal === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ID <span className="text-gray-400 font-normal">(латиница, без пробелов)</span>
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    placeholder="grocery"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Используется как ключ в базе данных. Нельзя изменить после создания.</p>
                </div>
              )}

              {modal === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-500">
                    {form.id}
                  </div>
                </div>
              )}

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Порядок сортировки</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  min={1}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Активна</p>
                  <p className="text-xs text-gray-400">Показывается в приложении</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="transition-colors"
                >
                  {form.is_active
                    ? <ToggleRight size={32} className="text-brand" />
                    : <ToggleLeft size={32} className="text-gray-300" />
                  }
                </button>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : modal === 'add' ? 'Добавить' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-4xl text-center mb-4">{deleteTarget.emoji}</div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Удалить «{deleteTarget.name}»?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Все ставки банков для этой категории тоже будут удалены. Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={remove}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
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

function CategoryCard({
  cat, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown, onToggle, dimmed,
}: {
  cat: Category;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  dimmed?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 group hover:shadow-md transition-all ${dimmed ? 'opacity-50' : ''}`}>
      {/* Top: emoji + order buttons */}
      <div className="flex items-start justify-between">
        <div className="text-3xl">{cat.emoji}</div>
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown size={12} />
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{cat.name}</p>
        <p className="text-xs font-mono text-gray-400 mt-0.5">{cat.id}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
        <button
          onClick={onToggle}
          title={cat.is_active ? 'Скрыть' : 'Показать'}
          className="flex-1 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {cat.is_active ? <ToggleRight size={14} className="mx-auto text-brand" /> : <ToggleLeft size={14} className="mx-auto" />}
        </button>
        <button
          onClick={onEdit}
          className="flex-1 py-1 text-xs text-gray-500 hover:text-brand hover:bg-brand-lighter rounded-lg transition-colors flex items-center justify-center"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
