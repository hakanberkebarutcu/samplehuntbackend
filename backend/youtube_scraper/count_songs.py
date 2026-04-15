import sys
sys.path.insert(0, r'C:\Users\PC\myapp\backend\youtube_scraper')
from database import Database
db = Database()
print(len(db.get_all()))