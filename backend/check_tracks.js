const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'samplehunt',
  user: 'postgres',
  password: 'berke'
});

pool.query("SELECT COUNT(*) as total FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''")
  .then(r => console.log('Tracks with YouTube ID:', r.rows[0].total))
  .catch(e => console.error('Error:', e.message))
  .finally(() => pool.end());