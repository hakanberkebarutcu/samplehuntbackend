import os
import sys
import time
import requests
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import MAX_VIEW_COUNT, SEARCH_KEYWORDS, SEARCH_DELAY, MAX_RESULTS_PER_KEYWORD, EXCLUDE_KEYWORDS
from database import Database
from music_analyzer import MusicAnalyzer


class InvidiousSamplerScraper:
    INVIDIOUS_INSTANCES = [
        "https://yewtu.be",
        "https://invidious.snopyta.org",
        "https://vid.privacytools.io",
        "https://invidious.kavin.rocks",
        "https://invidious.privacy.gg",
    ]

    def __init__(self):
        self.db = Database()
        self.db.init_table()
        self.analyzer = MusicAnalyzer()
        self.current_invidious = 0

    def _get_invidious_url(self):
        return self.INVIDIOUS_INSTANCES[self.current_invidious % len(self.INVIDIOUS_INSTANCES)]

    def _switch_invidious(self):
        self.current_invidious += 1
        print(f"  🔄 Invidious değiştiriliyor...")

    def search_videos(self, keyword, max_results=20):
        for attempt in range(len(self.INVIDIOUS_INSTANCES)):
            try:
                url = f"{self._get_invidious_url()}/api/v1/search"
                params = {
                    "q": keyword,
                    "type": "video",
                    "count": max_results,
                    "sort_by": "relevance"
                }
                response = requests.get(url, params=params, timeout=15)
                if response.status_code == 200:
                    results = response.json()
                    if results and isinstance(results, list):
                        return results
                else:
                    self._switch_invidious()
            except Exception:
                self._switch_invidious()
        return []

    def get_video_details(self, video_id):
        for attempt in range(len(self.INVIDIOUS_INSTANCES)):
            try:
                url = f"{self._get_invidious_url()}/api/v1/videos/{video_id}"
                response = requests.get(url, timeout=15)
                if response.status_code == 200:
                    return response.json()
                else:
                    self._switch_invidious()
            except Exception:
                self._switch_invidious()
        return None

    def process_video(self, video, search_keyword=""):
        video_id = video.get("videoId", "")
        title = video.get("title", "")
        channel = video.get("author", "")

        title_lower = title.lower()
        channel_lower = channel.lower()

        if not video_id:
            return None

        if self.db.video_exists(video_id):
            print(f"  ⏭️  Zaten işlendi: {video_id}")
            return None

        if self.analyzer.is_ai_channel(channel):
            print(f"  🤖 AI kanal filtrelendi: {channel}")
            return False

        if "podcast" in channel_lower or "podcast" in title_lower:
            print(f"  🎙️ Podcast filtrelendi: {title[:50]}...")
            return False

        if "vibe" in title_lower or "vibes" in title_lower:
            print(f"  🌊 Vibe içerik filtrelendi: {title[:50]}...")
            return False

        if len(title) > 100:
            print(f"  📏 Çok uzun başlık filtrelendi: {title[:50]}...")
            return False

        is_topic_channel = "topic" in channel_lower

        for exclude in EXCLUDE_KEYWORDS:
            if exclude.lower() in title_lower:
                print(f"  🚫 Filtrelendi: {title[:50]}...")
                return False

        print(f"  🔍 İşleniyor: {title[:50]}...")

        details = self.get_video_details(video_id)
        if not details:
            print(f"  ❌ Video bulunamadı")
            return False

        view_count = details.get("viewCount", 0)
        if isinstance(view_count, str):
            view_count = int(view_count)

        if view_count > MAX_VIEW_COUNT:
            print(f"  ❌ View count yüksek: {view_count:,}")
            return False

        print(f"  ✅ Düşük view count: {view_count:,}")

        duration_seconds = details.get("lengthSeconds", 0)
        if isinstance(duration_seconds, str):
            duration_seconds = int(duration_seconds)

        if duration_seconds > 900:
            print(f"  ❌ 15 dk üstü: {duration_seconds // 60} dk")
            return False

        genre = self.analyzer.detect_genre(
            title,
            channel,
            search_keyword=search_keyword
        )
        country = self.analyzer.detect_country(title, channel)

        data = {
            "video_id": video_id,
            "title": f"{channel} - {title}",
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "bpm": None,
            "key": None,
            "view_count": view_count,
            "genre": genre,
            "country": country
        }

        self.db.insert_track(data)
        print(f"  💾 Kaydedildi: {genre} | {country}")
        return True

    def run(self):
        print("=" * 60)
        print("🎵 INVIDIOUS SAMPLER SCRAPER")
        print("=" * 60)
        print(f"📊 Max view count: {MAX_VIEW_COUNT:,}")
        print(f"🔑 Anahtar kelimeler: {len(SEARCH_KEYWORDS)}")
        print("=" * 60)

        processed_cache = set()
        total_processed = 0
        total_saved = 0

        while True:
            for keyword in SEARCH_KEYWORDS:
                print(f"\n🔍 Aranıyor: '{keyword}'")
                videos = self.search_videos(keyword, MAX_RESULTS_PER_KEYWORD)
                print(f"   Bulunan: {len(videos)} video")

                topic_videos = [v for v in videos if "topic" in v.get("author", "").lower()]
                other_videos = [v for v in videos if "topic" not in v.get("author", "").lower()]
                ordered_videos = topic_videos + other_videos

                for video in ordered_videos:
                    video_id = video.get("videoId", "")
                    if not video_id:
                        continue

                    if video_id in processed_cache:
                        print(f"  ⏭️  Bu seansda işlendi: {video_id}")
                        continue
                    processed_cache.add(video_id)

                    is_topic = "topic" in video.get("author", "").lower()
                    if is_topic:
                        print(f"  ⭐ Topic kanal önceliği: {video.get('author', '')}")

                    total_processed += 1
                    result = self.process_video(video, search_keyword=keyword)

                    if result is True:
                        total_saved += 1

                    time.sleep(SEARCH_DELAY)

                print(f"\n📈 Şu ana kadar: {total_processed} işlendi, {total_saved} kaydedildi")

            print(f"\n⏳ {SEARCH_DELAY * 2} saniye bekleniyor...")
            time.sleep(SEARCH_DELAY * 2)


if __name__ == "__main__":
    scraper = InvidiousSamplerScraper()
    scraper.run()