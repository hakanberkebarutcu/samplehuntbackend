import os
import sys
import time
import json
from datetime import datetime, timedelta, timezone

from googleapiclient.discovery import build

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import YOUTUBE_API_KEY, MAX_VIEW_COUNT, SEARCH_KEYWORDS, SEARCH_DELAY, MAX_RESULTS_PER_KEYWORD, EXCLUDE_KEYWORDS
from database import Database
from music_analyzer import MusicAnalyzer

class YouTubeSamplerScraper:
    def __init__(self):
        self.youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
        self.db = Database()
        self.db.init_table()
        self.analyzer = MusicAnalyzer()

    def search_videos(self, keyword, max_results=50, published_after=None):
        videos = []
        next_page_token = None

        for _ in range(1):
            request = self.youtube.search().list(
                part="snippet",
                q=keyword,
                type="video",
                videoDefinition="any",
                videoDuration="medium",
                maxResults=min(max_results, 50),
                pageToken=next_page_token,
                publishedAfter=published_after
            )
            response = request.execute()

            for item in response.get("items", []):
                video_id = item["id"]["videoId"]
                title = item["snippet"]["title"]
                channel = item["snippet"]["channelTitle"]
                videos.append({
                    "video_id": video_id,
                    "title": title,
                    "channel": channel
                })

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

        return videos

    def get_video_stats(self, video_id):
        request = self.youtube.videos().list(
            part="statistics,snippet,contentDetails",
            id=video_id
        )
        response = request.execute()
        if not response.get("items"):
            return None

        item = response["items"][0]
        stats = item["statistics"]
        snippet = item["snippet"]
        content_details = item["contentDetails"]

        import re
        duration_str = content_details.get("duration", "PT0S")
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
        duration_seconds = 0
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            seconds = int(match.group(3) or 0)
            duration_seconds = hours * 3600 + minutes * 60 + seconds

        view_count = int(stats.get("viewCount", 0))
        return {
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "channel": snippet.get("channelTitle", ""),
            "view_count": view_count,
            "duration_seconds": duration_seconds
        }

    def process_video(self, video_info, search_keyword=""):
        video_id = video_info["video_id"]
        title_lower = video_info["title"].lower()
        channel = video_info["channel"]

        # ── Daha önce işlendi mi? ──────────────────────────────────────────
        if self.db.video_exists(video_id):
            print(f"  ⏭️  Zaten işlendi: {video_id}")
            return None

        # ── AI kanal filtresi ─────────────────────────────────────────────
        if self.analyzer.is_ai_channel(channel):
            print(f"  🤖 AI kanal filtrelendi: {channel}")
            return False

        # ── Podcast filtresi ─────────────────────────────────────────────
        channel_lower = channel.lower()
        if "podcast" in channel_lower or "podcast" in title_lower:
            print(f"  🎙️ Podcast filtrelendi: {video_info['title'][:50]}...")
            return False

        # ── Vibe filtresi ────────────────────────────────────────────────
        if "vibe" in title_lower or "vibes" in title_lower:
            print(f"  🌊 Vibe içerik filtrelendi: {video_info['title'][:50]}...")
            return False

        # ── Uzun isim filtresi (gereksiz karakterler) ─────────────────────
        if len(video_info["title"]) > 100:
            print(f"  📏 Çok uzun başlık filtrelendi: {video_info['title'][:50]}...")
            return False

        # ── Topic kanal önceliği ──────────────────────────────────────────
        is_topic_channel = "topic" in channel_lower

        # ── Başlık/exclude keyword filtresi ──────────────────────────────
        for exclude in EXCLUDE_KEYWORDS:
            if exclude.lower() in title_lower:
                print(f"  🚫 Filtrelendi: {video_info['title'][:50]}...")
                return False

        print(f"  🔍 İşleniyor: {video_info['title'][:50]}...")
        stats = self.get_video_stats(video_id)
        if not stats:
            print(f"  ❌ Video bulunamadı")
            return False

        # ── Görüntülenme sayısı ──────────────────────────────────────────
        if stats["view_count"] > MAX_VIEW_COUNT:
            print(f"  ❌ View count yüksek: {stats['view_count']:,}")
            return False

        print(f"  ✅ Düşük view count: {stats['view_count']:,}")

        # ── Süre filtresi ────────────────────────────────────────────────
        if stats["duration_seconds"] > 900:
            print(f"  ❌ 15 dk üstü: {stats['duration_seconds'] // 60} dk")
            return False

        # ── Tür ve ülke tespiti ──────────────────────────────────────────
        genre = self.analyzer.detect_genre(
            stats["title"],
            stats["channel"],
            search_keyword=search_keyword      # ← arama keyword'ü de geçiliyor
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
        print("🎵 YOUTUBE SAMPLER SCRAPER")
        print("=" * 60)
        print(f"📊 Max view count: {MAX_VIEW_COUNT:,}")
        print(f"🔑 Anahtar kelimeler: {len(SEARCH_KEYWORDS)}")
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

                # Topic kanalları önce işle (öncelik sırası)
                topic_videos = [v for v in videos if "topic" in v["channel"].lower()]
                other_videos = [v for v in videos if "topic" not in v["channel"].lower()]
                ordered_videos = topic_videos + other_videos

                for video in ordered_videos:
                    if video["video_id"] in processed_cache:
                        print(f"  ⏭️  Bu seansda işlendi: {video['video_id']}")
                        continue
                    processed_cache.add(video["video_id"])

                    is_topic = "topic" in video["channel"].lower()
                    if is_topic:
                        print(f"  ⭐ Topic kanal önceliği: {video['channel']}")

                    total_processed += 1
                    result = self.process_video(video, search_keyword=keyword)  # ← keyword geçiliyor
                    if result is True:
                        total_saved += 1

                    time.sleep(SEARCH_DELAY)

                print(f"\n📈 Şu ana kadar: {total_processed} işlendi, {total_saved} kaydedildi")

            print(f"\n⏳ {SEARCH_DELAY * 2} saniye bekleniyor...")
            time.sleep(SEARCH_DELAY * 2)

if __name__ == "__main__":
    scraper = YouTubeSamplerScraper()
    scraper.run()
