require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, "sample_hunt.db");
const TRACKS_JSON_PATH = path.join(__dirname, "tracks.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── YOUTUBE API CONFIG ────────────────────────────────────────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "YOUR_API_KEY_HERE";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// ── DATABASE ─────────────────────────────────────────────────────────────────
let db;

function initDB() {
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      videoId TEXT UNIQUE NOT NULL,
      title TEXT,
      artist TEXT,
      channelName TEXT,
      year INTEGER,
      viewCount INTEGER DEFAULT 0,
      duration TEXT,
      bpm INTEGER,
      key TEXT,
      mood TEXT,
      genre TEXT,
      country TEXT,
      tags TEXT,
      copyright TEXT,
      samplePoints TEXT,
      producerNote TEXT,
      addedAt TEXT,
      updatedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_viewCount ON tracks(viewCount);
    CREATE INDEX IF NOT EXISTS idx_country ON tracks(country);
    CREATE INDEX IF NOT EXISTS idx_genre ON tracks(genre);
  `);

  const count = db.prepare("SELECT COUNT(*) as c FROM tracks").get();
  if (count.c === 0) {
    importFromJson();
  }

  console.log(`✅ SQLite veritabanı hazır: ${DB_PATH}`);
  console.log(`📊 Track sayısı: ${db.prepare("SELECT COUNT(*) as c FROM tracks").get().c}`);
}

function importFromJson() {
  try {
    const data = JSON.parse(fs.readFileSync(TRACKS_JSON_PATH, "utf-8"));
    const insert = db.prepare(`
      INSERT OR IGNORE INTO tracks 
      (videoId, title, artist, channelName, year, viewCount, duration, bpm, key, mood, genre, country, tags, copyright, samplePoints, producerNote, addedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((tracks) => {
      for (const t of tracks) {
        insert.run(
          t.videoId, t.title, t.artist, t.channelName, t.year,
          t.viewCount || 0, t.duration, t.bpm, t.key, t.mood,
          JSON.stringify(t.genre || []),
          t.country, JSON.stringify(t.tags || []), t.copyright,
          JSON.stringify(t.samplePoints || []), t.producerNote,
          t.addedAt || new Date().toISOString()
        );
      }
    });

    insertMany(data.tracks);
    console.log(`📥 ${data.tracks.length} track import edildi`);
  } catch (e) {
    console.error("Import hatası:", e.message);
  }
}

function trackToJson(track) {
  if (!track) return null;
  return {
    ...track,
    genre: track.genre ? JSON.parse(track.genre) : [],
    tags: track.tags ? JSON.parse(track.tags) : [],
    samplePoints: track.samplePoints ? JSON.parse(track.samplePoints) : [],
  };
}

// ── YOUTUBE API FONKSİYONLARI ─────────────────────────────────────────────────
async function youtubeSearch(query, maxResults = 20) {
  const url = `${YOUTUBE_API_BASE}/search?` +
    `part=snippet&q=${encodeURIComponent(query)}` +
    `&type=video&videoCategoryId=10` + // Music category
    `&maxResults=${maxResults}` +
    `&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error("YouTube Search Error:", data.error.message);
      return [];
    }
    
    return data.items || [];
  } catch (e) {
    console.error("Search fetch error:", e.message);
    return [];
  }
}

async function getVideoStats(videoIds) {
  if (videoIds.length === 0) return {};
  
  const ids = videoIds.slice(0, 50).join(",");
  const url = `${YOUTUBE_API_BASE}/videos?` +
    `part=statistics,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error("YouTube Stats Error:", data.error.message);
      return {};
    }
    
    const stats = {};
    for (const item of data.items || []) {
      stats[item.id] = {
        viewCount: parseInt(item.statistics.viewCount || "0"),
        duration: item.contentDetails.duration, // ISO 8601 format
        likeCount: parseInt(item.statistics.likeCount || "0"),
      };
    }
    return stats;
  } catch (e) {
    console.error("Stats fetch error:", e.message);
    return {};
  }
}

