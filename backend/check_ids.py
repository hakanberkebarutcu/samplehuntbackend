import psycopg2

conn = psycopg2.connect(host='localhost', port=5432, database='samplehunt', user='postgres', password='berke')
cur = conn.cursor()

cur.execute('SELECT id, discogs_id, title FROM releases LIMIT 10')
for row in cur:
    print(row)

conn.close()