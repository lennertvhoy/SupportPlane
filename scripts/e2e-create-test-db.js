const { Pool } = require('pg');

async function main() {
  const dbUrl =
    process.env['DATABASE_URL'] ||
    'postgresql://supportplane:supportplane_dev@localhost:5434/supportplane_e2e?schema=public';

  const match = dbUrl.match(/^(.*):\/\/([^/]+)\/([^?]+)\??/);
  if (!match) {
    throw new Error('Could not parse DATABASE_URL');
  }

  const baseUrl = dbUrl.replace(/\/[^/?]+\?/, '/postgres?');
  const dbName = match[3];

  const pool = new Pool({ connectionString: baseUrl });
  try {
    await pool.query(`CREATE DATABASE "${dbName}";`);
    console.log(`[e2e-db] Created database ${dbName}`);
  } catch (e) {
    if (e.message && e.message.includes('already exists')) {
      console.log(`[e2e-db] Database ${dbName} already exists`);
    } else {
      throw e;
    }
  }
  await pool.end();
}

main().catch((e) => {
  console.error('[e2e-db] Failed to create test database:', e.message);
  process.exit(1);
});