function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "3:00";
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ── GENRE & REGION CATEGORIES ─────────────────────────────────────────────────
const GENRES = [
  "Blues", "Classic", "Electronic", "Folk", 
  "Funk/Soul", "Hip Hop", "Jazz", "Latin", 
  "Pop", "Reggae", "Rock"
];

const REGIONS = [
  "ABD", "Türkiye", "Brezilya", "Japonya", "Nijerya", "Küba", 
  "Etiyopya", "Fransa", "İngiltere", "Jamaika", "Kolombiya", 
  "Hindistan", "Gana", "Senegal", "Meksika", "Arjantin", 
  "İspanya", "İtalya", "Almanya", "Portekiz", "Yunanistan",
  "Polonya", "Rusya", "Çin", "Güney Kore", "Endonezya",
  "Avustralya", "Yeni Zelanda", "Kanada"
];

// ── SCRAPE QUERIES ────────────────────────────────────────────────────────────
const SCRAPE_QUERIES = [
  // Blues
  { q: "blues vintage rare 1950s 1960s", country: "ABD", genre: ["Blues"] },
  { q: "delta blues underground obscure", country: "ABD", genre: ["Blues"] },
  { q: "electric blues rare vinyl", country: "ABD", genre: ["Blues"] },
  
  // Classic
  { q: "classic soul rare vinyl 1960s 1970s", country: "ABD", genre: ["Classic"] },
  { q: "classic jazz rare recording", country: "ABD", genre: ["Classic"] },
  { q: "classic rock underground 1970s", country: "ABD", genre: ["Classic"] },
  
  // Electronic
  { q: "lofi hip hop jazz sample", country: "ABD", genre: ["Electronic"] },
  { q: "ambient music obscure", country: "Japonya", genre: ["Electronic"] },
  { q: "downtempo rare vinyl", country: "İngiltere", genre: ["Electronic"] },
  { q: "chillout vintage rare", country: "Almanya", genre: ["Electronic"] },
  
  // Folk
  { q: "folk acoustic rare 1960s 1970s", country: "ABD", genre: ["Folk"] },
  { q: "indie folk obscure vinyl", country: "İngiltere", genre: ["Folk"] },
  { q: "traditional folk rare recording", country: "İrlanda", genre: ["Folk"] },
  
  // Funk/Soul
  { q: "rare groove soul vinyl 1970s", country: "ABD", genre: ["Funk/Soul"] },
  { q: "funk obscure underground 1970s", country: "ABD", genre: ["Funk/Soul"] },
  { q: "soul jazz rare vinyl blue note", country: "ABD", genre: ["Funk/Soul"] },
  { q: "uk rare groove soul", country: "İngiltere", genre: ["Funk/Soul"] },
  { q: "cymande rare groove", country: "İngiltere", genre: ["Funk/Soul"] },
  { q: "nigerian funk rare obscure", country: "Nijerya", genre: ["Funk/Soul"] },
  { q: "afrobeat rare vinyl", country: "Nijerya", genre: ["Funk/Soul"] },
  { q: "ethiopian jazz rare", country: "Etiyopya", genre: ["Funk/Soul"] },
  { q: "mulatu astatke", country: "Etiyopya", genre: ["Funk/Soul"] },
  
  // Hip Hop
  { q: "instrumental hip hop jazz sample", country: "ABD", genre: ["Hip Hop"] },
  { q: "boom bap obscure vinyl sample", country: "ABD", genre: ["Hip Hop"] },
  { q: "nujabes rare", country: "Japonya", genre: ["Hip Hop"] },
  { q: "j dilla rare vinyl", country: "ABD", genre: ["Hip Hop"] },
  { q: "madlib rare sample", country: "ABD", genre: ["Hip Hop"] },
  { q: "dilla type beat obscure", country: "ABD", genre: ["Hip Hop"] },
  
  // Jazz
  { q: "jazz vinyl rare 1950s 1960s", country: "ABD", genre: ["Jazz"] },
  { q: "jazz funk rare 1970s", country: "ABD", genre: ["Jazz"] },
  { q: "bossa nova rare vinyl", country: "Brezilya", genre: ["Jazz"] },
  { q: "baden powell rare", country: "Brezilya", genre: ["Jazz"] },
  { q: "japanese jazz funk rare 1970s", country: "Japonya", genre: ["Jazz"] },
  { q: "free jazz obscure rare", country: "ABD", genre: ["Jazz"] },
  { q: "cool jazz rare vinyl", country: "ABD", genre: ["Jazz"] },
  
  // Latin
  { q: "latin jazz rare vinyl", country: "Küba", genre: ["Latin"] },
  { q: "salsa obscure rare", country: "Küba", genre: ["Latin"] },
  { q: "bossa nova vintage rare", country: "Brezilya", genre: ["Latin"] },
  { q: "tropicalia obscure rare", country: "Brezilya", genre: ["Latin"] },
  { q: "cumbia obscure rare vinyl", country: "Kolombiya", genre: ["Latin"] },
  { q: "tango rare vinyl", country: "Arjantin", genre: ["Latin"] },
  
  // Pop
  { q: "60s pop rare vinyl obscure", country: "ABD", genre: ["Pop"] },
  { q: "yeye pop rare vinyl", country: "Fransa", genre: ["Pop"] },
  { q: "city pop rare 1980s", country: "Japonya", genre: ["Pop"] },
  { q: "psychedelic pop rare 1960s", country: "İngiltere", genre: ["Pop"] },
  
  // Reggae
  { q: "rocksteady rare vinyl 1960s", country: "Jamaika", genre: ["Reggae"] },
  { q: "ska obscure rare 1960s", country: "Jamaika", genre: ["Reggae"] },
  { q: "dub reggae rare vinyl", country: "Jamaika", genre: ["Reggae"] },
  { q: "lovers rock rare", country: "Jamaika", genre: ["Reggae"] },
  
  // Rock
  { q: "psychedelic rock rare 1960s 1970s", country: "ABD", genre: ["Rock"] },
  { q: "anadolu rock rare 1970s", country: "Türkiye", genre: ["Rock"] },
  { q: "krautrock obscure rare", country: "Almanya", genre: ["Rock"] },
  { q: "progressive rock rare vinyl", country: "İngiltere", genre: ["Rock"] },
  { q: "garage rock obscure rare 1960s", country: "ABD", genre: ["Rock"] },
  { q: "erkin koray rare", country: "Türkiye", genre: ["Rock"] },
  { q: "barış manço rare", country: "Türkiye", genre: ["Rock"] },
  
  // Region-specific treasures
  { q: "ghana highlife rare vinyl", country: "Gana", genre: ["Funk/Soul"] },
  { q: "senegal mbalax rare", country: "Senegal", genre: ["Pop"] },
  { q: "greek folk rare vinyl", country: "Yunanistan", genre: ["Folk"] },
  { q: "polish jazz rare vinyl", country: "Polonya", genre: ["Jazz"] },
  { q: "russian folk rare vinyl", country: "Rusya", genre: ["Folk"] },
  { q: "korean folk rare vinyl", country: "Güney Kore", genre: ["Folk"] },
];

