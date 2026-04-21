const { Pool } = require('pg');

async function checkDatabases() {
  const dbs = ['samplehunt', 'samplhunt', 'sample_hunt'];

  for (const db of dbs) {
    const p = new Pool({ host: 'localhost', port: 5432, database: db, user: 'postgres', password: 'berke' });
    try {
      const result = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
      console.log(`\n=== ${db} ===`);
      if (result.rows.length === 0) {
        console.log('  (no tables)');
      } else {
        result.rows.forEach(t => console.log('  ' + t.table_name));
      }

      // Get row counts for each table
      for (const row of result.rows) {
        const countResult = await p.query(`SELECT COUNT(*) as c FROM "${row.table_name}"`);
        console.log(`    -> ${countResult.rows[0].c} rows`);
      }
    } catch (e) {
      console.log(`\n=== ${db} === ERROR: ${e.message}`);
    } finally {
      await p.end();
    }
  }
}

checkDatabases();