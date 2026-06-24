import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ 
    path: envPath,
    override: true 
  });
}

// Database configuration - supports both DATABASE_URL and individual variables
const isAzureConnection = process.env.DATABASE_URL?.includes('azure.com');

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isAzureConnection ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: isAzureConnection ? 10000 : 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ascend_finance',
      user: process.env.DB_USER || 'username',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// Create a new pool instance
const pool = new Pool(dbConfig);

// Test the database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Execute a query with error handling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const duration = Date.now() - start;
    // console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async () => {
  return await pool.connect();
};

// Close the pool (call this when shutting down the app)
export const closePool = async () => {
  await pool.end();
};

export default pool;
