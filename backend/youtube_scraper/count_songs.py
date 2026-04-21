import sys
sys.path.insert(0, 'C:/Users/PC/myapp/backend/youtube_scraper')
from database import Database

db = Database()
tracks = db.get_all()
print(f"Toplam şarkı: {len(tracks)}")