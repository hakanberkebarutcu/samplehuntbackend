require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

// Country name mapping: frontend (Turkish) -> database (English)
const COUNTRY_MAP = {
  "ABD": "United States",
  "Türkiye": "Turkey",
  "Brezilya": "Brazil",
  "Japonya": "Japan",
  "Nijerya": "Nigeria",
  "Küba": "Cuba",
  "Etiyopya": "Ethiopia",
  "Fransa": "France",
  "İngiltere": "United Kingdom",
  "Jamaika": "Jamaica",
  "Kolombiya": "Colombia",
  "Hindistan": "India",
  "Gana": "Ghana",
  "Senegal": "Senegal",
  "Meksika": "Mexico",
  "Arjantin": "Argentina",
  "İspanya": "Spain",
  "İtalya": "Italy",
  "Almanya": "Germany",
  "Portekiz": "Portugal",
  "Yunanistan": "Greece",
  "Polonya": "Poland",
  "Rusya": "Russia",
  "Çin": "China",
  "Güney Kore": "Korea",
  "Endonezya": "Indonesia",
  "Avustralya": "Australia",
  "Yeni Zelanda": "New Zealand",
  "Kanada": "Canada",
};

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "samplehunt",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "berke",
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function initDB() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT COUNT(*) as c FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''");
    console.log(`✅ PostgreSQL veritabanı hazır`);
    console.log(`📊 Track sayısı: ${result.rows[0].c}`);
  } finally {
    client.release();
  }
}

function trackToJson(track) {
  if (!track) return null;
  return {
    id: track.id,
    videoId: track.youtube_id,
    title: track.title,
    artist: track.artist,
    url: track.youtube_id ? `https://youtube.com/watch?v=${track.youtube_id}` : null,
    year: track.release_year,
    genres: track.genres || [],
    styles: track.styles || [],
    discogsId: track.discogs_id,
    addedAt: track.added_at,
  };
}

// ── ENDPOINTS ─────────────────────────────────────────────────────────────────

