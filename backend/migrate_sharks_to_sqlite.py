import psycopg2
import sqlite3
import json
from datetime import datetime

POSTGRES_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "sample_hunt",
    "user": "postgres",
    "password": "postgres"
}

SQLITE_PATH = r"C:\Users\PC\myapp\backend\sample_hunt.db"

def migrate():
    print("=" * 60)
    print("PostgreSQL -> SQLite Migration")
    print("=" * 60)

    print("\n[1] Connecting to PostgreSQL...")
    conn_pg = psycopg2.connect(**POSTGRES_CONFIG)
    cur_pg = conn_pg.cursor()
    
    cur_pg.execute("SELECT COUNT(*) FROM sharks")
    pg_count = cur_pg.fetchone()[0]
    print(f"   PostgreSQL has {pg_count:,} tracks")
    
    print("[2] Connecting to SQLite...")
    conn_sqlite = sqlite3.connect(SQLITE_PATH)
    cur_sqlite = conn_sqlite.cursor()
    
    cur_sqlite.execute("SELECT COUNT(*) FROM tracks")
    sqlite_count = cur_sqlite.fetchone()[0]
    print(f"   SQLite has {sqlite_count:,} tracks")
    
    print("[3] Fetching tracks from PostgreSQL...")
    cur_pg.execute("""
        SELECT video_id, title, url, bpm, key, view_count, genre, country, created_at
        FROM sharks
    """)
    
    tracks = []
    for row in cur_pg.fetchall():
        video_id, title, url, bpm, key, view_count, genre, country, created_at = row
        
        artist = ""
        if title and " - " in title:
            parts = title.split(" - ", 1)
            artist = parts[0].strip()
            title = parts[1].strip() if len(parts) > 1 else title
        
        duration = ""
        sample_points = "[]"
        producer_note = "Bu parca sample olarak kullanilabilecek niteliklere sahip."
        
        tracks.append({
            "videoId": video_id,
            "title": title,
            "artist": artist,
            "channelName": "",
            "year": None,
            "viewCount": view_count or 0,
            "duration": duration,
            "bpm": bpm,
            "key": key,
            "mood": "chill",
            "genre": json.dumps([genre] if genre else []),
            "country": country or "",
            "tags": "[]",
            "copyright": "All Rights Reserved",
            "samplePoints": sample_points,
            "producerNote": producer_note,
            "addedAt": created_at.isoformat() if created_at else datetime.now().isoformat()
        })
    
    print(f"   {len(tracks):,} tracks fetched")
    
    print("[4] Writing to SQLite...")
    
    existing_ids = set()
    cur_sqlite.execute("SELECT videoId FROM tracks")
    for row in cur_sqlite.fetchall():
        existing_ids.add(row[0])
    
    print(f"   Existing videoIds: {len(existing_ids):,}")
    
    inserted = 0
    skipped = 0
    
    for track in tracks:
        if track["videoId"] in existing_ids:
            skipped += 1
            continue
        
        cur_sqlite.execute("""
            INSERT OR IGNORE INTO tracks 
            (videoId, title, artist, channelName, year, viewCount, duration, bpm, key, mood, genre, country, tags, copyright, samplePoints, producerNote, addedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            track["videoId"],
            track["title"],
            track["artist"],
            track["channelName"],
            track["year"],
            track["viewCount"],
            track["duration"],
            track["bpm"],
            track["key"],
            track["mood"],
            track["genre"],
            track["country"],
            track["tags"],
            track["copyright"],
            track["samplePoints"],
            track["producerNote"],
            track["addedAt"]
        ))
        inserted += 1
    
    conn_sqlite.commit()
    
    print(f"   New inserted: {inserted:,}")
    print(f"   Skipped (existing): {skipped:,}")
    
    cur_sqlite.execute("SELECT COUNT(*) FROM tracks")
    final_count = cur_sqlite.fetchone()[0]
    print(f"\n[5] SQLite total: {final_count:,} tracks")
    
    cur_pg.close()
    conn_pg.close()
    conn_sqlite.close()
    
    print("\n" + "=" * 60)
    print("Migration completed!")
    print("=" * 60)

if __name__ == "__main__":
    migrate()