import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

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

const SOCIAL_ICONS: Record<string, string> = {
  'Twitter / X': 'Twitter',
  'Facebook': 'Facebook',
  'Discord': 'MessageCircle',
  'Instagram': 'Instagram',
  'YouTube': 'Youtube',
  'Twitch': 'Twitch',
  'Reddit': 'Globe',
  'VK': 'Globe',
  'TikTok': 'Music',
  'LinkedIn': 'Linkedin',
};

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

  const hasContacts = result && (
    (result.contacts.emails?.length ?? 0) > 0 ||
    Object.keys(result.contacts.socials ?? {}).length > 0 ||
    (result.contacts.websites?.length ?? 0) > 0 ||
    (result.contacts.phones?.length ?? 0) > 0
  );

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#4ade80 1px,transparent 1px),linear-gradient(90deg,#4ade80 1px,transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#4ade80]/5 blur-[80px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[360px]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-[#1c1c1c] bg-[#101010] mb-5">
              <Icon name="Lock" size={20} className="text-[#4ade80]" />
            </div>
            <h1 className="text-[22px] font-light text-white tracking-tight mb-2">Доступ закрыт</h1>
            <p className="text-[#4a4a4a] text-sm">Введите код доступа для продолжения</p>
          </div>

          <div className="rounded-xl border border-[#1c1c1c] bg-[#101010] overflow-hidden">
            <div className="flex items-center border-b border-[#1c1c1c]">
              <span className="pl-4 pr-2">
                <Icon name="KeyRound" size={14} className="text-[#333]" />
              </span>
              <input
                type="text"
                value={accessCode}
                onChange={e => { setAccessCode(e.target.value); setAccessError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAccessSubmit()}
                placeholder="Код доступа"
                className="flex-1 bg-transparent py-4 pr-4 text-white font-mono text-sm outline-none placeholder:text-[#2a2a2a]"
                autoFocus
              />
            </div>
            <div className="p-3">
              <button
                onClick={handleAccessSubmit}
                disabled={accessLoading}
                className="w-full py-3 rounded-lg bg-[#4ade80] text-[#0c0c0c] font-semibold font-mono text-sm tracking-wide transition-all duration-150 hover:bg-[#22c55e] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accessLoading ? (
                  <span className="w-4 h-4 border-2 border-[#0c0c0c]/30 border-t-[#0c0c0c] rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="Unlock" size={14} />
                    Войти
                  </>
                )}
              </button>
            </div>
          </div>

          {accessError && (
            <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{accessError}</p>
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 px-4 py-3 rounded-lg border border-[#1c1c1c] bg-[#101010]">
            <Icon name="MessageCircle" size={14} className="text-[#4ade80] shrink-0 mt-0.5" />
            <p className="text-[#555] text-sm leading-relaxed">
              Для получения информации и доступа к сервису обратитесь пожалуйста к владельцу сайта:{' '}
              <a href="https://t.me/rif2310" target="_blank" rel="noopener noreferrer" className="text-[#4ade80] hover:underline">Telegram @rif2310</a>
            </p>
          </div>
        </div>

        <div className="absolute bottom-5 font-mono text-[#1c1c1c] text-[11px] tracking-[0.2em]">
          STEAM CONTACT PARSER
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(#4ade80 1px,transparent 1px),linear-gradient(90deg,#4ade80 1px,transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#4ade80]/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[520px]">

        {/* Notice */}
        <div className="mb-8 rounded-xl border border-[#1c1c1c] bg-[#101010] px-5 py-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Icon name="Info" size={14} className="text-[#4ade80] shrink-0" />
            <span className="font-mono text-[10px] text-[#4ade80] uppercase tracking-widest">Важно знать</span>
          </div>
          <p className="text-[#555] text-sm leading-relaxed">
            Прямую форму логина Steam (логин + пароль) сделать нельзя — Steam не предоставляет такой API для сторонних сайтов.
          </p>
          <p className="text-[#555] text-sm leading-relaxed">
            Но есть <span className="text-[#888]">Steam OpenID</span> — официальный способ входа через Steam, как кнопка «Войти через Steam» на многих игровых сайтах. Пользователь нажимает кнопку → его перебрасывает на страницу Steam → он входит → Steam возвращает его обратно на наш сайт уже авторизованным.
          </p>
          <p className="text-[#555] text-sm leading-relaxed">
            Одна проблема: <span className="text-[#888]">OpenID даёт нам только SteamID пользователя</span>, но не куки сессии <code className="font-mono text-xs text-[#4ade80]/70 bg-[#4ade80]/5 px-1.5 py-0.5 rounded">steamLoginSecure</code>, которые нужны для доступа к контактам издателей — это закрытая часть Steam, и OpenID туда не даёт доступ.
          </p>
          <div className="border-t border-[#1c1c1c] pt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="ShieldCheck" size={14} className="text-[#4ade80] shrink-0" />
              <span className="font-mono text-[10px] text-[#4ade80] uppercase tracking-widest">Безопасность</span>
            </div>
            <p className="text-[#555] text-sm leading-relaxed">
              Мы <span className="text-[#888]">не сохраняем, не передаём и никоим образом не используем</span> введённые вами куки. Если не доверяете — не пользуйтесь, это ваше право.
            </p>
            <p className="text-[#555] text-sm leading-relaxed">
              Доступ к этой информации есть только у авторизованных пользователей Steam. Можно использовать любой аккаунт — хоть новый, лишь бы на нём была хотя бы одна игра.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-[#4ade80]/20 bg-[#4ade80]/5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="font-mono text-[11px] text-[#4ade80] tracking-[0.15em] uppercase">Steam Contact Parser</span>
          </div>
          <h1 className="text-[28px] font-light text-white tracking-tight mb-2">
            Контакты издателя в Steam
          </h1>
          <p className="text-[#4a4a4a] text-sm">
            Введите App ID игры и куки браузера — получите все контакты
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-[#1c1c1c] bg-[#101010] overflow-hidden animate-fade-in-delay">

          {/* App ID row */}
          <div className="flex items-center border-b border-[#1c1c1c]">
            <span className="font-mono text-[#2a2a2a] text-sm px-4 select-none">appid=</span>
            <input
              type="text"
              value={appId}
              onChange={e => { setAppId(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="570"
              className="flex-1 bg-transparent py-4 text-white font-mono text-sm outline-none placeholder:text-[#2a2a2a]"
            />
          </div>

          {/* Cookies accordion */}
          <div className="border-b border-[#1c1c1c]">
            <button
              onClick={() => setCookiesOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon name="KeyRound" size={14} className="text-[#4ade80]" />
                <span className="text-sm text-[#888]">
                  {cookies.trim() ? (
                    <span className="text-[#4ade80]">Куки добавлены ✓</span>
                  ) : (
                    'Куки Steam браузера'
                  )}
                </span>
              </div>
              <Icon name={cookiesOpen ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-[#333]" />
            </button>

            {cookiesOpen && (
              <div className="px-4 pb-4 space-y-3">
                {/* Instruction */}
                <div className="rounded-lg border border-[#1c1c1c] bg-[#0a0a0a] p-3 space-y-2">
                  <p className="font-mono text-[10px] text-[#4ade80] uppercase tracking-widest">Как получить куки</p>
                  <ol className="space-y-1">
                    {[
                      'Открой любую страницу help.steampowered.com в браузере (войди в аккаунт)',
                      'Нажми F12 → вкладка «Network» (Сеть)',
                      'Обнови страницу (F5)',
                      'Кликни на первый запрос в списке',
                      'В панели справа найди раздел «Request Headers»',
                      'Скопируй значение поля «Cookie» целиком и вставь ниже',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#555]">
                        <span className="font-mono text-[#4ade80]/50 shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="relative">
                  <textarea
                    value={cookies}
                    onChange={e => { setCookies(e.target.value); setError(''); }}
                    placeholder="steamLoginSecure=xxxxxxx; sessionid=xxxxxxx; ..."
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-2.5 text-[#888] font-mono text-[11px] outline-none resize-none placeholder:text-[#2a2a2a] focus:border-[#4ade80]/30 transition-colors"
                  />
                  {cookies.trim() && (
                    <button
                      onClick={() => setCookies('')}
                      className="absolute top-2 right-2 text-[#333] hover:text-[#666] transition-colors"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="p-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#4ade80] text-[#0c0c0c] font-semibold font-mono text-sm tracking-wide transition-all duration-150 hover:bg-[#22c55e] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-[#0c0c0c]/30 border-t-[#0c0c0c] rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name="Search" size={14} />
                  Найти контакты
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 animate-fade-in">
            <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-4 rounded-xl border border-[#1c1c1c] bg-[#101010] overflow-hidden animate-fade-in">

            {/* Game header */}
            <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-0.5">Приложение</p>
                <p className="text-white text-sm font-medium truncate">{result.game_title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[#2a2a2a] text-xs px-2.5 py-1 rounded border border-[#1c1c1c]">
                  #{result.app_id}
                </span>
                <a
                  href={`https://store.steampowered.com/app/${result.app_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#333] hover:text-[#4ade80] transition-colors"
                  title="Открыть в Steam"
                >
                  <Icon name="ExternalLink" size={14} />
                </a>
              </div>
            </div>

            {hasContacts ? (
              <div className="divide-y divide-[#1c1c1c]">

                {/* Emails */}
                {result.contacts.emails && result.contacts.emails.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">
                      Email {result.contacts.emails.length > 1 ? `(${result.contacts.emails.length})` : ''}
                    </p>
                    <div className="space-y-2">
                      {result.contacts.emails.map(email => (
                        <div
                          key={email}
                          onClick={() => copy(email)}
                          className="group flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1c1c1c] hover:border-[#4ade80]/30 hover:bg-[#4ade80]/5 cursor-pointer transition-all"
                        >
                          <span className="font-mono text-[#4ade80] text-sm">{email}</span>
                          <span className="text-[#2a2a2a] group-hover:text-[#4ade80] transition-colors">
                            <Icon name={copied === email ? 'Check' : 'Copy'} size={13} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social */}
                {result.contacts.socials && Object.keys(result.contacts.socials).length > 0 && (
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">Социальные сети</p>
                    <div className="space-y-2">
                      {Object.entries(result.contacts.socials).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1c1c1c] hover:border-[#4ade80]/30 hover:bg-[#4ade80]/5 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon name={SOCIAL_ICONS[platform] ?? 'Globe'} size={14} className="text-[#4a4a4a] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-[#444] font-mono">{platform}</p>
                              <p className="text-sm text-[#888] truncate group-hover:text-white transition-colors">{url}</p>
                            </div>
                          </div>
                          <Icon name="ExternalLink" size={12} className="text-[#2a2a2a] group-hover:text-[#4ade80] shrink-0 ml-2 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Websites */}
                {result.contacts.websites && result.contacts.websites.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">Сайты</p>
                    <div className="space-y-2">
                      {result.contacts.websites.map(site => (
                        <a
                          key={site}
                          href={site}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1c1c1c] hover:border-[#4ade80]/30 hover:bg-[#4ade80]/5 transition-all"
                        >
                          <span className="text-sm text-[#888] truncate group-hover:text-white transition-colors">{site}</span>
                          <Icon name="ExternalLink" size={12} className="text-[#2a2a2a] group-hover:text-[#4ade80] shrink-0 ml-2 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phones */}
                {result.contacts.phones && result.contacts.phones.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">Телефоны</p>
                    <div className="space-y-2">
                      {result.contacts.phones.map(phone => (
                        <div
                          key={phone}
                          onClick={() => copy(phone)}
                          className="group flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1c1c1c] hover:border-[#4ade80]/30 hover:bg-[#4ade80]/5 cursor-pointer transition-all"
                        >
                          <span className="font-mono text-[#4ade80] text-sm">{phone}</span>
                          <Icon name={copied === phone ? 'Check' : 'Copy'} size={13} className="text-[#2a2a2a] group-hover:text-[#4ade80] transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="px-5 py-6 flex items-start gap-3">
                <Icon name="Info" size={16} className="text-[#444] mt-0.5 shrink-0" />
                <p className="text-[#444] text-sm leading-relaxed">
                  Контактные данные не найдены. Возможно, издатель не указал их на странице поддержки.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      <div className="absolute bottom-5 font-mono text-[#1c1c1c] text-[11px] tracking-[0.2em]">
        STEAM CONTACT PARSER
      </div>
    </div>
  );
}