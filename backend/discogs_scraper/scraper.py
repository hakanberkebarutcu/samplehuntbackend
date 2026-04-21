import os
import sys
import time
import requests
import re
import json
import random
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from config import DISCOGS_API_KEY, DISCOGS_USER_AGENT, MAX_MINUTES, SEARCH_KEYWORDS, SEARCH_DELAY, MAX_RESULTS_PER_KEYWORD, EXCLUDE_KEYWORDS
from database import Database
from music_analyzer import MusicAnalyzer

SCRAPERAPI_KEY = os.getenv("SCRAPERAPI_KEY", "")


class DiscogsSamplerScraper:
    def __init__(self):
        self.db = Database()
        self.db.init_table()
        self.analyzer = MusicAnalyzer()
        self.api_key = SCRAPERAPI_KEY
        self.base_url = "http://api.scraperapi.com"
        self.headers = {
            "User-Agent": DISCOGS_USER_AGENT,
            "Accept": "application/json",
            "Authorization": f"Discogs token={DISCOGS_API_KEY}"
        }
        self.params = {
            "type": "release",
            "per_page": MAX_RESULTS_PER_KEYWORD
        }

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

    def search_youtube(self, query, max_results=3):
        search_url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}&sp=EgQIAhAB"
        html = self._scrape(search_url)
        if not html:
            return []

        video_ids = re.findall(r'"videoId":"([^"]+)"', html)
        titles = re.findall(r'"title":{"runs":\[{"text":"([^"]+)"', html)
        channels = re.findall(r'"ownerEndpoint":{"searchEndpoint":{"query":"([^"]+)"', html)
        durations = re.findall(r'"lengthText":{"runs":\[{"text":"([^"]+)"', html)

        def parse_duration(dur_str):
            if not dur_str:
                return 0
            parts = dur_str.split(":")
            if len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
            elif len(parts) == 3:
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            return 0

        MAX_YOUTUBE_SECONDS = 10 * 60

        seen = set()
        results = []
        for i, video_id in enumerate(video_ids[:max_results]):
            if video_id in seen:
                continue
            seen.add(video_id)
            title = titles[i] if i < len(titles) else ""
            channel = channels[i] if i < len(channels) else ""
            duration = durations[i] if i < len(durations) else ""
            duration_secs = parse_duration(duration)
            if duration_secs > MAX_YOUTUBE_SECONDS:
                continue
            if title:
                results.append({
                    "videoId": video_id,
                    "title": title,
                    "author": channel
                })
        return results

    def search_releases(self, keyword, page=None):
        url = "https://api.discogs.com/database/search"
        all_results = []

        first_page = 1
        try:
            response = requests.get(url, headers=self.headers, params={"type": "release", "per_page": 1, "q": keyword, "page": 1}, timeout=30)
            if response.status_code == 200:
                data = response.json()
                pagination = data.get("pagination", {})
                total_pages = pagination.get("pages", 1)
                first_page = random.randint(1, max(1, min(10, total_pages)))
        except:
            pass

        for current_page in range(first_page, first_page + 5):
            params = {"type": "release", "per_page": MAX_RESULTS_PER_KEYWORD, "q": keyword, "page": current_page}

            try:
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    all_results.extend(results)

                    pagination = data.get("pagination", {})
                    total_pages = pagination.get("pages", 1)

                    if current_page >= total_pages:
                        break
                elif response.status_code == 429:
                    print(f"  ⏳ Rate limited, waiting {SEARCH_DELAY * 3}s...")
                    time.sleep(SEARCH_DELAY * 3)
                    break
                else:
                    print(f"  ❌ API error: {response.status_code}")
                    break
            except Exception as e:
                print(f"  ❌ Request failed: {e}")
                break

        return all_results

    def get_release_details(self, release_id):
        url = f"https://api.discogs.com/releases/{release_id}"
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception:
            return None

    def process_release(self, release, search_keyword=""):
        release_id = str(release.get("id", ""))
        title = release.get("title", "")
        country = release.get("country", "")
        year = release.get("year", "")
        genre_list = release.get("genre", [])
        style_list = release.get("style", [])
        label = release.get("label", "")

        title_lower = title.lower()
        label_str = ", ".join(label) if isinstance(label, list) else str(label) if label else ""

        if not release_id:
            return None

        discogs_video_id = f"discogs_{release_id}"
        if self.db.release_exists(release_id):
            print(f"  ⏭️  Zaten işlendi: {release_id}")
            return None

        if self.analyzer.is_ai_channel(title):
            print(f"  🤖 AI içerik filtrelendi: {title[:50]}...")
            return False

        channel_lower = label_str.lower() if label_str else ""
        if "podcast" in channel_lower or "podcast" in title_lower:
            print(f"  🎙️ Podcast filtrelendi: {title[:50]}...")
            return False

        if "vibe" in title_lower or "vibes" in title_lower:
            print(f"  🌊 Vibe içerik filtrelendi: {title[:50]}...")
            return False

        if len(title) > 150:
            print(f"  📏 Çok uzun başlık filtrelendi: {title[:50]}...")
            return False

        genre_str = ", ".join(genre_list) if genre_list else ""
        style_str = ", ".join(style_list) if style_list else ""
        full_text = f"{title} {genre_str} {style_str} {label_str}".lower()

        for exclude in EXCLUDE_KEYWORDS:
            if exclude.lower() in full_text:
                print(f"  🚫 Filtrelendi: {title[:50]}...")
                return False

        print(f"  🔍 İşleniyor: {title[:50]}...")

        details = self.get_release_details(release_id)
        if not details:
            print(f"  ❌ Release bulunamadı")
            return False

        tracklist = details.get("tracklist", [])
        total_duration = 0
        for track in tracklist:
            duration = track.get("duration", "")
            if duration:
                parts = duration.split(":")
                if len(parts) == 2:
                    total_duration += int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 3:
                    total_duration += int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

        if total_duration > MAX_MINUTES * 60:
            print(f"  ❌ {MAX_MINUTES} dk üstü: {total_duration // 60} dk")
            return False

        genre = self.analyzer.detect_genre(
            title,
            f"{genre_str} {style_str}",
            search_keyword=search_keyword
        )

        detected_country = self.analyzer.detect_country(title, label_str)
        if country:
            detected_country = country

        artist_name = ""
        if details:
            artists = details.get("artists", [])
            if artists:
                artist_name = artists[0].get("name", "")

        best_youtube = None
        best_title = title

        for track in tracklist[:5]:
            track_title = track.get("title", "")
            if not track_title or len(track_title) < 3:
                continue

            track_position = track.get("position", "")
            search_query = f"{track_title} {year}" if year else track_title

            print(f"  🔎 YouTube'da aranıyor: {track_title[:40]}...")
            youtube_results = self.search_youtube(search_query)

            if youtube_results:
                video = youtube_results[0]
                video_id = video.get("videoId", "")
                if video_id:
                    best_youtube = f"https://www.youtube.com/watch?v={video_id}"
                    if artist_name:
                        best_title = f"{artist_name} - {track_title}"
                    else:
                        best_title = track_title
                    print(f"  ✅ YouTube bulundu: {video_id}")
                    break

            time.sleep(1)

        if best_youtube:
            youtube_id = video_id if video_id else f"discogs_{release_id}"
            data = {
                "video_id": youtube_id,
                "title": best_title,
                "url": best_youtube,
                "bpm": None,
                "key": None,
                "view_count": 0,
                "genre": genre,
                "country": detected_country
            }
        else:
            video_id = None
            if artist_name:
                final_title = f"{artist_name} - {title}"
            else:
                final_title = title
            data = {
                "video_id": f"discogs_{release_id}",
                "title": final_title,
                "url": f"https://www.discogs.com/release/{release_id}",
                "bpm": None,
                "key": None,
                "view_count": 0,
                "genre": genre,
                "country": detected_country
            }

        self.db.insert_track(data)
        print(f"  💾 Kaydedildi: {genre} | {detected_country}")
        return True

    def run(self):
        print("=" * 60)
        print("🎵 DISCOGS SAMPLER SCRAPER")
        print("=" * 60)
        print(f"📊 Max süre: {MAX_MINUTES} dk")
        print(f"🔑 Anahtar kelimeler: {len(SEARCH_KEYWORDS)}")
        print("=" * 60)

        processed_cache = set()
        total_processed = 0
        total_saved = 0

        while True:
            for keyword in SEARCH_KEYWORDS:
                print(f"\n🔍 Aranıyor: '{keyword}'")

                # Önce ülke filtresiz ara
                releases = self.search_releases(keyword)
                print(f"   Bulunan: {len(releases)} release")

                for release in releases:
                    release_id = str(release.get("id", ""))
                    if not release_id:
                        continue

                    if release_id in processed_cache:
                        print(f"  ⏭️  Bu seansda işlendi: {release_id}")
                        continue
                    processed_cache.add(release_id)

                    total_processed += 1
                    result = self.process_release(release, search_keyword=keyword)

                    if result is True:
                        total_saved += 1

                    time.sleep(SEARCH_DELAY)

                print(f"\n📈 Şu ana kadar: {total_processed} işlendi, {total_saved} kaydedildi")

            print(f"\n⏳ {SEARCH_DELAY * 2} saniye bekleniyor...")
            time.sleep(SEARCH_DELAY * 2)


if __name__ == "__main__":
    scraper = DiscogsSamplerScraper()
    scraper.run()