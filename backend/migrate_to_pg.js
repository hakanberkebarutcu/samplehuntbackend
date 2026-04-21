const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const sqliteDb = new sqlite3.Database('C:/Users/PC/myapp/backend/sample_hunt.db');
const pgPool = new Pool({
  host: "localhost",
  port: 5432,
  database: "samplehunt",
  user: "postgres",
  password: "berke",
});

function migrateTracks() {
  return new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM tracks', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Found ' + rows.length + ' tracks in SQLite');

      let inserted = 0;

      function insertBatch(start) {
        if (start >= rows.length) {
          resolve({ inserted });
          return;
        }

        const batch = rows.slice(start, start + 50);
        const queries = batch.map(row => {
          return new Promise((res, rej) => {
            const videoId = row.videoId || 'sqlite_' + row.id;
            const title = (row.artist ? row.artist + ' - ' : '') + (row.title || '');
            const url = '';
            const bpm = row.bpm || null;
            const trackKey = row.key || null;
            const viewCount = row.viewCount || 0;
            const genre = row.genre || '';
            const country = row.country || '';

            pgPool.query(
              'INSERT INTO sharks (video_id, title, url, bpm, "key", view_count, genre, country) ' +
              'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
              'ON CONFLICT (video_id) DO UPDATE SET ' +
              '  title = EXCLUDED.title, url = EXCLUDED.url, view_count = EXCLUDED.view_count, ' +
              '  bpm = EXCLUDED.bpm, "key" = EXCLUDED."key", genre = EXCLUDED.genre, country = EXCLUDED.country',
              [videoId, title, url, bpm, trackKey, viewCount, genre, country],
              (pgErr) => {
                if (pgErr) {
                  console.error('Error: ' + videoId, pgErr.message);
                  rej(pgErr);
                } else {
                  inserted++;
                  res();
                }
              }
            );
          });
        });

        Promise.allSettled(queries).then(() => {
          console.log('Progress: ' + Math.min(start + 50, rows.length) + '/' + rows.length);
          insertBatch(start + 50);
        });
      }

      insertBatch(0);
    });
  });
}

migrateTracks()
  .then(result => {
    console.log('\nMigration complete!');
    console.log('Inserted: ' + result.inserted);
    sqliteDb.close();
    pgPool.end();
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    sqliteDb.close();
    pgPool.end();
    process.exit(1);
  });