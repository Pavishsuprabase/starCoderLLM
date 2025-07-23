const { Client } = require('pg');

// Supabase Postgres DB credentials (reuse from your existing config)
const dbConfig = {
  host: 'db.uxnofczrtlbiihbxqgpk.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '123456',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};

// Function to execute SQL on Postgres
async function executeSqlOnPostgres(sql) {
  const client = new Client(dbConfig);
  await client.connect();
  try {
    const res = await client.query(sql);
    return res.rows;
  } finally {
    await client.end();
  }
}

// Example: Update a record in a table named 'users'
async function updateUser(id, newEmail) {
  const updateQuery = `
    UPDATE users
    SET email = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  const values = [newEmail, id];

  const client = new Client(dbConfig);
  await client.connect();
  try {
    const res = await client.query(updateQuery, values);
    return res.rows[0];
  } finally {
    await client.end();
  }
}

// Usage example
(async () => {
  try {
    const updatedUser = await updateUser(1, 'newemail@example.com');
    console.log('Updated user:', updatedUser);
  } catch (err) {
    console.error('Error updating user:', err.message || err);
  }
})();
