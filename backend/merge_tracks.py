import json
from datetime import datetime

existing_path = r"C:\Users\PC\myapp\backend\tracks.json"
new_path = r"C:\Users\PC\myapp\backend\tracks_sharks.json"
output_path = r"C:\Users\PC\myapp\backend\tracks.json"

with open(existing_path, 'r', encoding='utf-8') as f:
    existing = json.load(f)

with open(new_path, 'r', encoding='utf-8') as f:
    new_data = json.load(f)

existing_ids = {t['videoId'] for t in existing['tracks']}
new_tracks = [t for t in new_data['tracks'] if t['videoId'] not in existing_ids]

existing['tracks'].extend(new_tracks)
existing['lastUpdated'] = datetime.now().isoformat()

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f"✅ {len(new_tracks)} yeni track eklendi")
print(f"📊 Toplam track sayısı: {len(existing['tracks'])}")