// ── SCRAPER FONKSİYONU ───────────────────────────────────────────────────────
async function scrapeYouTube(query, maxViews = 20000) {
  console.log(`🔍 Searching: "${query.q}"`);
  
  const searchResults = await youtubeSearch(query.q, 20);
  
  if (searchResults.length === 0) {
    console.log(`  ⚠️ No results for: ${query.q}`);
    return [];
  }
  
  const videoIds = searchResults.map(v => v.id.videoId);
  const stats = await getVideoStats(videoIds);
  
  const results = [];
  for (const video of searchResults) {
    const videoId = video.id.videoId;
    const stat = stats[videoId];
    
    if (!stat || stat.viewCount > maxViews) continue;
    
    const title = video.snippet.title;
    const channel = video.snippet.channelTitle;
    
    let artist = channel;
    if (title.includes(" - ")) {
      artist = title.split(" - ")[0].trim();
    }
    
    results.push({
      videoId,
      title,
      artist,
      channelName: channel,
      viewCount: stat.viewCount,
      duration: parseDuration(stat.duration),
      metadata: {
        country: query.country,
        genre: query.genre,
      }
    });
  }
  
  console.log(`  ✅ Found ${results.length} videos with < ${maxViews.toLocaleString()} views`);
  return results;
}

function guessMetadata(title, channel, query) {
  const t = (title + " " + channel).toLowerCase();
  
  let genre = query.genre && query.genre.length > 0 ? [...query.genre] : [];
  
  if (genre.length === 0) {
    if (t.includes("blues")) genre.push("Blues");
    if (t.includes("classic") || t.includes("vintage") || t.includes("60s") || t.includes("70s")) genre.push("Classic");
    if (t.includes("electronic") || t.includes("lo-fi") || t.includes("lofi") || t.includes("ambient") || t.includes("downtempo")) genre.push("Electronic");
    if (t.includes("folk") || t.includes("acoustic") || t.includes("traditional")) genre.push("Folk");
    if (t.includes("funk") || t.includes("soul") || t.includes("groove")) genre.push("Funk/Soul");
    if (t.includes("hip hop") || t.includes("hip-hop") || t.includes("boom bap")) genre.push("Hip Hop");
    if (t.includes("jazz") || t.includes("bossa") || t.includes("brazil")) genre.push("Jazz");
    if (t.includes("latin") || t.includes("cuba") || t.includes("cuban") || t.includes("salsa") || t.includes("tango") || t.includes("cumbia")) genre.push("Latin");
    if (t.includes("pop") || t.includes("yeye") || t.includes("city pop")) genre.push("Pop");
    if (t.includes("reggae") || t.includes("rocksteady") || t.includes("ska") || t.includes("dub")) genre.push("Reggae");
    if (t.includes("rock") || t.includes("psychedelic") || t.includes("anadolu") || t.includes("kraut")) genre.push("Rock");
    
    if (genre.length === 0) genre.push("Jazz");
  }
  
  let country = query.country || "ABD";
  if (t.includes("ethiopian") || t.includes("ethiopia")) country = "Etiyopya";
  else if (t.includes("turkish") || t.includes("türk") || t.includes("anadolu")) country = "Türkiye";
  else if (t.includes("nigerian") || t.includes("nigeria") || t.includes("afrobeat") || t.includes("ghana")) country = "Nijerya";
  else if (t.includes("brazil") || t.includes("bossa") || t.includes("tropicalia")) country = "Brezilya";
  else if (t.includes("japan") || t.includes("japanese") || t.includes("city pop")) country = "Japonya";
  else if (t.includes("cuban") || t.includes("cuba") || t.includes("latin")) country = "Küba";
  else if (t.includes("uk") || t.includes("british") || t.includes("english")) country = "İngiltere";
  else if (t.includes("french") || t.includes("france")) country = "Fransa";
  else if (t.includes("indian") || t.includes("india")) country = "Hindistan";
  else if (t.includes("jamaican") || t.includes("jamaica")) country = "Jamaika";
  else if (t.includes("colombian") || t.includes("colombia") || t.includes("cumbia")) country = "Kolombiya";
  else if (t.includes("mexican") || t.includes("mexico")) country = "Meksika";
  else if (t.includes("argentine") || t.includes("argentina") || t.includes("tango")) country = "Arjantin";
  else if (t.includes("spanish") || t.includes("spain")) country = "İspanya";
  else if (t.includes("italian") || t.includes("italy")) country = "İtalya";
  else if (t.includes("german") || t.includes("germany") || t.includes("kraut")) country = "Almanya";
  else if (t.includes("portuguese") || t.includes("portugal")) country = "Portekiz";
  else if (t.includes("greek") || t.includes("greece")) country = "Yunanistan";
  else if (t.includes("polish") || t.includes("poland")) country = "Polonya";
  else if (t.includes("russian") || t.includes("russia")) country = "Rusya";
  else if (t.includes("chinese") || t.includes("china")) country = "Çin";
  else if (t.includes("korean") || t.includes("korea")) country = "Güney Kore";
  else if (t.includes("indonesian") || t.includes("indonesia")) country = "Endonezya";
  else if (t.includes("australian") || t.includes("australia")) country = "Avustralya";
  else if (t.includes("canadian") || t.includes("canada")) country = "Kanada";
  
  const yearMatch = (title + " " + channel).match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  const bpm = 65 + Math.floor(Math.random() * 75);
  const keys = ["C Major","C Minor","D Major","D Minor","E Minor","F Major","G Major","G Minor","A Minor","Bb Major","Bb Minor"];
  const key = keys[Math.floor(Math.random() * keys.length)];
  
  return { genre, country, year, bpm, key };
}

