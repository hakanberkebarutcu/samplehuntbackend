const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "samplehunt",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "berke",
});

pool.query('SELECT COUNT(*) as c FROM sharks', (err, result) => {
  if (err) {
    console.error('Total error:', err);
  } else {
    console.log('Total tracks in PostgreSQL:', result.rows[0].c);
  }
});

pool.query('SELECT video_id, title, genre FROM sharks WHERE video_id LIKE \'discogs_%\'', (err, result) => {
  if (err) {
    console.error('Discogs error:', err);
  } else {
    console.log('\nDiscogs tracks in PostgreSQL:', result.rowCount);
    result.rows.slice(0, 5).forEach(r => console.log(`  ${r.video_id} | ${r.title} | ${r.genre}`));
  }
  pool.end();
});