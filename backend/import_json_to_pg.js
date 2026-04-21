const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "samplehunt",
  user: "postgres",
  password: "berke",
});

async function importTracks() {
  const jsonData = JSON.parse(fs.readFileSync("../mobile_tracks.json", "utf-8"));
  const tracks = jsonData.tracks;

  console.log(`Found ${tracks.length} tracks in JSON`);

  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    const queries = batch.map((track) => {
      return new Promise((res, rej) => {
        const videoId = track.videoId || null;
        const title = track.title || "";
        const artist = track.artist || "";
        const fullTitle = artist ? `${artist} - ${title}` : title;
        const url = `https://youtube.com/watch?v=${videoId}`;
        const bpm = track.bpm || null;
        const trackKey = track.key || null;
        const viewCount = track.viewCount || 0;
        const genre = Array.isArray(track.genre) ? track.genre.join(",") : (track.genre || "");
        const country = track.country || "";

        pool.query(
          `INSERT INTO sharks (video_id, title, url, bpm, "key", view_count, genre, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (video_id) DO UPDATE SET
             title = EXCLUDED.title,
             url = EXCLUDED.url,
             view_count = EXCLUDED.view_count,
             bpm = EXCLUDED.bpm,
             "key" = EXCLUDED."key",
             genre = EXCLUDED.genre,
             country = EXCLUDED.country`,
          [videoId, fullTitle, url, bpm, trackKey, viewCount, genre, country],
          (err) => {
            if (err) {
              console.error("Error for", videoId, err.message);
              rej(err);
            } else {
              inserted++;
              res();
            }
          }
        );
      });
    });

    await Promise.allSettled(queries);
    console.log(`Progress: ${Math.min(i + batchSize, tracks.length)}/${tracks.length}`);
  }

  console.log(`\nTotal inserted: ${inserted}`);
}

importTracks()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import failed:", err);
    pool.end();
    process.exit(1);
  });