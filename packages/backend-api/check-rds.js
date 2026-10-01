import pg from 'pg';

const pool = new pg.Pool({
  host: 'database-1.chg8k6gqihac.us-east-2.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'Pelusa01?',
  database: 'peruchos',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const users = await client.query(`SELECT id, username, "companyId" FROM users`);
    console.log('USERS:', users.rows);

    const companies = await client.query(`SELECT id, name FROM companies`);
    console.log('COMPANIES:', companies.rows);

    const sales = await client.query(`SELECT id, "companyId", total FROM sales`);
    console.log('SALES:', sales.rows);
  } catch(e) {
    console.error(e.message);
  } finally {
    client.release();
    pool.end();
  }
}
main();
