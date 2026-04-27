import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { Bell, Send } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import Button from '../components/Button';

interface Bank {
  id: string;
  name: string;
}

export default function Notifications() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankId, setBankId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('banks').select('id, name').order('name').then(({ data }) => {
      if (data) {
        setBanks(data);
        if (data.length) setBankId(data[0].id);
      }
    });
  }, []);

  // Refresh audience count whenever bank changes
  useEffect(() => {
    if (!bankId) return;
    supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .contains('bank_ids', [bankId])
      .eq('enabled', true)
      .then(({ count }) => setAudienceCount(count ?? 0));
  }, [bankId]);

  const handleSend = async () => {
    setError(null);
    setResult(null);
    if (!bankId || !title.trim() || !body.trim()) {
      setError('Выбери банк и заполни заголовок и текст');
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Сессия истекла — войди снова');
        setSending(false);
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bank_id: bankId,
          title: title.trim(),
          body: body.trim(),
          data: { bank_id: bankId },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Не удалось отправить');
      } else {
        setResult(`Отправлено на ${json.sent} устройств (всего подписано: ${json.total ?? json.sent})`);
        setTitle('');
        setBody('');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Уведомления"
        icon={Bell}
        subtitle="Отправь push всем пользователям, у которых добавлена карта выбранного банка."
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Банк</label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {audienceCount !== null && (
            <p className="text-xs text-gray-500 mt-1.5">
              Аудитория: <strong>{audienceCount}</strong> устройств
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок</label>
          <input
            type="text"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Новая ставка 5%"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/60</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Текст</label>
          <textarea
            maxLength={200}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Kaspi обновил кэшбэк на продукты — теперь 5%"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}/200</p>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {result && <Alert tone="success">{result}</Alert>}

        <Button onClick={handleSend} disabled={audienceCount === 0} loading={sending}>
          <Send size={16} />
          {sending ? 'Отправка...' : 'Отправить уведомление'}
        </Button>

        {audienceCount === 0 && (
          <p className="text-xs text-amber-600">
            Нет подписчиков с этой картой — пока некому отправлять.
          </p>
        )}
      </div>
    </div>
  );
}
