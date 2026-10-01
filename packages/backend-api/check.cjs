const { Client } = require('pg');
const c = new Client({
  host: 'database-1.chg8k6gqihac.us-east-2.rds.amazonaws.com', 
  port: 5432, 
  user: 'postgres', 
  password: 'Pelusa01?', 
  database: 'peruchos', 
  ssl: { rejectUnauthorized: false }
});

c.connect().then(() => 
  Promise.all(['sales', 'products', 'cash_shifts', 'categories'].map(t => 
    c.query(`SELECT count(*), "companyId" FROM ${t} GROUP BY "companyId"`).then(r => console.log(t, r.rows))
  ))
).then(() => c.end());
