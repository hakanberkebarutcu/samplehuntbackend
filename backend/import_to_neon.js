require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_OQzkU2SD7Kob@ep-young-hill-al3dqxsy-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function importData() {
  await client.connect();

  const data = JSON.parse(fs.readFileSync("exported_data.json", "utf8"));
  console.log("Import edilecek rows: " + data.length);

  const batchSize = 1000;
  let imported = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const values = batch.map((row, idx) => {
      return `($${idx * 9 + 1}, $${idx * 9 + 2}, $${idx * 9 + 3}, $${idx * 9 + 4}, $${idx * 9 + 5}, $${idx * 9 + 6}, $${idx * 9 + 7}, $${idx * 9 + 8}, $${idx * 9 + 9})`;
    }).join(", ");

    const params = batch.flatMap(row => [
      row.youtube_id || null,
      row.title || null,
      row.artist || null,
      row.release_year || null,
      row.country || null,
      row.genres || null,
      row.styles || null,
      row.discogs_id || null,
      row.added_at || null
    ]);

    await client.query(
      `INSERT INTO releases (youtube_id, title, artist, release_year, country, genres, styles, discogs_id, added_at) VALUES ${values}`,
      params
    );

    imported += batch.length;
    console.log("Imported: " + imported + " / " + data.length);
  }

  console.log("Import complete!");
  await client.end();
}

importData().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});