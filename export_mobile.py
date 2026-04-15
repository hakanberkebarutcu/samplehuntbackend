import csv
import json

csv_path = r"C:\Users\PC\myapp\mobile_tracks.csv"
json_path = r"C:\Users\PC\myapp\mobile_tracks.json"

tracks = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        genre_value = row.get('genre', '') or "Unknown"
        genre_list = [g.strip() for g in genre_value.split(",") if g.strip()] if genre_value else ["Unknown"]
        
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
            "country": row.get('country', 'Unknown'),
            "tags": genre_list,
            "copyright": "All Rights Reserved",
            "samplePoints": [],
            "producerNote": f"Rare track from YouTube. View count: {row.get('view_count', 'N/A')}"
        }
        tracks.append(track)

output = {
    "lastUpdated": "2026-04-14T00:00:00.000Z",
    "tracks": tracks
}

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"[OK] {len(tracks)} track exported to {json_path}")