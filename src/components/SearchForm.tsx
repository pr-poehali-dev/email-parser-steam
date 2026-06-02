import Icon from '@/components/ui/icon';

interface Props {
  appId: string;
  cookies: string;
  loading: boolean;
  error: string;
  cookiesOpen: boolean;
  onAppIdChange: (val: string) => void;
  onCookiesChange: (val: string) => void;
  onCookiesOpenToggle: () => void;
  onSearch: () => void;
}

export default function SearchForm({
  appId, cookies, loading, error, cookiesOpen,
  onAppIdChange, onCookiesChange, onCookiesOpenToggle, onSearch,
}: Props) {
  return (
    <>
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
            onChange={e => onAppIdChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="570"
            className="flex-1 bg-transparent py-4 text-white font-mono text-sm outline-none placeholder:text-[#2a2a2a]"
          />
        </div>

        {/* Cookies accordion */}
        <div className="border-b border-[#1c1c1c]">
          <button
            onClick={onCookiesOpenToggle}
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
                  onChange={e => onCookiesChange(e.target.value)}
                  placeholder="steamLoginSecure=xxxxxxx; sessionid=xxxxxxx; ..."
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-2.5 text-[#888] font-mono text-[11px] outline-none resize-none placeholder:text-[#2a2a2a] focus:border-[#4ade80]/30 transition-colors"
                />
                {cookies.trim() && (
                  <button
                    onClick={() => onCookiesChange('')}
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
            onClick={onSearch}
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
    </>
  );
}
