#!/usr/bin/env python3
"""Посты из группы ВК на сайт АРКСИС.

Забирает со стены группы посты с хэштегом #насайт, скачивает их фото и обложки видео
в img/feed/ и пишет data/vk-feed.json. Сайт читает только этот файл.

Сервисный ключ ВК берётся из переменной окружения VK_SERVICE_TOKEN (в GitHub это секрет
репозитория). В файлы сайта ключ не попадает, в логи тоже.

Запуск: python auto-update/vk_sync.py  (из корня сайта)
Нужен только Python 3.10+, без сторонних библиотек.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

GROUP_ID = -36832487            # vk.ru/arksis.group
TAG = '#насайт'                 # пост с этим хэштегом попадёт на сайт
MAX_POSTS = 24                  # сколько постов держать на сайте
MAX_PHOTOS = 8                  # фото на пост
MAX_BYTES = 8 * 1024 * 1024     # предел на одну картинку
API = 'https://api.vk.ru/method/'
API_VERSION = '5.199'
TZ = timezone(timedelta(hours=7))  # Новосибирск
IMG_HOSTS = ('userapi.com', 'vkuserphoto.ru', 'vk.com', 'vk.ru', 'vk-cdn.net', 'mycdn.me', 'okcdn.ru')

ROOT = Path(__file__).resolve().parent.parent
FEED_FILE = ROOT / 'data' / 'vk-feed.json'
IMG_DIR = ROOT / 'img' / 'feed'


def api(method: str, **params):
    token = os.environ.get('VK_SERVICE_TOKEN')
    if not token:
        sys.exit('Нет VK_SERVICE_TOKEN: добавьте сервисный ключ в секреты репозитория.')
    params.update(access_token=token, v=API_VERSION)
    # ключ уходит в теле POST-запроса, а не в адресе: так он не оседает в логах
    req = urllib.request.Request(API + method, data=urllib.parse.urlencode(params).encode())
    with urllib.request.urlopen(req, timeout=30) as r:
        res = json.load(r)
    if 'error' in res:
        sys.exit(f"VK API {method}: {res['error'].get('error_code')} {res['error'].get('error_msg')}")
    return res['response']


def allowed(url: str) -> bool:
    host = urllib.parse.urlparse(url).hostname or ''
    return url.startswith('https://') and any(host == h or host.endswith('.' + h) for h in IMG_HOSTS)


def download(url: str, name: str) -> str | None:
    """Качает картинку с серверов ВК. Ссылки ВК со временем протухают, поэтому храним копию у себя."""
    dst = IMG_DIR / name
    if dst.exists():
        return f'img/feed/{name}'
    if not allowed(url):
        return None
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'arksis-site-sync'}), timeout=30) as r:
        if not r.headers.get('Content-Type', '').startswith('image/'):
            return None
        data = r.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        return None
    dst.write_bytes(data)
    return f'img/feed/{name}'


def best_size(sizes: list, limit: int = 1280) -> str | None:
    """Самая крупная версия фото не шире limit."""
    ok = [s for s in sizes if s.get('width', 0) <= limit and s.get('url')] or [s for s in sizes if s.get('url')]
    return max(ok, key=lambda s: s.get('width', 0))['url'] if ok else None


def clean_text(text: str) -> tuple[str, str]:
    """Заголовок из первой строки, короткий текст из следующих. Хэштеги убираем."""
    text = re.sub(r'#\S+', '', text)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return 'Новое с объекта', ''
    title = lines[0][:90].rstrip(' .,!')
    body = ' '.join(lines[1:])
    if len(body) > 220:
        body = body[:220].rsplit(' ', 1)[0] + '…'
    return title, body


def video_item(v: dict) -> dict:
    cover_url = best_size(v.get('image', []), 720)
    vid = int(v['id'])
    return {
        'id': vid,
        'title': (v.get('title') or 'Видео из группы')[:90],
        'duration': f"{v.get('duration', 0) // 60}:{v.get('duration', 0) % 60:02d}",
        'url': f'https://vk.ru/video{v["owner_id"]}_{vid}',
        'embed': f'https://vkvideo.ru/video_ext.php?oid={v["owner_id"]}&id={vid}&hd=2',
        'cover': download(cover_url, f'v_{vid}.jpg') if cover_url else None,
    }


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    old = json.loads(FEED_FILE.read_text(encoding='utf-8')) if FEED_FILE.exists() else {}

    wall = api('wall.get', owner_id=GROUP_ID, count=100, filter='owner')
    posts, clips = [], []
    for item in wall.get('items', []):
        if TAG not in (item.get('text') or '').lower():
            continue
        title, body = clean_text(item.get('text', ''))
        photos, video = [], None
        for att in item.get('attachments', []):
            if att['type'] == 'photo' and len(photos) < MAX_PHOTOS:
                url = best_size(att['photo'].get('sizes', []))
                saved = url and download(url, f'{item["id"]}_{len(photos)}.jpg')
                if saved:
                    photos.append(saved)
            elif att['type'] == 'video' and not video:
                video = video_item(att['video'])
        place = ((item.get('geo') or {}).get('place') or {}).get('title', '')
        post = {
            'id': item['id'],
            'url': f'https://vk.ru/wall{GROUP_ID}_{item["id"]}',
            'date': datetime.fromtimestamp(item['date'], TZ).date().isoformat(),
            'place': place[:60],
            'title': title,
            'text': body,
            'photos': photos,
        }
        if video:
            post['video'] = video
            clips.append({k: video[k] for k in ('id', 'url', 'embed', 'cover', 'title')} | {'views': ''})
        if photos or video:
            posts.append(post)
        if len(posts) >= MAX_POSTS:
            break

    now = datetime.now(TZ)
    feed = {'group': 'https://vk.ru/arksis.group', 'tag': TAG, 'posts': posts, 'clips': clips}
    changed = {k: old.get(k) for k in ('posts', 'clips')} != {'posts': posts, 'clips': clips}
    # GitHub выключает расписание, если в репозитории 60 дней нет коммитов. Раз в 30 дней
    # обновляем отметку проверки, даже когда новых постов нет.
    checked = datetime.fromisoformat(old['checked']) if old.get('checked') else now - timedelta(days=31)
    if not changed and now - checked < timedelta(days=30):
        print('Новых постов нет')
        return
    feed['updated'] = now.isoformat(timespec='minutes') if changed else old.get('updated', now.isoformat(timespec='minutes'))
    feed['checked'] = now.isoformat(timespec='minutes')
    FEED_FILE.parent.mkdir(parents=True, exist_ok=True)
    FEED_FILE.write_text(json.dumps(feed, ensure_ascii=False, indent=1), encoding='utf-8')

    # убираем картинки постов, которые ушли с сайта
    used = {p for post in posts for p in post['photos']} | {c['cover'] for c in clips if c.get('cover')}
    for f in IMG_DIR.glob('*.jpg'):
        if f'img/feed/{f.name}' not in used and not f.name.startswith('clip_'):
            f.unlink()
    print(f'Постов на сайте: {len(posts)}, видео: {len(clips)}')


if __name__ == '__main__':
    main()
