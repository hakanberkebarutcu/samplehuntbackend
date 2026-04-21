const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'C:/Users/PC/myapp/backend/sample_hunt.db';

const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Tables:', tables);

  if (tables.find(t => t.name === 'sharks')) {
    db.all('SELECT COUNT(*) as c FROM sharks', (err, rows) => {
      if (err) console.error('Count error:', err);
      else console.log('Total in SQLite:', rows[0].c);
    });

    db.all('SELECT video_id, title, genre FROM sharks LIMIT 5', (err, rows) => {
      if (err) console.error('Sample error:', err);
      else {
        console.log('\nSample tracks from SQLite:');
        rows.forEach(r => console.log(`  ${r.video_id} | ${r.title} | ${r.genre}`));
      }
      db.close();
    });
  } else {
    console.log('No sharks table found');
    db.close();
  }
});