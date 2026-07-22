const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('🌱 Seeding database with initial data...');

    // 1. Generate hashed password for testing ('password123')
    const hashedPw = await bcrypt.hash('password123', 10);

    // 2. Insert Test Users
    await db.query(`
      INSERT INTO User_Account (full_name, email, password_hash, role)
      VALUES 
        ('Fleet Manager', 'owner@fleeter.com', '${hashedPw}', 'owner'),
        ('John Driver', 'driver@fleeter.com', '${hashedPw}', 'driver')
      ON CONFLICT (email) DO NOTHING;
    `);

    // 3. Insert Sample Vehicle
    await db.query(`
      INSERT INTO Vehicle (registration_no, model, type, capacity_kg)
      VALUES ('DHAKA-METRO-1122', 'Toyota HiAce', 'Van', 1200.00)
      ON CONFLICT (registration_no) DO NOTHING;
    `);

    // 4. Set Initial Live Tracking Position
    await db.query(`
      INSERT INTO Live_Tracking_Status (vehicle_id, latitude, longitude, speed_kmh, status)
      VALUES (1, 23.7276, 90.3929, 45.50, 'moving')
      ON CONFLICT (vehicle_id) DO NOTHING;
    `);

    console.log('✅ Fleeter database seeded successfully!');
    console.log('   Owner login: owner@fleeter.com / password123');
    console.log('   Driver login: driver@fleeter.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seed();