const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "samplehunt",
  user: "postgres",
  password: "berke",
});

pool.query('SELECT video_id, LENGTH(video_id) as len FROM sharks ORDER BY len DESC LIMIT 10', (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Top 10 longest video_ids:');
    result.rows.forEach(r => console.log('  ' + r.video_id + ' (' + r.len + ')'));
  }
  pool.end();
});