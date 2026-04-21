const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'samplehunt',
  user: 'postgres',
  password: 'berke'
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'country'")
  .then(r => {
    console.log('Columns with country:', r.rows);
    return pool.query("SELECT COUNT(*) as total FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''");
  })
  .then(r => {
    console.log('Total tracks:', r.rows[0]);
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });