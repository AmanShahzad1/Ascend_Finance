import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ 
    path: envPath,
    override: true 
  });
}

// Database configuration - supports both DATABASE_URL and individual variables
const dbConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
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

async function deploySchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Connecting to deployed database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to deployed database successfully');
    
    // Read the SQL file
    const sqlPath = path.resolve(process.cwd(), 'deploy-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing schema deployment...');
    
    // Execute the SQL
    await client.query(sqlContent);
    
    console.log('✅ Schema deployed successfully!');
    console.log('🎉 Your AscenD Finance database is ready for production!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error);
    console.error('💡 Common issues:');
    console.error('   - Database connection failed');
    console.error('   - Insufficient permissions');
    console.error('   - Database already has conflicting tables');
    console.error('   - Network connectivity issues');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the deployment
deploySchema();