function generateSamplePoints(duration) {
  const qualities = ["Mükemmel","Çok İyi","İyi"];
  const sampleLabels = ["İntro melodi","Kapanış breakdown","Loop noktası","Enstrümantal bölüm","Vokal kesme noktası","Bass hattı","Orkestra girişi"];
  const sampleWhys = ["Loop için ideal","Nefes alma payı var","Enstrümanlar ayrı","Minimal prodüksiyon","Dinamik değişim yok","Doğal fade-out","Melodi dikkat çekici"];
  
  const parts = duration.split(":").map(Number);
  let totalSec = 0;
  if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];
  else totalSec = 180;
  
  const numSamples = 2 + Math.floor(Math.random() * 3);
  const samplePoints = [];
  
  for (let i = 0; i < numSamples; i++) {
    const startSec = Math.floor(Math.random() * Math.max(1, totalSec - 30));
    const endSec = Math.min(startSec + 10 + Math.floor(Math.random() * 20), totalSec);
    
    const start = `${Math.floor(startSec/60)}:${(startSec%60).toString().padStart(2,"0")}`;
    const end = `${Math.floor(endSec/60)}:${(endSec%60).toString().padStart(2,"0")}`;
    
    samplePoints.push({
      start,
      end,
      label: sampleLabels[Math.floor(Math.random() * sampleLabels.length)],
      quality: qualities[Math.floor(Math.random() * 2)],
      why: sampleWhys[Math.floor(Math.random() * sampleWhys.length)]
    });
  }
  
  return samplePoints;
}

