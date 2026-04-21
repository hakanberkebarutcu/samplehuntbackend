import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="samplehunt",
    user="postgres",
    password="berke"
)
cur = conn.cursor()
cur.execute("DELETE FROM sharks WHERE video_id LIKE 'discogs_%%'")
conn.commit()
print(f"Silinen: {cur.rowcount}")
conn.close()