// Rastgele track — filtre destekli (optimized)
app.get("/api/tracks/random", async (req, res) => {
  const seenIds = req.query.seen ? req.query.seen.split(",").filter(Boolean) : [];
  const filters = {
    genre:   req.query.genre   ? req.query.genre.split(",")   : [],
    style:   req.query.style   ? req.query.style.split(",")   : [],
    year:    req.query.year    || null,
    country: req.query.country ? req.query.country.split(",")   : [],
  };

  let sql = "SELECT * FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''";
  let params = [];
  let paramIndex = 1;

  if (seenIds.length > 0) {
    const placeholders = seenIds.map(() => `$${paramIndex++}`).join(",");
    sql += ` AND youtube_id NOT IN (${placeholders})`;
    params.push(...seenIds);
  }

  if (filters.year) {
    const [min, max] = filters.year.split("–").map(Number);
    sql += ` AND release_year >= $${paramIndex++} AND release_year <= $${paramIndex++}`;
    params.push(min, max || 9999);
  }

  // Genre filter - use PostgreSQL array overlap operator
  if (filters.genre.length > 0) {
    const placeholders = filters.genre.map(() => `$${paramIndex++}`).join(",");
    sql += ` AND genres && ARRAY[${placeholders}]`;
    params.push(...filters.genre);
  }

  // Styles filter - use PostgreSQL array overlap operator
  if (filters.style.length > 0) {
    const placeholders = filters.style.map(() => `$${paramIndex++}`).join(",");
    sql += ` AND styles && ARRAY[${placeholders}]`;
    params.push(...filters.style);
  }

  // Country filter - map Turkish names to English
  if (filters.country.length > 0) {
    const countryNames = filters.country.map(c => COUNTRY_MAP[c] || c);
    const placeholders = countryNames.map(() => `$${paramIndex++}`).join(",");
    sql += ` AND country IN (${placeholders})`;
    params.push(...countryNames);
  }

  // Get one random result directly from DB
  sql += " ORDER BY RANDOM() LIMIT 1";

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);

      if (result.rows.length === 0) {
        // Fallback: try without genre/style filters
        let fallbackSql = "SELECT * FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''";
        if (seenIds.length > 0) {
          const placeholders = seenIds.map(() => `$${paramIndex++}`).join(",");
          fallbackSql += ` AND youtube_id NOT IN (${placeholders})`;
        }
        if (filters.year) {
          const [min, max] = filters.year.split("–").map(Number);
          fallbackSql += ` AND release_year >= $${paramIndex++} AND release_year <= $${paramIndex++}`;
        }
        fallbackSql += " ORDER BY RANDOM() LIMIT 1";

        const fallback = await client.query(fallbackSql, params.slice(0, seenIds.length + (filters.year ? 2 : 0)));
        if (fallback.rows.length === 0) {
          return res.json({ success: true, data: null });
        }
        return res.json({ success: true, data: trackToJson(fallback.rows[0]) });
      }

      res.json({ success: true, data: trackToJson(result.rows[0]) });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Filtreli liste (optimized)
app.get("/api/tracks", async (req, res) => {
  const filters = {
    genre:   req.query.genre   ? req.query.genre.split(",")   : [],
    style:   req.query.style   ? req.query.style.split(",")   : [],
    year:    req.query.year    || null,
  };
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const offset = parseInt(req.query.offset) || 0;

  let sql = "SELECT * FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''";
  let countSql = "SELECT COUNT(*) FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''";
  let params = [];
  let paramIndex = 1;

  if (filters.year) {
    const [min, max] = filters.year.split("–").map(Number);
    sql += ` AND release_year >= $${paramIndex} AND release_year <= $${paramIndex + 1}`;
    countSql += ` AND release_year >= $${paramIndex} AND release_year <= $${paramIndex + 1}`;
    params.push(min, max || 9999);
    paramIndex += 2;
  }

  if (filters.genre.length > 0) {
    const placeholders = filters.genre.map(() => `$${paramIndex++}`).join(",");
    sql += ` AND genres && ARRAY[${placeholders}]`;
    countSql += ` AND genres && ARRAY[${placeholders}]`;
    params.push(...filters.genre);
  }

  if (filters.style.length > 0) {
    const placeholders = filters.style.map(() => `$${paramIndex++}`).join(",");
    sql += ` AND styles && ARRAY[${placeholders}]`;
    countSql += ` AND styles && ARRAY[${placeholders}]`;
    params.push(...filters.style);
  }

  sql += ` ORDER BY added_at DESC LIMIT ${limit} OFFSET ${offset}`;

  try {
    const client = await pool.connect();
    try {
      const [tracksResult, countResult] = await Promise.all([
        client.query(sql, params),
        client.query(countSql, params)
      ]);

      const total = parseInt(countResult.rows[0].count);
      res.json({ success: true, data: tracksResult.rows.map(trackToJson), total });
    } finally {
      client.release();
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// İstatistik
app.get("/api/stats", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const totalResult = await client.query("SELECT COUNT(*) as c FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''");
      const total = parseInt(totalResult.rows[0].c);

      const genres = {};
      const years = {};

      const allTracks = await client.query("SELECT genres, release_year FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != '' LIMIT 100000");
      allTracks.rows.forEach(t => {
        if (t.genres && Array.isArray(t.genres)) {
          t.genres.forEach(g => { genres[g] = (genres[g] || 0) + 1; });
        }
        if (t.release_year) {
          years[t.release_year] = (years[t.release_year] || 0) + 1;
        }
      });

      res.json({
        success: true,
        data: { total, genres, years }
      });
    } finally {
      client.release();
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Sağlık kontrolü
app.get("/api/health", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT COUNT(*) as c FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''");
      const total = parseInt(result.rows[0].c);
      res.json({ status: "ok", tracks: total });
    } finally {
      client.release();
    }
  } catch (e) {
    res.json({ status: "error", tracks: 0, error: e.message });
  }
});

// ── START ─────────────────────────────────────────────────────────────────────
initDB();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🎵 SampleHunt Backend (releases)`);
  console.log(`   Listening on port ${PORT}`);
  console.log(`   PostgreSQL: ✅`);
  console.log(`\n   📌 Endpointler:`);
  console.log(`      GET  /api/tracks/random - Rastgele track`);
  console.log(`      GET  /api/tracks - Filtreli trackler`);
  console.log(`      GET  /api/stats - İstatistikler\n`);
});