// ── YARDIMCI ─────────────────────────────────────────────────────────────────
function matchesFilters(track, filters) {
  const { genre, country, tempo, year, key } = filters;

  const trackGenre = track.genre ? JSON.parse(track.genre) : [];

  if (genre?.length > 0 && !genre.some(g => trackGenre.includes(g))) return false;
  if (country?.length > 0 && !country.includes(track.country)) return false;
  if (key?.length > 0 && !key.includes(track.key)) return false;

  if (tempo) {
    const [min, max] = tempo.split("–").map(Number);
    if (track.bpm && (track.bpm < min || track.bpm > (max || 999))) return false;
  }

  if (year) {
    const ranges = {
      "1950–1969": [1950, 1969], "1970–1979": [1970, 1979],
      "1980–1989": [1980, 1989], "1990–1999": [1990, 1999],
      "2000–2009": [2000, 2009], "2010–Bugün": [2010, 2099],
    };
    const range = ranges[year];
    if (range && track.year && (track.year < range[0] || track.year > range[1])) return false;
  }

  return true;
}

// ── ENDPOINTS ─────────────────────────────────────────────────────────────────

// Rastgele track — filtre destekli
app.get("/api/tracks/random", (req, res) => {
  const seenIds = req.query.seen ? req.query.seen.split(",").filter(Boolean) : [];
  const filters = {
    genre:   req.query.genre   ? req.query.genre.split(",")   : [],
    country: req.query.country ? req.query.country.split(",") : [],
    key:     req.query.key     ? req.query.key.split(",")     : [],
    tempo:   req.query.tempo   || null,
    year:    req.query.year    || null,
  };

  let sql = "SELECT * FROM tracks WHERE 1=1";
  let params = [];

  if (seenIds.length > 0) {
    sql += ` AND videoId NOT IN (${seenIds.map(() => '?').join(',')})`;
    params.push(...seenIds);
  }

  if (filters.country.length > 0) {
    sql += ` AND country IN (${filters.country.map(() => '?').join(',')})`;
    params.push(...filters.country);
  }
  if (filters.key.length > 0) {
    sql += ` AND key IN (${filters.key.map(() => '?').join(',')})`;
    params.push(...filters.key);
  }
  if (filters.tempo) {
    const [min, max] = filters.tempo.split("–").map(Number);
    sql += ` AND bpm >= ? AND bpm <= ?`;
    params.push(min, max || 999);
  }
  if (filters.year) {
    const ranges = {
      "1950–1969": [1950, 1969], "1970–1979": [1970, 1979],
      "1980–1989": [1980, 1989], "1990–1999": [1990, 1999],
      "2000–2009": [2000, 2009], "2010–Bugün": [2010, 2099],
    };
    const range = ranges[filters.year];
    if (range) {
      sql += ` AND year >= ? AND year <= ?`;
      params.push(range[0], range[1]);
    }
  }

  let tracks = db.prepare(sql).all(...params);
  
  // Genre filtrelemesi memory'de yap
  if (filters.genre.length > 0) {
    tracks = tracks.filter(t => {
      const trackGenre = t.genre ? JSON.parse(t.genre) : [];
      if (filters.genre.length > 0 && !filters.genre.some(g => trackGenre.includes(g))) return false;
      return true;
    });
  }

  if (tracks.length === 0) {
    tracks = db.prepare("SELECT * FROM tracks").all();
  }

  if (tracks.length === 0) {
    return res.json({ success: true, data: null });
  }

  const track = tracks[Math.floor(Math.random() * tracks.length)];
  res.json({ success: true, data: trackToJson(track) });
});

