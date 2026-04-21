import gzip
from lxml import etree

count = 0
with gzip.open(r'D:\Discogs 2008\discogs_20260401_releases.xml.gz', 'rb') as f:
    context = etree.iterparse(f, events=('end',), tag='release', recover=True)
    for event, elem in context:
        if count < 3:
            print(f"Release #{count+1}: id={elem.get('id')}, title={elem.find('title').text if elem.find('title') is not None else 'N/A'}")
            videos = elem.findall('.//video')
            print(f"  Videos found: {len(videos)}")
            for v in videos[:2]:
                print(f"    video src: {v.get('src')}")
            genres = elem.findall('genres/genre')
            print(f"  Genres: {[g.text for g in genres]}")
            count += 1
        elem.clear()
        if count >= 3:
            break

print(f"Test parsed {count} releases")
