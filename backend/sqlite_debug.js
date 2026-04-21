const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('C:/Users/PC/myapp/backend/sample_hunt.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  console.log('Tables:', tables);

  db.all('PRAGMA table_info(tracks)', (err, columns) => {
    console.log('\nTracks columns:', columns);
  });

  db.all('SELECT COUNT(*) as c, GROUP_CONCAT(video_id) as ids FROM tracks', (err, rows) => {
    if (err) console.error('Error:', err);
    else {
      console.log('\nCount:', rows[0].c);
      console.log('Video IDs:', rows[0].ids);
    }
    db.close();
  });
});