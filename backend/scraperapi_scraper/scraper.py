import os
import sys
import time
import requests
import re
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import MAX_VIEW_COUNT, SEARCH_KEYWORDS, SEARCH_DELAY, MAX_RESULTS_PER_KEYWORD, EXCLUDE_KEYWORDS, SCRAPERAPI_KEY
from database import Database
from music_analyzer import MusicAnalyzer


class ScraperAPISamplerScraper:
    def __init__(self):
        self.db = Database()
        self.db.init_table()
        self.analyzer = MusicAnalyzer()
        self.api_key = SCRAPERAPI_KEY
        self.base_url = "http://api.scraperapi.com"

    def _scrape(self, url, params=None):
        payload = {"api_key": self.api_key, "url": url}
        if params:
            payload.update(params)
        try:
            response = requests.get(self.base_url, params=payload, timeout=60)
            if response.status_code == 200:
                return response.text
            else:
                print(f"  ❌ ScraperAPI error: {response.status_code}")
                return None
        except Exception as e:
            print(f"  ❌ Request failed: {e}")
            return None

    def search_youtube(self, keyword, max_results=20):
        search_url = f"https://www.youtube.com/results?search_query={requests.utils.quote(keyword)}"
        html = self._scrape(search_url)
        if not html:
            return []

        videos = []
        pattern = r'"videoId":"([^"]+)"'
        title_pattern = r'"title":"([^"]+)"'
        channel_pattern = r'"ownerEndpoint":{"searchEndpoint":{"query":"([^"]+)"'
        views_pattern = r'"viewCountText":{"simpleText":"([^"]+)"'

        video_ids = re.findall(pattern, html)
        titles = re.findall(r'"title":{"runs":\[{"text":"([^"]+)"', html)
        channels = re.findall(channel_pattern, html)

        seen = set()
        for i, video_id in enumerate(video_ids[:max_results]):
            if video_id in seen:
                continue
            seen.add(video_id)

            title = titles[i] if i < len(titles) else ""
            channel = channels[i] if i < len(channels) else ""

            videos.append({
                "videoId": video_id,
                "title": title,
                "author": channel
            })

        return videos

    def _parse_view_count(self, html):
        patterns = [
            r'"viewCountText":{"simpleText":"([^"]+)"',
            r'"viewCount":"(\d+)',
            r'"views":"([^"]+)"',
            r'ytInitialData","currentVideoViewport":\d+,"viewCount":"([^"]+)"',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                text = match.group(1).replace(",", "").replace(" views", "").replace(", views", "")
                nums = re.findall(r'[\d,]+', text)
                if nums:
                    return int(nums[0].replace(",", ""))
        return 0

    def _parse_duration(self, html):
        patterns = [
            r'"lengthText":{"simpleText":"([^"]+)"',
            r'"lengthSeconds":(\d+)',
            r'duration":"([^"]+)"',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                text = match.group(1)
                if text.isdigit():
                    return int(text)
                parts = re.findall(r'\d+', text)
                if len(parts) == 3:
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                elif len(parts) == 2:
                    return int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 1:
                    return int(parts[0])
        return 0

    def _parse_channel(self, html):
        patterns = [
            r'"ownerEndpoint":{"searchEndpoint":{"query":"([^"]+)"',
            r'"channelName":"([^"]+)"',
            r'"author":"([^"]+)"',
            r'"ownerChannelName":"([^"]+)"',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                return match.group(1)
        return ""

    def get_video_details(self, video_id):
        url = f"https://www.youtube.com/watch?v={video_id}"
        html = self._scrape(url)
        if not html:
            return None

        try:
            return {
                "viewCount": self._parse_view_count(html),
                "lengthSeconds": self._parse_duration(html),
                "author": self._parse_channel(html)
            }
        except Exception:
            return None

    def process_video(self, video, search_keyword=""):
        video_id = video.get("videoId", "")
        title = video.get("title", "")
        channel = video.get("author", "")

        title_lower = title.lower()

        if not video_id:
            return None

        if not title:
            print(f"  🚫 Eksik başlık filtrelendi: '{title}'")
            return False

        if self.db.video_exists(video_id):
            print(f"  ⏭️  Zaten işlendi: {video_id}")
            return None

        if self.analyzer.is_ai_channel(channel):
            print(f"  🤖 AI kanal filtrelendi: {channel}")
            return False

        if "podcast" in title_lower:
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

        if view_count > MAX_VIEW_COUNT:
            print(f"  ❌ View count yüksek: {view_count:,}")
            return False

        print(f"  ✅ Düşük view count: {view_count:,}")

        duration_seconds = details.get("lengthSeconds", 0)

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
            "title": f"{channel} - {title}" if channel else title,
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
        print("🎵 SCRAPERAPI YOUTUBE SCRAPER")
        print("=" * 60)
        print(f"📊 Max view count: {MAX_VIEW_COUNT:,}")
        print(f"🔑 Anahtar kelimeler: {len(SEARCH_KEYWORDS)}")
        print("=" * 60)

        if not self.api_key:
            print("❌ SCRAPERAPI_KEY bulunamadı! .env dosyasına ekleyin.")
            return

        processed_cache = set()
        total_processed = 0
        total_saved = 0

        while True:
            for keyword in SEARCH_KEYWORDS:
                print(f"\n🔍 Aranıyor: '{keyword}'")
                videos = self.search_youtube(keyword, MAX_RESULTS_PER_KEYWORD)
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
    scraper = ScraperAPISamplerScraper()
    scraper.run()