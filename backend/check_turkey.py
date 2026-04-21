import psycopg2

conn = psycopg2.connect(host='localhost', port=5432, database='samplehunt', user='postgres', password='berke')
cur = conn.cursor()

cur.execute("SELECT country, COUNT(*) FROM releases WHERE country IN ('Turkey','Türkiye','TR','US','UK') GROUP BY country")
print('Sample countries:', cur.fetchall())

conn.close()