import os
import sys
import time
import json
from datetime import datetime, timedelta, timezone

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import MAX_VIEW_COUNT, SEARCH_KEYWORDS, SEARCH_DELAY, MAX_RESULTS_PER_KEYWORD, EXCLUDE_KEYWORDS
from database import Database
from music_analyzer import MusicAnalyzer

class YouTubeSamplerScraper:
    def __init__(self):
        self.db = Database()
        self.db.init_table()
        self.analyzer = MusicAnalyzer()
        self.invidious_instances = [
            "https://invidious.nerdvpn.de",
            "https://yt.artemislena.eu",
            "https://invidious.projectsegfau.lt",
            "https://yewtu.be",
            "https://vid.priv.au",
            "https://invidious.esmail.xyz",
        ]
        self.current_instance = 0

    def _get_instance(self):
        return self.invidious_instances[self.current_instance]

    def _rotate_instance(self):
        self.current_instance = (self.current_instance + 1) % len(self.invidious_instances)
        print(f"  🔄 Invidious instance değiştirildi: {self._get_instance()}")

    def search_videos(self, keyword, max_results=50, published_after=None):
        videos = []
        params = {
            "q": keyword,
            "type": "video",
            "maxResults": min(max_results, 50),
        }

        if published_after:
            params["publishedAfter"] = published_after

        for _ in range(3):
            try:
                base_url = f"{self._get_instance()}/api/v1/search"
                response = requests.get(base_url, params=params, timeout=30)
                response.raise_for_status()

                text = response.text.strip()
                if not text or text[0] not in ('{', '['):
                    raise Exception(f"Geçersiz yanıt: {text[:100] if text else 'bos'}")

                items = json.loads(text)

                if isinstance(items, dict) and "error" in items:
                    raise Exception(items["error"])

                for item in items:
                    video_id = item.get("videoId") or item.get("id", "").split(":")[-1]
                    if not video_id or len(video_id) < 5:
                        continue
                    videos.append({
                        "video_id": video_id,
                        "title": item.get("title", ""),
                        "channel": item.get("author", "")
                    })

                return videos

            except Exception as e:
                print(f"  ⚠️  Instance hatası: {e}")
                self._rotate_instance()
                time.sleep(5)

        print(f"  ❌ Tüm instance'lar başarısız")
        return videos

    def get_video_stats(self, video_id):
        for _ in range(3):
            try:
                base_url = f"{self._get_instance()}/api/v1/videos/{video_id}"
                params = {"fields": "title,author,viewCount,duration"}
                response = requests.get(base_url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()

                if isinstance(data, dict) and "error" in data:
                    raise Exception(data["error"])

                duration_str = data.get("duration", "0:00")
                parts = duration_str.split(":")
                if len(parts) == 3:
                    duration_seconds = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                elif len(parts) == 2:
                    duration_seconds = int(parts[0]) * 60 + int(parts[1])
                else:
                    duration_seconds = int(parts[0])

                return {
                    "video_id": video_id,
                    "title": data.get("title", ""),
                    "channel": data.get("author", ""),
                    "view_count": int(data.get("viewCount", 0)),
                    "duration_seconds": duration_seconds
                }

            except Exception as e:
                print(f"  ⚠️  Stats hatası: {e}")
                self._rotate_instance()
                time.sleep(1)

        return None

    def process_video(self, video_info, search_keyword=""):
        video_id = video_info["video_id"]
        title_lower = video_info["title"].lower()
        channel = video_info["channel"]

        if self.db.video_exists(video_id):
            print(f"  ⏭️  Zaten işlendi: {video_id}")
            return None

        if self.analyzer.is_ai_channel(channel):
            print(f"  🤖 AI kanal filtrelendi: {channel}")
            return False

        for exclude in EXCLUDE_KEYWORDS:
            if exclude.lower() in title_lower:
                print(f"  🚫 Filtrelendi: {video_info['title'][:50]}...")
                return False

        print(f"  🔍 İşleniyor: {video_info['title'][:50]}...")
        stats = self.get_video_stats(video_id)
        if not stats:
            print(f"  ❌ Video bulunamadı")
            return False

        if stats["view_count"] > MAX_VIEW_COUNT:
            print(f"  ❌ View count yüksek: {stats['view_count']:,}")
            return False

        print(f"  ✅ Düşük view count: {stats['view_count']:,}")

        if stats["duration_seconds"] > 900:
            print(f"  ❌ 15 dk üstü: {stats['duration_seconds'] // 60} dk")
            return False

        genre = self.analyzer.detect_genre(
            stats["title"],
            stats["channel"],
            search_keyword=search_keyword
        )
        country = self.analyzer.detect_country(stats["title"], stats["channel"])

        data = {
            "video_id": video_id,
            "title": f"{channel} - {stats['title']}",
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "bpm": None,
            "key": None,
            "view_count": stats["view_count"],
            "genre": genre,
            "country": country
        }

        self.db.insert_track(data)
        print(f"  💾 Kaydedildi: {genre} | {country}")
        return True

    def run(self):
        print("=" * 60)
        print("🎵 YOUTUBE SAMPLER SCRAPER (Invidious)")
        print("=" * 60)
        print(f"📊 Max view count: {MAX_VIEW_COUNT:,}")
        print(f"🔑 Anahtar kelimeler: {len(SEARCH_KEYWORDS)}")
        print(f"🌐 Instance: {self._get_instance()}")
        print("=" * 60)

        processed_cache = set()
        published_after = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

        total_processed = 0
        total_saved = 0

        while True:
            for keyword in SEARCH_KEYWORDS:
                print(f"\n🔍 Aranıyor: '{keyword}'")
                videos = self.search_videos(keyword, MAX_RESULTS_PER_KEYWORD, published_after)
                print(f"   Bulunan: {len(videos)} video")

                for video in videos:
                    if video["video_id"] in processed_cache:
                        print(f"  ⏭️  Bu seansda işlendi: {video['video_id']}")
                        continue
                    processed_cache.add(video["video_id"])

                    total_processed += 1
                    result = self.process_video(video, search_keyword=keyword)
                    if result is True:
                        total_saved += 1

                    time.sleep(SEARCH_DELAY)

                print(f"\n📈 Şu ana kadar: {total_processed} işlendi, {total_saved} kaydedildi")

            print(f"\n⏳ {SEARCH_DELAY * 2} saniye bekleniyor...")
            time.sleep(SEARCH_DELAY * 2)

if __name__ == "__main__":
    scraper = YouTubeSamplerScraper()
    scraper.run()