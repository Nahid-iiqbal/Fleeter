const pool = require('./db');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('Clearing old data...');
    
    // Clear existing data to prevent duplicates on multiple runs
    await client.query('TRUNCATE TABLE User_Account, Owner_Profile, Driver, Vehicle, Route CASCADE;');

    console.log('Seeding new data...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Seed Users (Admin, Owner, Driver)
    const adminRes = await client.query(`
      INSERT INTO User_Account (email, password_hash, role) 
      VALUES ('admin@fleeter.com', $1, 'admin') RETURNING user_id;
    `, [defaultPassword]);

    const ownerRes = await client.query(`
      INSERT INTO User_Account (email, password_hash, role) 
      VALUES ('owner@fleeter.com', $1, 'owner') RETURNING user_id;
    `, [defaultPassword]);

    const driverRes = await client.query(`
      INSERT INTO User_Account (email, password_hash, role) 
      VALUES ('driver@fleeter.com', $1, 'driver') RETURNING user_id;
    `, [defaultPassword]);

    const ownerId = ownerRes.rows[0].user_id;
    const driverUserId = driverRes.rows[0].user_id;

    // 2. Seed Owner Profile
    await client.query(`
      INSERT INTO Owner_Profile (user_id, full_name, company_name, phone)
      VALUES ($1, 'Sarah Jenkins', 'Apex Logistics', '555-0100');
    `, [ownerId]);

    // 3. Seed Driver Profile
    const driverProfileRes = await client.query(`
      INSERT INTO Driver (user_id, full_name, license_no, license_type, license_expiry, phone, joined_date)
      VALUES ($1, 'Marcus Wright', 'DL-987654321', 'C', '2028-12-31', '555-0101', CURRENT_DATE) RETURNING driver_id;
    `, [driverUserId]);

    const driverId = driverProfileRes.rows[0].driver_id;

    // 4. Seed a Vehicle
    await client.query(`
      INSERT INTO Vehicle (registration_no, type, brand, model, year, capacity, current_driver_id)
      VALUES ('XYZ-1234', 'truck', 'Volvo', 'FH16', 2023, 15000, $1);
    `, [driverId]);

    // 5. Seed a Route
    await client.query(`
      INSERT INTO Route (route_name, origin, destination, distance_km, estimated_minutes)
      VALUES ('Northern Cargo Run', 'Warehouse A', 'Port Terminal', 45.5, 60);
    `);

    await client.query('COMMIT');
    console.log('Database seeded successfully! You can now log in with:');
    console.log('Email: owner@fleeter.com | Password: password123');
    console.log('Email: driver@fleeter.com | Password: password123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedDatabase();