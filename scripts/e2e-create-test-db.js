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
    // Terminate existing connections to allow drop/create
    await pool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid();`,
      [dbName],
    );
    await pool.query(`DROP DATABASE IF EXISTS "${dbName}";`);
    await pool.query(`CREATE DATABASE "${dbName}";`);
    console.log(`[e2e-db] Recreated database ${dbName}`);
  } catch (e) {
    console.error('[e2e-db] Failed to recreate test database:', e.message);
    throw e;
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('[e2e-db] Failed to create test database:', e.message);
  process.exit(1);
});
