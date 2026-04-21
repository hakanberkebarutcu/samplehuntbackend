const { Client } = require('pg');

async function getDiscogsTracks() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'samplehunt',
    user: 'postgres',
    password: 'berke'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT video_id, title, url, genre, country FROM sharks');
    return res.rows.map(row => ({
      videoId: row.video_id,
      title: row.title,
      url: row.url,
      genre: row.genre ? [row.genre] : [],
      country: row.country
    }));
  } catch (err) {
    console.error('PostgreSQL bağlantı hatası:', err.message);
    return [];
  } finally {
    await client.end();
  }
}

module.exports = { getDiscogsTracks };