require('dotenv').config();
const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

ds.initialize().then(async () => {
  const result = await ds.query("SELECT conname FROM pg_constraint WHERE conrelid = 'products'::regclass AND contype = 'u'");
  console.log('Constraints on products:', result);
  for (const row of result) {
    if (row.conname.includes('barcode') || row.conname.startsWith('UQ_')) {
      console.log('Dropping constraint:', row.conname);
      await ds.query(`ALTER TABLE products DROP CONSTRAINT "${row.conname}"`);
    }
  }
  
  // Add multi-tenant unique constraint
  console.log('Adding multi-tenant unique constraint (companyId, barcode)');
  await ds.query(`ALTER TABLE products ADD CONSTRAINT "UQ_company_barcode" UNIQUE ("companyId", "barcode")`);
  console.log('Done');
  process.exit(0);
}).catch(console.error);
