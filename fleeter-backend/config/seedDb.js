const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");
const bcrypt = require("bcrypt");

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("1. Clearing old data...");

    // TRUNCATE CASCADE handles all foreign key dependencies automatically
    await client.query(`
      TRUNCATE TABLE
        User_Account, Token_Blacklist, Owner_Profile, Manager_Profile, Driver,
        Company_Request,
        Vehicle, Route, Trip, Maintenance, Fuel_Log, Incident,
        Driver_Document, Vehicle_Document, Vehicle_Telemetry
      CASCADE;
    `);

    console.log("2. Hashing default passwords...");
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("pass", salt);

    console.log("3. Seeding User Accounts...");

    // Admin
    await client.query(
      `
      INSERT INTO User_Account (username, email, password_hash, role)
      VALUES ('admin_super', 'admin@fleeter.com', $1, 'admin');
    `,
      [defaultPassword],
    );

    // Owner
    const ownerUserRes = await client.query(
      `
      INSERT INTO User_Account (username, email, password_hash, role)
      VALUES ('apex_boss', 'owner@fleeter.com', $1, 'owner') RETURNING user_id;
    `,
      [defaultPassword],
    );
    const ownerUserId = ownerUserRes.rows[0].user_id;

    // Manager / Dispatcher
    const managerUserRes = await client.query(
      `
      INSERT INTO User_Account (username, email, password_hash, role)
      VALUES ('apex_dispatch', 'manager@fleeter.com', $1, 'manager') RETURNING user_id;
    `,
      [defaultPassword],
    );
    const managerUserId = managerUserRes.rows[0].user_id;

    // Drivers
    const driver1UserRes = await client.query(
      `
      INSERT INTO User_Account (username, email, password_hash, role)
      VALUES ('marcus_w', 'driver1@fleeter.com', $1, 'driver') RETURNING user_id;
    `,
      [defaultPassword],
    );
    const driver1UserId = driver1UserRes.rows[0].user_id;

    const driver2UserRes = await client.query(
      `
      INSERT INTO User_Account (username, email, password_hash, role)
      VALUES ('leo_h', 'driver2@fleeter.com', $1, 'driver') RETURNING user_id;
    `,
      [defaultPassword],
    );

    console.log("4. Seeding Tenant Profiles (Owner, Manager, Drivers)...");

    // Owner Profile
    const ownerRes = await client.query(
      `
      INSERT INTO Owner_Profile (user_id, company_name)
      VALUES ($1, 'Apex Logistics Inc.') RETURNING owner_id;
    `,
      [ownerUserId],
    );
    const ownerId = ownerRes.rows[0].owner_id;

    // Manager Profile
    await client.query(
      `
      INSERT INTO Manager_Profile (user_id, owner_id, full_name, employee_id, phone, department)
      VALUES ($1, $2, 'Sarah Jenkins', 'EMP-001', '555-0100', 'Operations');
    `,
      [managerUserId, ownerId],
    );

    // Driver Profiles
    const driver1Res = await client.query(
      `
      INSERT INTO Driver (user_id, owner_id, full_name, phone, joined_date)
      VALUES ($1, $2, 'Marcus Wright', '555-0101', '2025-01-15') RETURNING driver_id;
    `,
      [driver1UserId, ownerId],
    );
    const driver1Id = driver1Res.rows[0].driver_id;

    const driver2Res = await client.query(
      `
      INSERT INTO Driver (user_id, owner_id, full_name, phone, joined_date)
      VALUES ($1, $2, 'Leo Hernandez', '555-0102', '2026-03-10') RETURNING driver_id;
    `,
      [driver2UserRes.rows[0].user_id, ownerId],
    );
    const driver2Id = driver2Res.rows[0].driver_id;

    console.log("5. Seeding Documents...");
    await client.query(
      `
      INSERT INTO Driver_Document (driver_id, document_type, document_no, issue_date, expiry_date)
      VALUES
      ($1, 'driving_license', 'DL-987654321', '2023-01-01', '2028-12-31'),
      ($2, 'driving_license', 'DL-123456789', '2024-05-15', '2029-05-15');
    `,
      [driver1Id, driver2Id],
    );

    console.log("6. Seeding Vehicles...");
    const vehicle1Res = await client.query(
      `
      INSERT INTO Vehicle (owner_id, registration_no, type, brand, model, year, capacity, fuel_type)
      VALUES ($1, 'XYZ-1234', 'truck', 'Volvo', 'FH16', 2023, 15000, 'diesel') RETURNING vehicle_id;
    `,
      [ownerId],
    );
    const vehicle1Id = vehicle1Res.rows[0].vehicle_id;

    const vehicle2Res = await client.query(
      `
      INSERT INTO Vehicle (owner_id, registration_no, type, brand, model, year, capacity, fuel_type)
      VALUES ($1, 'ABC-9876', 'van', 'Ford', 'Transit', 2024, 3000, 'petrol') RETURNING vehicle_id;
    `,
      [ownerId],
    );

    console.log("7. Seeding Routes & Trips...");
    const routeRes = await client.query(
      `
      INSERT INTO Route (owner_id, route_name, origin, destination, distance_km, est_mins)
      VALUES ($1, 'Northern Cargo Run', 'Warehouse A', 'Port Terminal', 45.5, 60) RETURNING route_id;
    `,
      [ownerId],
    );
    const routeId = routeRes.rows[0].route_id;

    const tripRes = await client.query(
      `
      INSERT INTO Trip (owner_id, vehicle_id, driver_id, route_id, departure_time, start_odometer, status, dispatched_by)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 12500, 'in_progress', $5) RETURNING trip_id;
    `,
      [ownerId, vehicle1Id, driver1Id, routeId, managerUserId],
    );
    const tripId = tripRes.rows[0].trip_id;

    console.log("8. Seeding Financials (Fuel Log)...");
    await client.query(
      `
      INSERT INTO Fuel_Log (vehicle_id, trip_id, refuel_time, liters, cost_per_liter, odometer_km, station_name, logged_by)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 50.00, 1.50, 12500, 'Highway Shell', $3);
    `,
      [vehicle1Id, tripId, driver1UserId], // Fixed: Passes user_id instead of driver_id
    );

    await client.query("COMMIT");

    console.log("\n=============================================");
    console.log("🎉 DATABASE SEEDED SUCCESSFULLY! 🎉");
    console.log("=============================================");
    console.log("You can now log in using email OR username:");
    console.log("---------------------------------------------");
    console.log("👑 OWNER   | email: owner@fleeter.com   | user: apex_boss");
    console.log(
      "💼 MANAGER | email: manager@fleeter.com | user: apex_dispatch",
    );
    console.log("🚚 DRIVER  | email: driver1@fleeter.com | user: marcus_w");
    console.log("---------------------------------------------");
    console.log("Password for all accounts: pass\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", error);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedDatabase();
