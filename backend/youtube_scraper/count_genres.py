import sys
sys.path.insert(0, r'C:\Users\PC\myapp\backend\youtube_scraper')
from database import Database
import psycopg2

db = Database()
with db.conn.cursor() as cur:
    cur.execute("SELECT genre, COUNT(*) FROM sharks GROUP BY genre ORDER BY COUNT(*) DESC")
    for row in cur.fetchall():
        print(f"{row[0]}: {row[1]}")