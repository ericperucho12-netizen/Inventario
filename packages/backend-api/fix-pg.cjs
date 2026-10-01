const { Client } = require('pg');

const client = new Client({
  host: 'database-1.chg8k6gqihac.us-east-2.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'Pelusa01?',
  database: 'peruchos',
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  await client.connect();
  const res = await client.query("SELECT * FROM users WHERE username = 'admin'");
  if (res.rows.length === 0) {
     console.log('User not found');
     return;
  }
  const eric = res.rows[0];
  let compId = eric.companyId;

  console.log('Eric:', eric);
  
  if (!compId) {
     console.log('Eric has no companyId. Creating one...');
     const compRes = await client.query("INSERT INTO companies (name, \"isActive\") VALUES ('Peruchos', true) RETURNING id");
     compId = compRes.rows[0].id;
     await client.query("UPDATE users SET \"companyId\" = $1 WHERE username = 'admin'", [compId]);
     console.log('Assigned new companyId:', compId);
  }

  const tables = ['sales', 'purchases', 'cash_shifts', 'products', 'expenses', 'customers', 'suppliers', 'categories', 'users'];
  for (const table of tables) {
     try {
       const updateRes = await client.query(`UPDATE ${table} SET "companyId" = $1 WHERE "companyId" IS NULL`, [compId]);
       console.log(`Updated ${updateRes.rowCount} rows in ${table}`);
     } catch (e) {
       console.error(`Error updating ${table}:`, e.message);
     }
  }

  await client.end();
}

fix();
