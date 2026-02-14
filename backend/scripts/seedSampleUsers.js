const db = require('../src/config/database');
const { query, queryOne, execute } = require('../src/utils/dbHelper');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seedSampleUsers() {
  try {
    console.log('Starting sample user seeding...\n');

    // Read sample users from JSON file
    const usersFilePath = path.join(__dirname, 'sampleUsers.json');
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

    console.log(`Found ${usersData.length} users to seed.\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existing = await queryOne(
          'SELECT id FROM users WHERE email = ?',
          [userData.email.toLowerCase()]
        );

        if (existing.rows.length > 0) {
          console.log(`⚠ User already exists: ${userData.email} - Skipping`);
          skipped++;
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Insert user
        await execute(
          `INSERT INTO users (email, password_hash, role, name, rank, designation, unit, badge_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userData.email.toLowerCase(),
            passwordHash,
            userData.role,
            userData.name,
            userData.rank || null,
            userData.designation || null,
            userData.unit || null,
            userData.badge_number || null
          ]
        );

        console.log(`✓ Created user: ${userData.name} (${userData.email}) - ${userData.role}`);
        created++;
      } catch (error) {
        console.error(`✗ Error creating user ${userData.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Seeding Summary:');
    console.log(`  ✓ Created: ${created} users`);
    console.log(`  ⚠ Skipped: ${skipped} users (already exist)`);
    console.log(`  ✗ Errors: ${errors} users`);
    console.log('='.repeat(60));

    if (created > 0) {
      console.log('\n✓ Sample users seeded successfully!');
      console.log('\nDefault passwords:');
      console.log('  - Admin: admin123');
      console.log('  - Personnel: personnel123');
      console.log('  - Supervisors: supervisor123');
      console.log('  - Unit Commanders: commander123');
      console.log('  - Directors: director123');
      console.log('  - Division Chiefs: chief123');
    }

  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedSampleUsers()
    .then(() => {
      console.log('\nSeeding script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding error:', error);
      process.exit(1);
    });
}

module.exports = seedSampleUsers;
