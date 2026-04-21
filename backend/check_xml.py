import gzip
import sys

sys.stdout.reconfigure(encoding='utf-8')

with gzip.open(r'D:\Discogs 2008\discogs_20260401_releases.xml.gz', 'rb') as f:
    data = f.read(5000)
    print(data[:3000].decode('utf-8', errors='replace'))
