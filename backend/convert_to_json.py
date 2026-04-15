import csv
import json
from datetime import datetime

csv_path = r"C:\Users\PC\Desktop\sharks.csv"
json_path = r"C:\Users\PC\myapp\backend\tracks_sharks.json"

tracks = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        genre_value = row.get('genre', '') or ""
        country_value = row.get('country', '') or ""

        genre_list = [g.strip() for g in genre_value.split(",") if g.strip()] if genre_value else []

        track = {
            "videoId": row['video_id'],
            "title": row['title'],
            "artist": "",
            "channelName": "",
            "year": None,
            "viewCount": int(row['view_count']) if row.get('view_count') else 0,
            "duration": "",
            "bpm": None,
            "key": "",
            "mood": "",
            "genre": genre_list,
            "style": genre_list,
            "country": country_value,
            "tags": genre_list,
            "copyright": "All Rights Reserved",
            "samplePoints": [],
            "producerNote": f"Rare track from YouTube. Low view count: {row.get('view_count', 'N/A')}"
        }
        tracks.append(track)

output = {
    "lastUpdated": datetime.now().isoformat(),
    "tracks": tracks
}

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ {len(tracks)} track '{json_path}' dosyasına kaydedildi")
print(f"📁 Dosya konumu: {json_path}")