// Filtreli liste
app.get("/api/tracks", (req, res) => {
  const filters = {
    genre:   req.query.genre   ? req.query.genre.split(",")   : [],
    country: req.query.country ? req.query.country.split(",") : [],
    key:     req.query.key     ? req.query.key.split(",")     : [],
    tempo:   req.query.tempo   || null,
    year:    req.query.year    || null,
  };

  let sql = "SELECT * FROM tracks WHERE 1=1";
  let params = [];

  if (filters.country.length > 0) {
    sql += ` AND country IN (${filters.country.map(() => '?').join(',')})`;
    params.push(...filters.country);
  }
  if (filters.key.length > 0) {
    sql += ` AND key IN (${filters.key.map(() => '?').join(',')})`;
    params.push(...filters.key);
  }
  if (filters.tempo) {
    const [min, max] = filters.tempo.split("–").map(Number);
    sql += ` AND bpm >= ? AND bpm <= ?`;
    params.push(min, max || 999);
  }

  let tracks = db.prepare(sql).all(...params);

  // Memory filtreleri
  if (filters.genre.length > 0 || filters.year) {
    tracks = tracks.filter(t => {
      if (filters.year) {
        const ranges = {
          "1950–1969": [1950, 1969], "1970–1979": [1970, 1979],
          "1980–1989": [1980, 1989], "1990–1999": [1990, 1999],
          "2000–2009": [2000, 2009], "2010–Bugün": [2010, 2099],
        };
        const range = ranges[filters.year];
        if (range && (t.year < range[0] || t.year > range[1])) return false;
      }
      const trackGenre = t.genre ? JSON.parse(t.genre) : [];
      if (filters.genre.length > 0 && !filters.genre.some(g => trackGenre.includes(g))) return false;
      return true;
    });
  }

  res.json({ success: true, data: tracks.map(trackToJson), total: tracks.length });
});

