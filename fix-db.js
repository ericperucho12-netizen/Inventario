const { DataSource } = require('typeorm');
const ds = new DataSource({type: 'sqlite', database: 'packages/backend-api/peruchos.sqlite'});
ds.initialize().then(async () => {
  const tables = ['sales', 'purchases', 'cash_shifts', 'products', 'expenses', 'customers', 'suppliers', 'categories'];
  for (const table of tables) {
    try {
      await ds.query(`ALTER TABLE ${table} ADD COLUMN companyId varchar`);
      console.log('Added to', table);
    } catch (e) {
      console.log('Failed or already exists for', table, e.message);
    }
  }
  
  // Set all companyId to ericperucho12's companyId
  const user = await ds.query('SELECT companyId FROM users WHERE username = "ericperucho12"');
  if (user && user.length > 0) {
    const compId = user[0].companyId;
    console.log('Eric companyId:', compId);
    for (const table of tables) {
      await ds.query(`UPDATE ${table} SET companyId = ? WHERE companyId IS NULL`, [compId]);
    }
  }
  
  ds.destroy();
});
