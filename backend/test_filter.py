import gzip
import re
from lxml import etree

YOUTUBE_REGEX = re.compile(r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})')
MAX_DURATION = 600

def get_youtube_id(url):
    if not url:
        return None
    m = YOUTUBE_REGEX.search(url)
    return m.group(1) if m else None

count = 0
with gzip.open(r'D:\Discogs 2008\discogs_20260401_releases.xml.gz', 'rb') as f:
    context = etree.iterparse(f, events=('end',), tag='release', recover=True)
    for event, elem in context:
        if count >= 100:
            break

        try:
            discogs_id = int(elem.get('id'))

            type_elem = elem.find('type')
            if type_elem is not None and type_elem.text == 'Non-Music':
                elem.clear()
                count += 1
                continue

            title = elem.find('title').text if elem.find('title') is not None else None
            genres = [g.text for g in elem.findall('genres/genre') if g.text]
            styles = [s.text for s in elem.findall('styles/style') if s.text]

            youtube_id = None
            min_duration = 0

            for video in elem.findall('.//video'):
                src = video.get('src', '')
                if src and ('youtube' in src or 'youtu.be' in src):
                    youtube_id = get_youtube_id(src)
                    if youtube_id:
                        dur = video.get('duration', '')
                        if dur:
                            min_duration = int(dur)
                        break

            if not youtube_id:
                elem.clear()
                count += 1
                continue

            if min_duration > MAX_DURATION:
                elem.clear()
                count += 1
                continue

            print(f"Release {discogs_id}: {title}, yt={youtube_id}, dur={min_duration}s, genres={genres}")
        except Exception as e:
            print(f"Error: {e}")
            pass

        elem.clear()
        count += 1

print(f"\nTotal checked: {count}")
