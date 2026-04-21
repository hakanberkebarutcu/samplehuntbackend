const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_OQzkU2SD7Kob@ep-young-hill-al3dqxsy-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function createSchema() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id SERIAL PRIMARY KEY,
      youtube_id VARCHAR(255),
      title VARCHAR(500),
      artist VARCHAR(500),
      release_year INTEGER,
      country VARCHAR(100),
      genres TEXT[],
      styles TEXT[],
      discogs_id INTEGER,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_youtube_id ON releases(youtube_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_added_at ON releases(added_at DESC)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_genres ON releases USING GIN(genres)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_styles ON releases USING GIN(styles)`);

  console.log("Schema oluşturuldu!");
  await client.end();
}

createSchema().catch(console.error);