// ── DÜŞÜK İZLENME LİSTESİ ───────────────────────────────────────────
app.get("/api/discover/low-views", (req, res) => {
  const maxViews = parseInt(req.query.max) || 5000;
  const minViews = parseInt(req.query.min) || 0;

  const tracks = db.prepare(`
    SELECT * FROM tracks 
    WHERE viewCount >= ? AND viewCount <= ?
    ORDER BY viewCount ASC
  `).all(minViews, maxViews);

  res.json({ 
    success: true, 
    data: tracks.map(trackToJson),
    total: tracks.length,
    filters: { minViews, maxViews }
  });
});

// İstatistik
app.get("/api/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as c FROM tracks").get().c;
  
  const genres = {};
  const countries = {};
  
  const allTracks = db.prepare("SELECT genre, country FROM tracks").all();
  allTracks.forEach(t => {
    const g = t.genre ? JSON.parse(t.genre) : [];
    g.forEach(gg => { genres[gg] = (genres[gg] || 0) + 1; });
    if (t.country) countries[t.country] = (countries[t.country] || 0) + 1;
  });

  res.json({
    success: true,
    data: { total, genres, countries }
  });
});

// ── YOUTUBE API SCRAPER ENDPOINT ─────────────────────────────────────────────
app.post("/api/scrape", async (req, res) => {
  if (YOUTUBE_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(400).json({ 
      success: false, 
      error: "YouTube API key not configured. Set YOUTUBE_API_KEY in environment or .env file."
    });
  }
  
  const maxViews = parseInt(req.body.maxViews) || 20000;
  const full = req.body.full === true;
  
  const queryCount = full ? SCRAPE_QUERIES.length : Math.min(5, SCRAPE_QUERIES.length);
  const queries = SCRAPE_QUERIES.slice(0, queryCount);
  
  console.log(`\n🎬 YouTube API Scraper başladı`);
  console.log(`   Query sayısı: ${queryCount}`);
  console.log(`   Max views: ${maxViews.toLocaleString()}\n`);
  
  const existingIds = new Set(db.prepare("SELECT videoId FROM tracks").all().map(t => t.videoId));
  let added = 0;
  let skipped = 0;

  for (const query of queries) {
    const results = await scrapeYouTube(query, maxViews);
    
    for (const r of results) {
      if (existingIds.has(r.videoId)) {
        skipped++;
        continue;
      }

      const meta = guessMetadata(r.title, r.channel, query.metadata);
      const samplePoints = generateSamplePoints(r.duration);

      db.prepare(`
        INSERT INTO tracks 
        (videoId, title, artist, channelName, viewCount, duration, bpm, key, mood, genre, country, year, tags, copyright, samplePoints, producerNote, addedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.videoId, r.title, r.artist, r.channelName, r.viewCount, r.duration,
        meta.bpm, meta.key, ["melancholic","chill","groovy","nostalgic","dreamy","energetic","peaceful"][Math.floor(Math.random()*7)],
        JSON.stringify(meta.genre), meta.country, meta.year,
        JSON.stringify(meta.genre.slice(0,2)), "All Rights Reserved",
        JSON.stringify(samplePoints), "Bu parça sample olarak kullanılabilecek niteliklere sahip.",
        new Date().toISOString()
      );

      existingIds.add(r.videoId);
      added++;
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  const total = db.prepare("SELECT COUNT(*) as c FROM tracks").get().c;
  
  console.log(`\n✅ Scraping tamamlandı!`);
  console.log(`   Yeni track: ${added}`);
  console.log(`   Atlanan (zaten var): ${skipped}`);
  console.log(`   Toplam track: ${total}\n`);

  res.json({ 
    success: true, 
    added, 
    skipped,
    total,
    message: full ? "Tam scraping tamamlandı" : `İlk ${queryCount} query işlendi`
  });
});

// Update view counts from YouTube API
app.post("/api/scrape/update-views", async (req, res) => {
  if (YOUTUBE_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(400).json({ 
      success: false, 
      error: "YouTube API key not configured."
    });
  }
  
  const tracks = db.prepare("SELECT videoId FROM tracks").all();
  const videoIds = tracks.map(t => t.videoId);
  
  let updated = 0;
  
  // Batch processing - 50 video at a time
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const stats = await getVideoStats(batch);
    
    const updateStmt = db.prepare("UPDATE tracks SET viewCount = ?, updatedAt = ? WHERE videoId = ?");
    
    for (const [videoId, stat] of Object.entries(stats)) {
      updateStmt.run(stat.viewCount, new Date().toISOString(), videoId);
      updated++;
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  res.json({ success: true, updated, total: videoIds.length });
});

// Sağlık kontrolü
app.get("/api/health", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as c FROM tracks").get().c;
  const apiKeyStatus = YOUTUBE_API_KEY === "YOUR_API_KEY_HERE" ? "not_configured" : "configured";
  
  res.json({ 
    status: "ok", 
    tracks: total,
    youtubeApi: apiKeyStatus
  });
});

// API Key durumunu döndür
app.get("/api/config", (req, res) => {
  res.json({
    youtubeApiConfigured: YOUTUBE_API_KEY !== "YOUR_API_KEY_HERE"
  });
});

// Mobile API - Tüm trackleri filtreli getir
app.get("/api/mobile/tracks", (req, res) => {
  try {
    const { genre, country, minViews, maxViews, limit } = req.query;
    
    let query = "SELECT videoId, title, artist, channelName, year, viewCount, duration, bpm, key, mood, genre, country, tags, samplePoints FROM tracks WHERE 1=1";
    const params = [];
    let paramIndex = 1;
    
    if (genre) {
      query += ` AND genre LIKE $${paramIndex}`;
      params.push(`%${genre}%`);
      paramIndex++;
    }
    
    if (country) {
      query += ` AND country LIKE $${paramIndex}`;
      params.push(`%${country}%`);
      paramIndex++;
    }
    
    if (minViews) {
      query += ` AND viewCount >= $${paramIndex}`;
      params.push(parseInt(minViews));
      paramIndex++;
    }
    
    if (maxViews) {
      query += ` AND viewCount <= $${paramIndex}`;
      params.push(parseInt(maxViews));
      paramIndex++;
    }
    
    query += " ORDER BY viewCount ASC";
    
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }
    
    const tracks = db.prepare(query).all(...params);
    
    // JSON parse for array fields
    const formatted = tracks.map(t => ({
      ...t,
      genre: t.genre ? JSON.parse(t.genre) : [],
      tags: t.tags ? JSON.parse(t.tags) : [],
      samplePoints: t.samplePoints ? JSON.parse(t.samplePoints) : []
    }));
    
    res.json({ success: true, data: formatted, total: formatted.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── START ─────────────────────────────────────────────────────────────────────
initDB();

app.listen(PORT, () => {
  console.log(`\n🎵 SampleHunt Backend`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   YouTube API: ${YOUTUBE_API_KEY === "YOUR_API_KEY_HERE" ? "❌ Yapılandırılmamış" : "✅ Yapılandırıldı"}`);
  console.log(`\n   📌 Yeni endpointler:`);
  console.log(`      POST /api/scrape - YouTube API ile yeni track çek`);
  console.log(`      POST /api/scrape/update-views - Mevcut tracklerin viewCount Güncelle`);
  console.log(`      GET  /api/discover/low-views?min=0&max=5000 - Az izlenen trackler\n`);
});