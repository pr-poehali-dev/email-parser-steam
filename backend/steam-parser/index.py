import json
import re
import urllib.request
import urllib.error

def handler(event: dict, context) -> dict:
    """Запрашивает страницу Steam Support с куками пользователя и парсит все контактные данные издателя"""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    body = event.get('body') or ''
    try:
        data = json.loads(body)
    except Exception:
        return {'statusCode': 400, 'headers': cors_headers,
                'body': json.dumps({'error': 'Невалидный JSON'})}

    app_id = str(data.get('app_id', '')).strip()
    cookies = str(data.get('cookies', '')).strip()

    if not app_id or not app_id.isdigit():
        return {'statusCode': 400, 'headers': cors_headers,
                'body': json.dumps({'error': 'Укажите корректный App ID (только цифры)'})}

    if not cookies:
        return {'statusCode': 400, 'headers': cors_headers,
                'body': json.dumps({'error': 'Вставьте куки из браузера'})}

    url = f'https://help.steampowered.com/ru/wizard/HelpWithGameTechnicalIssue/?appid={app_id}'

    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.7',
            'Cookie': cookies,
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        return {'statusCode': 502, 'headers': cors_headers,
                'body': json.dumps({'error': f'Steam вернул ошибку: HTTP {e.code}. Проверьте App ID.'})}
    except Exception as e:
        return {'statusCode': 502, 'headers': cors_headers,
                'body': json.dumps({'error': f'Ошибка при запросе к Steam: {str(e)}'})}

    # Проверяем авторизацию — если редирект на login
    if 'login' in html[:3000].lower() and 'steamid' not in html[:3000].lower():
        return {'statusCode': 401, 'headers': cors_headers,
                'body': json.dumps({'error': 'Куки недействительны или истекли. Скопируйте свежие куки из браузера.'})}

    contacts = {}

    # --- Emails ---
    emails = set()
    for e in re.findall(r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', html):
        emails.add(e.lower())
    skip_domains = ['steampowered.com', 'valvesoftware.com', 'steamgames.com',
                    'example.com', 'sentry.io', 'cloudflare.com', 'akamai.com',
                    'w3.org', 'schema.org', 'openid.net', 'googleapis.com']
    for e in re.findall(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', html):
        if not any(d in e.lower() for d in skip_domains):
            emails.add(e.lower())
    if emails:
        contacts['emails'] = sorted(list(emails))

    # --- Social networks ---
    social_patterns = {
        'Twitter / X':  r'https?://(?:www\.)?(?:twitter\.com|x\.com)/[A-Za-z0-9_]{1,50}(?=["\s<])',
        'Facebook':     r'https?://(?:www\.)?facebook\.com/[^\s"\'<>&?#]{2,80}',
        'Discord':      r'https?://(?:www\.)?discord(?:\.gg|\.com/invite)/[^\s"\'<>&?#]{2,50}',
        'Instagram':    r'https?://(?:www\.)?instagram\.com/[^\s"\'<>&?#]{2,50}',
        'YouTube':      r'https?://(?:www\.)?youtube\.com/(?:c/|channel/|@)[^\s"\'<>&?#]{2,80}',
        'Twitch':       r'https?://(?:www\.)?twitch\.tv/[^\s"\'<>&?#]{2,50}',
        'Reddit':       r'https?://(?:www\.)?reddit\.com/r/[^\s"\'<>&?#]{2,50}',
        'VK':           r'https?://(?:www\.)?vk\.com/[^\s"\'<>&?#]{2,50}',
        'TikTok':       r'https?://(?:www\.)?tiktok\.com/@[^\s"\'<>&?#]{2,50}',
        'LinkedIn':     r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[^\s"\'<>&?#]{2,80}',
    }
    socials = {}
    for platform, pattern in social_patterns.items():
        found = re.findall(pattern, html, re.IGNORECASE)
        if found:
            socials[platform] = found[0].rstrip('.,;)"\'')
    if socials:
        contacts['socials'] = socials

    # --- Websites (non-Steam, non-social) ---
    steam_hosts = ['steampowered.com', 'steamcommunity.com', 'steamgames.com',
                   'valvesoftware.com', 'akamai.com', 'cloudflare', 'googleapis',
                   'gstatic.com', 'cdn.', 'ajax.', 'jquery', 'fonts.']
    social_domains = ['twitter.com', 'x.com', 'facebook.com', 'discord.gg', 'discord.com',
                      'instagram.com', 'youtube.com', 'twitch.tv', 'reddit.com',
                      'vk.com', 'tiktok.com', 'linkedin.com']
    asset_exts = re.compile(r'\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|json|map|txt|xml)\b', re.IGNORECASE)

    websites = set()
    for url_found in re.findall(r'https?://[^\s"\'<>]+', html):
        u = url_found.rstrip('.,;)\'"')
        if any(h in u for h in steam_hosts):
            continue
        if any(sd in u for sd in social_domains):
            continue
        if asset_exts.search(u):
            continue
        if len(u) > 100:
            continue
        websites.add(u)

    if websites:
        contacts['websites'] = sorted(list(websites))[:6]

    # --- Phone numbers ---
    phones = set()
    for p in re.findall(r'(?:tel:|phone["\s:=]+)["\']?(\+?[\d\s\-\(\)]{7,20})', html, re.IGNORECASE):
        clean = p.strip()
        if len(re.sub(r'\D', '', clean)) >= 7:
            phones.add(clean)
    if phones:
        contacts['phones'] = sorted(list(phones))

    # --- Game title ---
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html)
    raw_title = title_match.group(1).strip() if title_match else f'App {app_id}'
    game_title = re.sub(
        r'^(Steam\s*[:\-–]\s*|Поддержка\s+Steam\s*[:\-–]\s*|Steam\s+Support\s*[:\-–]\s*)+',
        '', raw_title, flags=re.IGNORECASE
    ).strip()
    game_title = re.sub(r'\s*[:\-–]\s*(Проблемы|Техн|Issues|Technical).+$', '', game_title).strip()

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({
            'success': bool(contacts),
            'app_id': app_id,
            'game_title': game_title,
            'contacts': contacts,
            'steam_url': f'https://help.steampowered.com/ru/wizard/HelpWithGameTechnicalIssue/?appid={app_id}'
        }, ensure_ascii=False)
    }
