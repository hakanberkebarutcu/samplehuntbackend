import gzip
import os
import sys
from lxml import etree
import psycopg2
from psycopg2.extras import execute_batch

RELEASES_XML = r"D:\Discogs 2008\discogs_20260401_releases.xml.gz"
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "samplehunt"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "berke")
}
BATCH_SIZE = 5000

def get_youtube_id(url):
    if not url:
        return None
    import re
    match = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})', url)
    return match.group(1) if match else None

def process_release(elem):
    try:
        discogs_id = elem.get('id')
        if not discogs_id:
            return None
        discogs_id = int(discogs_id)

        country_elem = elem.find('country')
        country = country_elem.text if country_elem is not None and country_elem.text else None

        if not country:
            return None

        return {
            'discogs_id': discogs_id,
            'country': country
        }
    except Exception:
        return None

def main():
    if not os.path.exists(RELEASES_XML):
        print(f"File not found: {RELEASES_XML}")
        sys.exit(1)

    print(f"Reading: {RELEASES_XML}")
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
                        UPDATE releases SET country = %(country)s
                        WHERE discogs_id = %(discogs_id)s AND country IS NULL
                    """, buffer, BATCH_SIZE)
                    total += len(buffer)
                    print(f"+{len(buffer)} records updated (total: {total})")
                    sys.stdout.flush()
                    buffer = []

    if buffer:
        execute_batch(cur, """
            UPDATE releases SET country = %(country)s
            WHERE discogs_id = %(discogs_id)s AND country IS NULL
        """, buffer, BATCH_SIZE)
        total += len(buffer)
        print(f"+{len(buffer)} records updated (total: {total})")

    conn.close()
    print(f"Done! Total records updated: {total}")

if __name__ == '__main__':
    main()