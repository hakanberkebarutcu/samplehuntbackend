import psycopg2

conn = psycopg2.connect(host='localhost', port=5432, database='samplehunt', user='postgres', password='berke')
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM releases WHERE country IS NOT NULL")
print('Records with country:', cur.fetchone()[0])

cur.execute("SELECT country, COUNT(*) FROM releases WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC LIMIT 20")
print('\nTop 20 countries:')
for row in cur:
    print(f"  {row[0]}: {row[1]}")

conn.close()