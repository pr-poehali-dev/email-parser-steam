import Icon from '@/components/ui/icon';

interface Props {
  accessCode: string;
  accessLoading: boolean;
  accessError: string;
  onCodeChange: (val: string) => void;
  onSubmit: () => void;
}

export default function AccessGate({ accessCode, accessLoading, accessError, onCodeChange, onSubmit }: Props) {
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

        <div className="mb-4 px-4 py-3 rounded-lg border border-[#1c1c1c] bg-[#101010]">
          <p className="text-[#555] text-sm leading-relaxed">
            Данный сайт позволяет узнать контакты любого издателя в Steam, такие как e-mail, а также соцсети и сайт (если они им указаны). Главное чтобы игра продавалась в магазине Steam. Для удалённых из магазина игр такие данные также удаляются.
          </p>
        </div>

        <div className="rounded-xl border border-[#1c1c1c] bg-[#101010] overflow-hidden">
          <div className="flex items-center border-b border-[#1c1c1c]">
            <span className="pl-4 pr-2">
              <Icon name="KeyRound" size={14} className="text-[#333]" />
            </span>
            <input
              type="text"
              value={accessCode}
              onChange={e => onCodeChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSubmit()}
              placeholder="Код доступа"
              className="flex-1 bg-transparent py-4 pr-4 text-white font-mono text-sm outline-none placeholder:text-[#2a2a2a]"
              autoFocus
            />
          </div>
          <div className="p-3">
            <button
              onClick={onSubmit}
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
