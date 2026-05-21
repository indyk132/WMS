const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'WMS',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
});

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;
const schema = quoteIdentifier(process.env.DB_SCHEMA || 'public');
const table = (name) => `${schema}.${quoteIdentifier(name)}`;

module.exports = {
    pool,
    table,
};
