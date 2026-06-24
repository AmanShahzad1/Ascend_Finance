import { query } from '../lib/database';

export async function seedExpenseCategories() {
  try {
    console.log('🌱 Seeding expense categories...');

    // Check if categories already exist
    const existingCategories = await query(
      'SELECT COUNT(*) as count FROM expense_categories WHERE user_id IS NULL'
    );

    if (existingCategories.rows[0].count > 0) {
      console.log('✅ Expense categories already exist, skipping...');
      return;
    }

    // Insert core expense categories (system categories - user_id is NULL)
    const categories = [
      {
        name: 'necessity',
        description: 'Essential expenses like food, rent, transport',
        sort_order: 1
      },
      {
        name: 'investment', 
        description: 'Expenses that bring value or improve life/profession',
        sort_order: 2
      },
      {
        name: 'status',
        description: 'Expenses for luxury, image, or indulgence', 
        sort_order: 3
      },
      {
        name: 'savings',
        description: 'Money set aside for future use',
        sort_order: 4
      }
    ];

    for (const category of categories) {
      await query(
        `INSERT INTO expense_categories (name, description, sort_order, is_active) 
         VALUES ($1, $2, $3, $4)`,
        [category.name, category.description, category.sort_order, true]
      );
      console.log(`✅ Created category: ${category.name}`);
    }

    console.log('🎉 Expense categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding expense categories:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedExpenseCategories()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
