from database import Database
db = Database()
tracks = db.get_all()
print(f'Toplam: {len(tracks)} sarki\n')

genres = {}
for t in tracks:
    genre = t[6] or 'Bilinmeyen'
    genres[genre] = genres.get(genre, 0) + 1

print('=== GENRELERE GORE ===')
for g, c in sorted(genres.items(), key=lambda x: -x[1]):
    print(f'{g}: {c}')

print('\n=== SON 10 SARKI ===')
for t in tracks[:10]:
    print(f'{t[1][:60]}... | {t[6]} | {t[7]}')