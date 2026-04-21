import os
import sys
import gzip
import re
import psycopg2
from psycopg2.extras import execute_batch
from lxml import etree

YOUTUBE_REGEX = re.compile(r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})')
MAX_DURATION = 600
BATCH_SIZE = 10_000

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "samplehunt"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "berke")
}

RELEASES_XML = r"D:\Discogs 2008\discogs_20260401_releases.xml.gz"

def get_youtube_id(url):
    if not url:
        return None
    m = YOUTUBE_REGEX.search(url)
    return m.group(1) if m else None

def parse_duration(dur):
    if not dur:
        return 0
    p = dur.split(':')
    try:
        if len(p) == 3:
            return int(p[0])*3600 + int(p[1])*60 + int(p[2])
        if len(p) == 2:
            return int(p[0])*60 + int(p[1])
        return int(p[0])
    except:
        return 0

def create_table():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS releases (
            id SERIAL PRIMARY KEY,
            discogs_id INTEGER UNIQUE NOT NULL,
            title VARCHAR(500),
            artist VARCHAR(500),
            release_year INTEGER,
            genres TEXT[],
            styles TEXT[],
            youtube_id VARCHAR(20),
            duration INTEGER,
            country VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_releases_youtube_id ON releases(youtube_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_releases_discogs_id ON releases(discogs_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_releases_country ON releases(country)")
    conn.commit()
    conn.close()

def process_release(release):
    try:
        discogs_id_elem = release.find('id')
        if discogs_id_elem is None:
            return None
        discogs_id = int(discogs_id_elem.text)

        type_elem = release.find('type')
        if type_elem is not None and type_elem.text == 'Non-Music':
            return None

        title_elem = release.find('title')
        title = title_elem.text if title_elem is not None else None

        artists = release.findall('.//artist/name')
        artist = ', '.join(a.text for a in artists if a.text) if artists else None

        year_elem = release.find('released')
        year = None
        if year_elem is not None and year_elem.text:
            yr = year_elem.text[:4]
            if yr.isdigit():
                year = int(yr)

        genres = [g.text for g in release.findall('genres/genre') if g.text]
        styles = [s.text for s in release.findall('styles/style') if s.text]

        country_elem = release.find('country')
        country = country_elem.text if country_elem is not None and country_elem.text else None

        youtube_id = None
        min_duration = 0

        for video in release.findall('.//video'):
            src = video.get('src', '')
            if src and ('youtube' in src or 'youtu.be' in src):
                youtube_id = get_youtube_id(src)
                if youtube_id:
                    dur = video.get('duration', '')
                    if dur:
                        min_duration = int(dur)
                    break

        if not youtube_id:
            return None

        if min_duration > MAX_DURATION:
            return None

        return {
            'discogs_id': discogs_id,
            'title': title,
            'artist': artist,
            'release_year': year,
            'genres': genres,
            'styles': styles,
            'youtube_id': youtube_id,
            'duration': min_duration if min_duration else 0,
            'country': country
        }
    except Exception:
        return None

def main():
    if not os.path.exists(RELEASES_XML):
        print(f"File not found: {RELEASES_XML}")
        sys.exit(1)

    create_table()
    print(f"Input: {RELEASES_XML}")
    sys.stdout.flush()

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    total = 0
    buffer = []

    opener = gzip.open if RELEASES_XML.endswith('.gz') else open

    with opener(RELEASES_XML, 'rb') as f:
        context = etree.iterparse(f, events=('end',), tag='release', recover=True)

        for event, elem in context:
            result = process_release(elem)
            elem.clear()

            if result:
                buffer.append(result)

                if len(buffer) >= BATCH_SIZE:
                    execute_batch(cur, """
                        INSERT INTO releases (discogs_id, title, artist, release_year, genres, styles, youtube_id, duration, country)
                        VALUES (%(discogs_id)s, %(title)s, %(artist)s, %(release_year)s, %(genres)s, %(styles)s, %(youtube_id)s, %(duration)s, %(country)s)
                        ON CONFLICT (discogs_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            youtube_id = EXCLUDED.youtube_id,
                            country = EXCLUDED.country
                    """, buffer, BATCH_SIZE)
                    total += len(buffer)
                    print(f"+{len(buffer)} records (total: {total})")
                    sys.stdout.flush()
                    buffer = []

    if buffer:
        execute_batch(cur, """
            INSERT INTO releases (discogs_id, title, artist, release_year, genres, styles, youtube_id, duration, country)
            VALUES (%(discogs_id)s, %(title)s, %(artist)s, %(release_year)s, %(genres)s, %(styles)s, %(youtube_id)s, %(duration)s, %(country)s)
            ON CONFLICT (discogs_id) DO UPDATE SET
                title = EXCLUDED.title,
                youtube_id = EXCLUDED.youtube_id,
                country = EXCLUDED.country
        """, buffer, BATCH_SIZE)
        total += len(buffer)
        print(f"+{len(buffer)} records (total: {total})")

    conn.close()
    print(f"Done! Total records: {total}")

if __name__ == '__main__':
    main()
