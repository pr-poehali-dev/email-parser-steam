import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

const ADMIN_URL = 'https://functions.poehali.dev/69106f77-8457-4dd2-8faf-1de96127c573';
const ADMIN_KEY = 'steam_admin_password';

interface AccessCode {
  id: number;
  code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newLabel, setNewLabel] = useState('');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const savedPwd = () => sessionStorage.getItem(ADMIN_KEY) || '';

  const apiFetch = useCallback(async (method: string, body?: object, pwd?: string) => {
    const p = pwd ?? savedPwd();
    const res = await fetch(ADMIN_URL, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': p },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  }, []);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('GET');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка загрузки'); return; }
      setCodes(data.codes);
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const handleLogin = async () => {
    const pwd = password.trim();
    if (!pwd) { setAuthError('Введите пароль'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await apiFetch('GET', undefined, pwd);
      if (res.status === 401) { setAuthError('Неверный пароль'); return; }
      const data = await res.json();
      sessionStorage.setItem(ADMIN_KEY, pwd);
      setAuthed(true);
      setCodes(data.codes);
    } catch {
      setAuthError('Ошибка соединения');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const pwd = savedPwd();
    if (pwd) {
      apiFetch('GET', undefined, pwd).then(async res => {
        if (res.ok) { const d = await res.json(); setCodes(d.codes); setAuthed(true); }
      });
    }
  }, [apiFetch]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('POST', { action: 'create', label: newLabel, code: newCode });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setNewLabel(''); setNewCode('');
      await loadCodes();
    } catch {
      setError('Ошибка создания');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await apiFetch('POST', { action: 'toggle', id });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    } catch {
      setError('Ошибка обновления');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот код?')) return;
    try {
      await apiFetch('POST', { action: 'delete', id });
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Ошибка удаления');
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#4ade80 1px,transparent 1px),linear-gradient(90deg,#4ade80 1px,transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

        <div className="relative z-10 w-full max-w-[340px]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-[#1c1c1c] bg-[#101010] mb-5">
              <Icon name="ShieldCheck" size={20} className="text-[#4ade80]" />
            </div>
            <h1 className="text-[22px] font-light text-white tracking-tight mb-1">Панель администратора</h1>
            <p className="text-[#4a4a4a] text-sm">Управление кодами доступа</p>
          </div>

          <div className="rounded-xl border border-[#1c1c1c] bg-[#101010] overflow-hidden">
            <div className="flex items-center border-b border-[#1c1c1c]">
              <span className="pl-4 pr-2"><Icon name="Lock" size={14} className="text-[#333]" /></span>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Пароль администратора"
                className="flex-1 bg-transparent py-4 pr-4 text-white font-mono text-sm outline-none placeholder:text-[#2a2a2a]"
                autoFocus
              />
            </div>
            <div className="p-3">
              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full py-3 rounded-lg bg-[#4ade80] text-[#0c0c0c] font-semibold font-mono text-sm tracking-wide hover:bg-[#22c55e] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {authLoading
                  ? <span className="w-4 h-4 border-2 border-[#0c0c0c]/30 border-t-[#0c0c0c] rounded-full animate-spin" />
                  : <><Icon name="Unlock" size={14} />Войти</>}
              </button>
            </div>
          </div>

          {authError && (
            <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] px-4 py-12">
      <div className="max-w-[680px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="ShieldCheck" size={16} className="text-[#4ade80]" />
              <span className="font-mono text-[11px] text-[#4ade80] uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="text-xl font-light text-white">Коды доступа</h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(ADMIN_KEY); setAuthed(false); setPassword(''); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1c1c1c] text-[#555] hover:text-white hover:border-[#333] transition-colors text-sm"
          >
            <Icon name="LogOut" size={13} />
            Выйти
          </button>
        </div>

        {/* Create new code */}
        <div className="rounded-xl border border-[#1c1c1c] bg-[#101010] p-4 mb-6">
          <p className="font-mono text-[10px] text-[#4ade80] uppercase tracking-widest mb-3">Новый код</p>
          <div className="flex gap-2 flex-wrap">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Название (кому выдаёшь)"
              className="flex-1 min-w-[160px] bg-[#0c0c0c] border border-[#1c1c1c] rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-[#333] focus:border-[#4ade80]/40 transition-colors"
            />
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="Код (или оставь пустым — сгенерируется)"
              className="flex-1 min-w-[200px] bg-[#0c0c0c] border border-[#1c1c1c] rounded-lg px-3 py-2 text-sm text-white font-mono outline-none placeholder:text-[#333] focus:border-[#4ade80]/40 transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-[#4ade80] text-[#0c0c0c] font-semibold text-sm hover:bg-[#22c55e] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
            >
              {creating
                ? <span className="w-4 h-4 border-2 border-[#0c0c0c]/30 border-t-[#0c0c0c] rounded-full animate-spin" />
                : <><Icon name="Plus" size={14} />Создать</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5">
            <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Codes list */}
        <div className="rounded-xl border border-[#1c1c1c] bg-[#101010] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c1c]">
            <span className="font-mono text-[10px] text-[#555] uppercase tracking-widest">
              {codes.length} {codes.length === 1 ? 'код' : codes.length < 5 ? 'кода' : 'кодов'}
            </span>
            <button onClick={loadCodes} className="text-[#333] hover:text-[#4ade80] transition-colors">
              <Icon name="RefreshCw" size={13} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-5 h-5 border-2 border-[#1c1c1c] border-t-[#4ade80] rounded-full animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-12 text-[#333] text-sm">Кодов пока нет</div>
          ) : (
            <div className="divide-y divide-[#1c1c1c]">
              {codes.map(c => (
                <div key={c.id} className={`px-4 py-3 flex items-center gap-3 transition-colors ${c.is_active ? '' : 'opacity-40'}`}>
                  <div className="flex-1 min-w-0">
                    {c.label && <p className="text-[#888] text-xs mb-1 truncate">{c.label}</p>}
                    <div className="flex items-center gap-2">
                      <code className="text-white font-mono text-sm">{c.code}</code>
                      <button onClick={() => copy(c.code)} className="text-[#333] hover:text-[#4ade80] transition-colors shrink-0">
                        <Icon name={copied === c.code ? 'Check' : 'Copy'} size={13} />
                      </button>
                    </div>
                    <p className="text-[#333] text-[11px] mt-1">
                      Создан: {formatDate(c.created_at)}
                      {c.last_used_at && <> · Использован: {formatDate(c.last_used_at)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(c.id)}
                      title={c.is_active ? 'Деактивировать' : 'Активировать'}
                      className={`p-2 rounded-lg border transition-colors ${c.is_active ? 'border-[#1c1c1c] text-[#4ade80] hover:border-red-500/30 hover:text-red-400' : 'border-[#1c1c1c] text-[#333] hover:text-[#4ade80] hover:border-[#4ade80]/30'}`}
                    >
                      <Icon name={c.is_active ? 'ToggleRight' : 'ToggleLeft'} size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Удалить"
                      className="p-2 rounded-lg border border-[#1c1c1c] text-[#333] hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
