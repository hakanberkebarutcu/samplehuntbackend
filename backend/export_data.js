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

async function exportData() {
  const client = await pool.connect();
  try {
    const countResult = await client.query("SELECT COUNT(*) FROM releases");
    const total = parseInt(countResult.rows[0].count);
    console.log("Total rows: " + total);

    const stream = fs.createWriteStream("exported_data.json");
    stream.write("[\n");

    let offset = 0;
    const batchSize = 1000;

    while (offset < total) {
      const result = await client.query(
        "SELECT id, youtube_id, title, artist, release_year, country, genres, styles, discogs_id, added_at FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != '' OFFSET $1 LIMIT $2",
        [offset, batchSize]
      );

      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        const json = JSON.stringify(row);
        stream.write(json + (offset + i < total - 1 ? ",\n" : "\n"));
      }

      console.log("Exported " + Math.min(offset + batchSize, total) + " / " + total);
      offset += batchSize;
    }

    stream.write("]");
    stream.end();
    console.log("Export complete!");

  } finally {
    client.release();
    await pool.end();
  }
}

exportData();