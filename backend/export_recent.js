require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "samplehunt",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "berke"
});

const LIMIT = 300000;

async function exportData() {
  const client = await pool.connect();
  try {
    const countResult = await client.query("SELECT COUNT(*) FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''");
    const total = parseInt(countResult.rows[0].count);
    console.log("Total rows with youtube_id: " + total);

    const stream = fs.createWriteStream("exported_data.json");
    stream.write("[\n");

    let offset = 0;
    const batchSize = 5000;
    let exported = 0;

    while (offset < total && exported < LIMIT) {
      const result = await client.query(
        "SELECT id, youtube_id, title, artist, release_year, country, genres, styles, discogs_id, added_at FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != '' ORDER BY added_at DESC OFFSET $1 LIMIT $2",
        [offset, batchSize]
      );

      if (result.rows.length === 0) break;

      for (let i = 0; i < result.rows.length && exported < LIMIT; i++) {
        const row = result.rows[i];
        const json = JSON.stringify(row);
        stream.write(json + (exported < Math.min(total, LIMIT) - 1 ? ",\n" : "\n"));
        exported++;
      }

      console.log("Exported " + exported + " / " + Math.min(total, LIMIT));
      offset += batchSize;
    }

    stream.write("]");
    stream.end();
    console.log("Export complete! Total: " + exported + " rows");

  } finally {
    client.release();
    await pool.end();
  }
}

exportData();