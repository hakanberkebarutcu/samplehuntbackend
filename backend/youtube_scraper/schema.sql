-- PostgreSQL veritabanı ve sharks tablosu oluşturma

-- Veritabanı oluştur (psql'de çalıştırın)
-- CREATE DATABASE sample_hunt;

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS sharks (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(500),
    url VARCHAR(100),
    bpm INTEGER,
    key VARCHAR(10),
    view_count INTEGER DEFAULT 0,
    genre VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_sharks_video_id ON sharks(video_id);
CREATE INDEX IF NOT EXISTS idx_sharks_view_count ON sharks(view_count);
CREATE INDEX IF NOT EXISTS idx_sharks_genre ON sharks(genre);
CREATE INDEX IF NOT EXISTS idx_sharks_bpm ON sharks(bpm);
CREATE INDEX IF NOT EXISTS idx_sharks_country ON sharks(country);