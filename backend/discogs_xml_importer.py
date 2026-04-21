import os
import re
import multiprocessing as mp
from multiprocessing import Pool
from lxml import etree
import psycopg2
from psycopg2.extras import execute_batch
from psycopg2.extensions import AsIs
import re
from typing import Optional

CHUNK_SIZE = 100_000
BATCH_SIZE = 5_000
MAX_DURATION_SECONDS = 600
YOUTUBE_REGEX = re.compile(r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})')
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "samplehunt"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "berke")
}

def get_youtube_id(url: str) -> Optional[str]:
    if not url:
        return None
    match = YOUTUBE_REGEX.search(url)
    return match.group(1) if match else None

def create_table():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS discogs_samples (
            id SERIAL PRIMARY KEY,
            release_id INTEGER UNIQUE NOT NULL,
            title VARCHAR(500),
            artist VARCHAR(500),
            duration INTEGER,
            youtube_id VARCHAR(20),
            youtube_url VARCHAR(200),
            genres TEXT[],
            styles TEXT[],
            country VARCHAR(100),
            year INTEGER,
            label VARCHAR(200),
            catno VARCHAR(100),
            thumb VARCHAR(200),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_discogs_youtube_id ON discogs_samples(youtube_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_discogs_release_id ON discogs_samples(release_id)")
    conn.commit()
    conn.close()

def parse_duration(duration_str: str) -> int:
    if not duration_str:
        return 0
    parts = duration_str.split(':')
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[2])
        elif len(parts) == 1:
            return int(parts[0])
    except (ValueError, IndexError):
        pass
    return 0

def extract_youtube_url(track_elem) -> Optional[str]:
    for source in track_elem.findall('.//source[@type="video/youtube"]') or []:
        url = source.get('url', '')
        if 'youtube' in url or 'youtu.be' in url:
            return url
    return None

def process_chunk(args):
    xml_bytes, chunk_id = args
    records = []

    try:
        context = etree.iterparse(xml_bytes, events=('end',), tag='release', recover=True)
        for _, elem in context:
            try:
                release_id_elem = elem.find('id')
                if release_id_elem is None:
                    elem.clear()
                    continue
                release_id = int(release_id_elem.text)

                type_elem = elem.find('type')
                if type_elem is not None and type_elem.text == 'Non-Music':
                    elem.clear()
                    continue

                title_elem = elem.find('title')
                title = title_elem.text if title_elem is not None else None

                artists = elem.findall('.//artist/name')
                artist = ', '.join(a.text for a in artists if a.text) if artists else None

                country_elem = elem.find('country')
                country = country_elem.text if country_elem is not None else None

                year_elem = elem.find('year')
                year = int(year_elem.text) if year_elem is not None and year_elem.text else None

                labels = elem.findall('.//label/name')
                label = labels[0].text if labels else None
                catnos = elem.findall('.//label/catno')
                catno = catnos[0].text if catnos else None

                genres = [g.text for g in elem.findall('genres/genre') if g.text]
                styles = [s.text for s in elem.findall('styles/style') if s.text]

                thumb_elem = elem.find('images/image[@type="thumb"]')
                if thumb_elem is None:
                    thumb_elem = elem.find('images/image')
                thumb = thumb_elem.get('uri') if thumb_elem is not None else None

                youtube_url = None
                youtube_id = None
                duration = 0

                for track in elem.findall('.//track'):
                    duration_str = track.find('duration')
                    if duration_str is not None and duration_str.text:
                        d = parse_duration(duration_str.text)
                        if d > 0:
                            duration = d
                            break

                for track in elem.findall('.//track'):
                    url = extract_youtube_url(track)
                    if url:
                        youtube_url = url
                        youtube_id = get_youtube_id(url)
                        break

                if not youtube_id:
                    elem.clear()
                    continue

                if duration > MAX_DURATION_SECONDS:
                    elem.clear()
                    continue

                records.append({
                    'release_id': release_id,
                    'title': title,
                    'artist': artist,
                    'duration': duration,
                    'youtube_id': youtube_id,
                    'youtube_url': youtube_url,
                    'genres': genres,
                    'styles': styles,
                    'country': country,
                    'year': year,
                    'label': label,
                    'catno': catno,
                    'thumb': thumb
                })

                elem.clear()
            except Exception:
                elem.clear()
                continue

    except Exception as e:
        print(f"Chunk {chunk_id} error: {e}")

    return records

def worker_initializer():
    import signal
    signal.signal(signal.SIGINT, signal.SIG_IGN)

def main():
    xml_file = os.getenv('DISCOGS_XML', 'discogs_20240101_releases.xml')

    if not os.path.exists(xml_file):
        print(f"File not found: {xml_file}")
        return

    create_table()

    file_size = os.path.getsize(xml_file)
    num_workers = mp.cpu_count()
    chunk_size = max(file_size // (num_workers * 4), 50_000_000)

    print(f"File: {xml_file} ({file_size / 1024**3:.2f} GB)")
    print(f"Workers: {num_workers}")
    print(f"Chunk size: {chunk_size / 1024**2:.2f} MB")

    tasks = []
    with open(xml_file, 'rb') as f:
        offset = 0
        chunk_id = 0
        while True:
            f.seek(offset)
            chunk_data = f.read(chunk_size)
            if not chunk_data:
                break

            end_tag = chunk_data.rfind(b'</release>')
            if end_tag == -1:
                if len(tasks) > 0:
                    offset += len(chunk_data) - len(b'</release>')
                    continue
                else:
                    offset += len(chunk_data)
                    continue

            actual_chunk = chunk_data[:end_tag + len(b'</release>')]
            tasks.append((actual_chunk, chunk_id))
            offset += end_tag + len(b'</release>')
            chunk_id += 1

            if len(tasks) >= 100:
                break

    print(f"Processing {len(tasks)} chunks...")

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True

    total_inserted = 0
    with Pool(num_workers, initializer=worker_initializer) as pool:
        for batch in range(0, len(tasks), 10):
            batch_tasks = tasks[batch:batch+10]
            results = pool.map(process_chunk, batch_tasks)

            all_records = []
            for records in results:
                all_records.extend(records)

            if all_records:
                cur = conn.cursor()
                execute_batch(cur, """
                    INSERT INTO discogs_samples
                    (release_id, title, artist, duration, youtube_id, youtube_url,
                     genres, styles, country, year, label, catno, thumb)
                    VALUES (%(release_id)s, %(title)s, %(artist)s, %(duration)s,
                            %(youtube_id)s, %(youtube_url)s, %(genres)s, %(styles)s,
                            %(country)s, %(year)s, %(label)s, %(catno)s, %(thumb)s)
                    ON CONFLICT (release_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        youtube_id = EXCLUDED.youtube_id,
                        youtube_url = EXCLUDED.youtube_url,
                        duration = EXCLUDED.duration
                """, all_records)
                total_inserted += len(all_records)
                print(f"Batch {batch//10 + 1}: inserted {len(all_records)} (total: {total_inserted})")

    conn.close()
    print(f"Done! Total inserted: {total_inserted}")

if __name__ == '__main__':
    main()
