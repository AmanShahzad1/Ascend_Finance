import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from '../lib/schema';
import { testConnection, closePool } from '../lib/database';

// Load environment variables from .env.local
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env.local'),
  override: true 
});

async function main() {
  console.log('🚀 Initializing AscenD Finance Database...');
  
  // Check if DATABASE_URL is provided
  if (process.env.DATABASE_URL) {
    console.log('📡 Using DATABASE_URL for connection...');
  } else {
    console.log('📡 Using individual database variables for connection...');
  }
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your connection settings.');
      if (process.env.DATABASE_URL) {
        console.error('💡 Make sure your DATABASE_URL is correct and accessible.');
      } else {
        console.error('💡 Make sure PostgreSQL is running and your .env.local file is configured correctly.');
      }
      process.exit(1);
    }
    
    // Initialize database with tables
    await initializeDatabase();
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('📊 You can now start the application with: npm run dev');
    
  } catch (error) {
    console.error('💥 Database initialization failed:', error);
    console.error('💡 Common issues:');
    console.error('   - PostgreSQL not running');
    console.error('   - Wrong database credentials in .env.local');
    console.error('   - Database does not exist');
    console.error('   - Connection timeout');
    process.exit(1);
  } finally {
    // Close the database connection pool
    await closePool();
  }
}

main();
