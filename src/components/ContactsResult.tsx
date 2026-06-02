import Icon from '@/components/ui/icon';

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

interface Props {
  result: ParseResult;
  copied: string | null;
  onCopy: (text: string) => void;
}

export default function ContactsResult({ result, copied, onCopy }: Props) {
  const hasContacts = (
    (result.contacts.emails?.length ?? 0) > 0 ||
    Object.keys(result.contacts.socials ?? {}).length > 0 ||
    (result.contacts.websites?.length ?? 0) > 0 ||
    (result.contacts.phones?.length ?? 0) > 0
  );

  return (
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
                    onClick={() => onCopy(email)}
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
                    onClick={() => onCopy(phone)}
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
  );
}
