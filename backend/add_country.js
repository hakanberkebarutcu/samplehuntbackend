const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'samplehunt',
  user: 'postgres',
  password: 'berke'
});

pool.query('ALTER TABLE releases ADD COLUMN IF NOT EXISTS country VARCHAR(100)')
  .then(() => {
    console.log('Country column added');
    return pool.query('CREATE INDEX IF NOT EXISTS idx_releases_country ON releases(country)');
  })
  .then(() => console.log('Country index created'))
  .catch(e => console.error('Error:', e.message))
  .finally(() => pool.end());