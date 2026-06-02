import json
import re
import urllib.request
import urllib.error
import os

def handler(event: dict, context) -> dict:
    """Парсит email издателя игры в Steam по App ID"""
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    app_id = params.get('appid', '').strip()

    if not app_id or not app_id.isdigit():
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Укажите корректный App ID (только цифры)'})
        }

    url = f'https://help.steampowered.com/ru/wizard/HelpWithGameTechnicalIssue/?appid={app_id}'

    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        return {
            'statusCode': 404,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Страница не найдена. Проверьте App ID. HTTP {e.code}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Ошибка при запросе к Steam: {str(e)}'})
        }

    # Ищем email в HTML
    email_patterns = [
        r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
    ]

    emails = set()
    for pattern in email_patterns:
        found = re.findall(pattern, html)
        for email in found:
            # Фильтруем системные/технические email Steam
            skip_domains = ['steampowered.com', 'valvesoftware.com', 'steamgames.com', 'example.com']
            if not any(d in email.lower() for d in skip_domains):
                emails.add(email.lower())

    # Ищем название игры
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html)
    game_title = title_match.group(1).strip() if title_match else f'App {app_id}'
    # Очищаем от "Steam :: Поддержка :: "
    game_title = re.sub(r'^(Steam\s*::\s*|Поддержка\s*::\s*)+', '', game_title).strip()

    if emails:
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'success': True,
                'app_id': app_id,
                'game_title': game_title,
                'emails': sorted(list(emails)),
                'url': url
            })
        }
    else:
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'success': False,
                'app_id': app_id,
                'game_title': game_title,
                'emails': [],
                'message': 'Email издателя не найден на странице. Возможно, издатель не указал контактный email.',
                'url': url
            })
        }
