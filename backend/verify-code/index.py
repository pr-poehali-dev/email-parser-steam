import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Проверяет код доступа пользователя по базе данных"""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
                'body': json.dumps({'error': 'Невалидный запрос'})}

    code = str(data.get('code', '')).strip()
    if not code:
        return {'statusCode': 400, 'headers': cors_headers,
                'body': json.dumps({'valid': False, 'error': 'Введите код доступа'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM access_codes WHERE code = %s AND is_active = TRUE",
        (code,)
    )
    row = cur.fetchone()

    if row:
        cur.execute(
            "UPDATE access_codes SET last_used_at = NOW() WHERE id = %s",
            (row[0],)
        )
        conn.commit()

    cur.close()
    conn.close()

    if row:
        return {'statusCode': 200, 'headers': cors_headers,
                'body': json.dumps({'valid': True})}
    else:
        return {'statusCode': 200, 'headers': cors_headers,
                'body': json.dumps({'valid': False, 'error': 'Неверный или недействительный код'})}
