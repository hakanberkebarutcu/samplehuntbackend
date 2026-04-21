const { Pool } = require('pg');

async function checkReleases() {
  const p = new Pool({ host: 'localhost', port: 5432, database: 'samplehunt', user: 'postgres', password: 'berke' });

  // Get columns
  const cols = await p.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'releases'
    ORDER BY ordinal_position
  `);
  console.log('=== releases columns ===');
  cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));

  // Sample row
  console.log('\n=== Sample row ===');
  const sample = await p.query('SELECT * FROM releases LIMIT 1');
  console.log(Object.keys(sample.rows[0]));

  // Indexes
  const indexes = await p.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'releases'
  `);
  console.log('\n=== Indexes ===');
  indexes.rows.forEach(i => console.log(`  ${i.indexname}: ${i.indexdef}`));

  // Check youtube_id filter
  const withYoutube = await p.query("SELECT COUNT(*) as c FROM releases WHERE youtube_id IS NOT NULL AND youtube_id != ''");
  console.log(`\n=== With YouTube ID: ${withYoutube.rows[0].c} ===`);

  await p.end();
}

checkReleases();