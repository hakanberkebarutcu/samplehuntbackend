import psycopg2
from psycopg2.extras import execute_batch
from config import DB_CONFIG

class Database:
    def __init__(self):
        self.conn = None
        self.connect()

    def connect(self):
        try:
            if self.conn and not self.conn.closed:
                return
        except Exception:
            pass
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.conn.autocommit = True

    def _ensure_connection(self):
        try:
            with self.conn.cursor() as cur:
                cur.execute("SELECT 1")
        except Exception:
            self.conn = None
            self.connect()

    def init_table(self):
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sharks (
                    id SERIAL PRIMARY KEY,
                    video_id VARCHAR(20) UNIQUE NOT NULL,
                    title VARCHAR(500),
                    url VARCHAR(100),
                    bpm INTEGER,
                    key VARCHAR(10),
                    view_count INTEGER DEFAULT 0,
                    genre VARCHAR(100),
                    country VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sharks_video_id ON sharks(video_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sharks_view_count ON sharks(view_count)")

    def video_exists(self, video_id):
        self._ensure_connection()
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM sharks WHERE video_id = %s", (video_id,))
            return cur.fetchone() is not None

    def insert_track(self, data):
        self._ensure_connection()
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sharks (video_id, title, url, bpm, key, view_count, genre, country)
                VALUES (%(video_id)s, %(title)s, %(url)s, %(bpm)s, %(key)s, %(view_count)s, %(genre)s, %(country)s)
                ON CONFLICT (video_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    view_count = EXCLUDED.view_count,
                    bpm = EXCLUDED.bpm,
                    key = EXCLUDED.key,
                    genre = EXCLUDED.genre,
                    country = EXCLUDED.country
            """, data)

    def get_all(self):
        self._ensure_connection()
        with self.conn.cursor() as cur:
            cur.execute("SELECT video_id, title, url, bpm, key, view_count, genre, country FROM sharks ORDER BY created_at DESC")
            return cur.fetchall()

    def close(self):
        if self.conn:
            self.conn.close()