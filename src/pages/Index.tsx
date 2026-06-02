import { useState, useEffect } from 'react';
import AccessGate from '@/components/AccessGate';
import SearchForm from '@/components/SearchForm';
import ContactsResult from '@/components/ContactsResult';

const BACKEND_URL = 'https://functions.poehali.dev/8af2142f-e1dd-4554-8021-8bcd21726e23';
const VERIFY_URL = 'https://functions.poehali.dev/7411182d-31f5-4107-9851-6ffcf47619ba';
const ACCESS_KEY = 'steam_parser_access';

interface Contacts {
  emails?: string[];
  socials?: Record<string, string>;
  websites?: string[];
  phones?: string[];
}

interface ParseResult {
  success: boolean;
  app_id: string;
  game_title: string;
  contacts: Contacts;
  error?: string;
}

export default function Index() {
  const [accessCode, setAccessCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState('');

  const [appId, setAppId] = useState('');
  const [cookies, setCookies] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [cookiesOpen, setCookiesOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(ACCESS_KEY);
    if (saved) setAccessGranted(true);
  }, []);

  const handleAccessSubmit = async () => {
    const code = accessCode.trim();
    if (!code) { setAccessError('Введите код доступа'); return; }
    setAccessLoading(true);
    setAccessError('');
    try {
      const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem(ACCESS_KEY, '1');
        setAccessGranted(true);
      } else {
        setAccessError(data.error || 'Неверный код доступа');
      }
    } catch {
      setAccessError('Ошибка соединения. Проверьте интернет.');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleSearch = async () => {
    const id = appId.trim();
    if (!id) { setError('Введите App ID'); return; }
    if (!/^\d+$/.test(id)) { setError('App ID — только цифры'); return; }
    if (!cookies.trim()) { setError('Вставьте куки из браузера Steam'); setCookiesOpen(true); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: id, cookies: cookies.trim() }),
      });
      const text = await res.text();
      let data: ParseResult;
      try { data = JSON.parse(text); }
      catch { setError('Сервер вернул неожиданный ответ'); return; }

      if (!res.ok) { setError(data.error || `Ошибка ${res.status}`); return; }
      setResult(data);
    } catch {
      setError('Ошибка соединения. Проверьте интернет.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!accessGranted) {
    return (
      <AccessGate
        accessCode={accessCode}
        accessLoading={accessLoading}
        accessError={accessError}
        onCodeChange={(val) => { setAccessCode(val); setAccessError(''); }}
        onSubmit={handleAccessSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(#4ade80 1px,transparent 1px),linear-gradient(90deg,#4ade80 1px,transparent 1px)',
        backgroundSize: '48px 48px'
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#4ade80]/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[520px]">
        <SearchForm
          appId={appId}
          cookies={cookies}
          loading={loading}
          error={error}
          cookiesOpen={cookiesOpen}
          onAppIdChange={(val) => { setAppId(val); setError(''); }}
          onCookiesChange={(val) => { setCookies(val); setError(''); }}
          onCookiesOpenToggle={() => setCookiesOpen(o => !o)}
          onSearch={handleSearch}
        />

        {result && (
          <ContactsResult
            result={result}
            copied={copied}
            onCopy={copy}
          />
        )}
      </div>

      <div className="absolute bottom-5 font-mono text-[#1c1c1c] text-[11px] tracking-[0.2em]">
        STEAM CONTACT PARSER
      </div>
    </div>
  );
}
