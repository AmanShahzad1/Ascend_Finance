import { seedExpenseCategories } from './seed-categories';

async function main() {
  try {
    console.log('🚀 Starting database seeding...');
    await seedExpenseCategories();
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

main();
