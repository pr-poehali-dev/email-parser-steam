import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

const BACKEND_URL = 'https://functions.poehali.dev/8af2142f-e1dd-4554-8021-8bcd21726e23';

interface ParseResult {
  success: boolean;
  app_id: string;
  game_title: string;
  emails: string[];
  message?: string;
  url?: string;
}

const Index = () => {
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const id = appId.trim();
    if (!id) {
      setError('Введите App ID');
      inputRef.current?.focus();
      return;
    }
    if (!/^\d+$/.test(id)) {
      setError('App ID должен содержать только цифры');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}?appid=${id}`);
      const text = await res.text();

      let data: ParseResult & { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        setError('Сервер вернул неожиданный ответ. Попробуйте ещё раз.');
        return;
      }

      if (res.status === 400) {
        setError(data.error || 'Некорректный App ID');
      } else if (res.status === 404) {
        setError(data.error || 'Приложение не найдено');
      } else if (res.status !== 200) {
        setError(data.error || `Ошибка сервера (${res.status})`);
      } else {
        setResult(data);
      }
    } catch {
      setError('Ошибка соединения. Проверьте интернет и попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#4ade80 1px, transparent 1px),
            linear-gradient(90deg, #4ade80 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Scan line effect */}
      <div className="scan-line absolute inset-x-0 top-0 h-32 z-0" />

      <div className="relative z-10 w-full max-w-lg">

        {/* Header */}
        <div className="animate-fade-in text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[#4ade80]/20 bg-[#4ade80]/5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="font-mono text-[11px] text-[#4ade80] tracking-widest uppercase">Steam Parser</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight mb-2">
            Найти email издателя
          </h1>
          <p className="text-[#555] text-sm font-light">
            Введите App ID игры в Steam — получите контактный email
          </p>
        </div>

        {/* Input form */}
        <div className="animate-fade-in-delay">
          <div className={`relative flex items-center rounded-lg border transition-all duration-200 ${
            error ? 'border-red-500/50 bg-red-500/5' : 'border-[#222] bg-[#111] focus-within:border-[#4ade80]/40 focus-within:bg-[#111]'
          }`}>

            <span className="font-mono text-[#333] text-sm pl-4 pr-2 select-none whitespace-nowrap">
              appid=
            </span>

            <input
              ref={inputRef}
              type="text"
              value={appId}
              onChange={e => { setAppId(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="570"
              className="flex-1 bg-transparent py-4 pr-2 text-white font-mono text-sm outline-none placeholder:text-[#333]"
            />

            <button
              onClick={handleSearch}
              disabled={loading}
              className="m-1.5 px-5 py-2.5 rounded-md bg-[#4ade80] text-[#0d0d0d] text-sm font-semibold font-mono tracking-wide transition-all duration-150 hover:bg-[#22c55e] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 min-w-[90px] justify-center"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-[#0d0d0d]/30 border-t-[#0d0d0d] rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name="Search" size={14} />
                  Найти
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-red-400 text-xs font-mono flex items-center gap-1.5">
              <Icon name="AlertCircle" size={12} />
              {error}
            </p>
          )}

          <p className="mt-2 text-[#333] text-xs font-mono">
            Пример: 570 (Dota 2), 730 (CS2), 440 (TF2)
          </p>
        </div>

        {/* Result */}
        {result && (
          <div className="animate-fade-in mt-6 rounded-lg border border-[#1a1a1a] bg-[#0f0f0f] overflow-hidden">

            {/* Game info header */}
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-0.5">Приложение</p>
                <p className="text-white text-sm font-medium">{result.game_title}</p>
              </div>
              <span className="font-mono text-[#333] text-xs px-2.5 py-1 rounded border border-[#1a1a1a]">
                #{result.app_id}
              </span>
            </div>

            {/* Emails */}
            <div className="px-5 py-4">
              {result.success && result.emails.length > 0 ? (
                <>
                  <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">
                    {result.emails.length === 1 ? 'Email издателя' : `Email (${result.emails.length})`}
                  </p>
                  <div className="space-y-2">
                    {result.emails.map(email => (
                      <div
                        key={email}
                        onClick={() => copyEmail(email)}
                        className="group flex items-center justify-between px-4 py-3 rounded-md border border-[#1a1a1a] bg-[#111] hover:border-[#4ade80]/30 hover:bg-[#4ade80]/5 cursor-pointer transition-all duration-150"
                      >
                        <span className="font-mono text-[#4ade80] text-sm">{email}</span>
                        <span className="text-[#333] group-hover:text-[#4ade80] transition-colors duration-150">
                          {copied === email ? (
                            <Icon name="Check" size={14} />
                          ) : (
                            <Icon name="Copy" size={14} />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[#333] text-xs font-mono">
                    Нажмите на email, чтобы скопировать
                  </p>
                </>
              ) : (
                <div className="flex items-start gap-3 py-1">
                  <Icon name="Info" size={16} className="text-[#555] mt-0.5 shrink-0" />
                  <p className="text-[#555] text-sm font-light leading-relaxed">
                    {result.message || 'Email не найден. Издатель не указал контактный адрес на странице поддержки Steam.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer link */}
            <div className="px-5 py-3 border-t border-[#1a1a1a]">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#333] text-[11px] hover:text-[#4ade80] transition-colors flex items-center gap-1.5"
              >
                <Icon name="ExternalLink" size={11} />
                Открыть страницу в Steam
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 font-mono text-[#222] text-[11px] tracking-widest">
        STEAM EMAIL PARSER
      </div>
    </div>
  );
};

export default Index;