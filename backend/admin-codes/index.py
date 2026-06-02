import json
import os
import psycopg2
import secrets
import string

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Content-Type': 'application/json'
}

def err(status, msg):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps({'error': msg})}

def ok(data):
    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(data, default=str)}

def check_auth(event):
    password = event.get('headers', {}).get('X-Admin-Password', '')
    return password == os.environ.get('ADMIN_PASSWORD', '')

def generate_code(length=16):
    alphabet = string.ascii_letters + string.digits + '-'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def handler(event: dict, context) -> dict:
    """Управление кодами доступа: список, создание, удаление (только для администратора)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if not check_auth(event):
        return err(401, 'Неверный пароль администратора')

    method = event.get('httpMethod', 'GET')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        cur.execute("""
            SELECT id, code, label, is_active, created_at, last_used_at
            FROM access_codes ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        codes = [
            {'id': r[0], 'code': r[1], 'label': r[2], 'is_active': r[3],
             'created_at': r[4], 'last_used_at': r[5]}
            for r in rows
        ]
        cur.close(); conn.close()
        return ok({'codes': codes})

    body = {}
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        pass

    if method == 'POST':
        action = body.get('action')

        if action == 'create':
            label = str(body.get('label', '')).strip() or None
            custom_code = str(body.get('code', '')).strip() or None
            code = custom_code if custom_code else generate_code()
            cur.execute(
                "INSERT INTO access_codes (code, label) VALUES (%s, %s) RETURNING id",
                (code, label)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close(); conn.close()
            return ok({'id': new_id, 'code': code, 'label': label})

        if action == 'toggle':
            code_id = body.get('id')
            cur.execute(
                "UPDATE access_codes SET is_active = NOT is_active WHERE id = %s RETURNING is_active",
                (code_id,)
            )
            row = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()
            if not row:
                return err(404, 'Код не найден')
            return ok({'is_active': row[0]})

        if action == 'delete':
            code_id = body.get('id')
            cur.execute("DELETE FROM access_codes WHERE id = %s", (code_id,))
            conn.commit()
            cur.close(); conn.close()
            return ok({'deleted': True})

        cur.close(); conn.close()
        return err(400, 'Неизвестное действие')

    cur.close(); conn.close()
    return err(405, 'Метод не поддерживается')
