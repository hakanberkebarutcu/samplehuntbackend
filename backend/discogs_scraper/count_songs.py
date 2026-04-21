import psycopg2

try:
    conn = psycopg2.connect(host='localhost', port=5432, database='samplehunt', user='postgres', password='berke')
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM sharks')
    count = cur.fetchone()[0]
    print(f"Toplam sarki sayisi: {count}")
    conn.close()
except Exception as e:
    print(f"Hata: {e}")