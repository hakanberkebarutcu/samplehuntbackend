# YouTube Sampler Scraper

YouTube Data API kullanarak nadir/samplelanabilir şarkıları bulan ve analiz eden Python scraper.

## Kurulum

### 1. Python Bağımlılıkları

```bash
cd youtube_scraper
pip install -r requirements.txt
```

### 2. YouTube Data API Key

1. [Google Cloud Console](https://console.cloud.google.com) hesabı oluşturun
2. Yeni proje oluşturun
3. YouTube Data API v3'ü etkinleştirin
4. API Key alın
5. `.env` dosyasını düzenleyin

### 3. PostgreSQL Veritabanı

```bash
# psql ile veritabanı oluştur
psql -U postgres -c "CREATE DATABASE sample_hunt;"

# Tablo oluştur
psql -U postgres -d sample_hunt -f schema.sql
```

### 4. Yapılandırma

`.env.example` dosyasını `.env` olarak kopyalayın ve düzenleyin:

```env
YOUTUBE_API_KEY=your_api_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sample_hunt
DB_USER=postgres
DB_PASSWORD=your_password
MAX_VIEW_COUNT=40000
SEARCH_KEYWORDS=1970s rare soul,1980s rare groove
```

## Çalıştırma

```bash
python scraper.py
```

## Tablo Yapısı (sharks)

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | SERIAL | Birincil anahtar |
| video_id | VARCHAR(20) | YouTube video ID |
| title | VARCHAR(500) | Video başlığı |
| url | VARCHAR(100) | YouTube URL |
| bpm | INTEGER | Tahmin edilen BPM |
| key | VARCHAR(10) | Tahmin edilen müzik anahtarı |
| view_count | INTEGER | İzlenme sayısı |
| genre | VARCHAR(100) | Tahmin edilen tür |
| created_at | TIMESTAMP | Kayıt zamanı |

## Önemli Notlar

- **API Kotaları**: YouTube API günlük 10.000 sorgu limiti var
- **Audio Analizi**: Tam BPM/Key analizi için pytube ile audio indirilir (bu işlem yavaş olabilir)
- **Filtreleme**: Sadece 40.000 altı izlenme sayısı olan videolar seçilir
- **Döngü**: Script sonsuz döngüde çalışır ve tüm anahtar kelimeleri döngüsel olarak tarar