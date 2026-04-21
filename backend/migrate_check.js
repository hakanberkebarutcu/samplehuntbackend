const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('C:/Users/PC/myapp/backend/sample_hunt.db');

db.all('SELECT COUNT(*) as c FROM sharks', (err, rows) => {
  if (err) {
    console.error('Total error:', err);
  } else {
    console.log('Total tracks in SQLite:', rows[0].c);
  }
});

db.all('SELECT video_id, title, genre FROM sharks WHERE video_id LIKE "discogs_%" LIMIT 5', (err, rows) => {
  if (err) {
    console.error('Discogs error:', err);
  } else {
    console.log('\nDiscogs tracks sample:');
    rows.forEach(r => console.log(`  ${r.video_id} | ${r.title} | ${r.genre}`));
  }
  db.close();
});