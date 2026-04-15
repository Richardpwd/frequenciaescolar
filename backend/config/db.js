import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbPort = Number(process.env.DB_PORT || 3306);
const dbName = process.env.DB_NAME || 'avance_frequencia';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool:', err.code, err.message);
});

export async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

export async function initializeDatabase(retries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort,
        multipleStatements: true,
        connectTimeout: 10000,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.query(`USE \`${dbName}\``);

      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      await connection.query(schemaSql);
      return;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[DB] Tentativa ${attempt}/${retries} falhou: ${err.message}. Nova tentativa em ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    } finally {
      if (connection) {
        await connection.end().catch(() => {});
      }
    }
  }
}

export default pool;
