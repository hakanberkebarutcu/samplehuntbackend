const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'samplehunt',
  user: 'postgres',
  password: 'berke'
});

pool.query("SELECT id, youtube_id, title, artist FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != '' LIMIT 5")
  .then(r => {
    console.log('Sample tracks:');
    r.rows.forEach(row => console.log(row));
  })
  .catch(e => console.error('Error:', e.message))
  .finally(() => pool.end());