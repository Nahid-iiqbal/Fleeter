const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("1. Wiping old schema...");
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");

    console.log("2. Enabling PostGIS...");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

    console.log("3. Creating Enterprise Tables...");
    await client.query(`
      -- 1. VENDOR
      CREATE TABLE Vendor (
        vendor_id SERIAL PRIMARY KEY,
        owner_id INT NULL, 
        company_name VARCHAR(100) NOT NULL,
        service_type VARCHAR(50) NOT NULL, 
        contact_name VARCHAR(100),
        phone VARCHAR(15),
        address TEXT
      );

      -- 2. USER_ACCOUNT
      CREATE TABLE User_Account (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'driver', 'admin')),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. OWNER_PROFILE
      CREATE TABLE Owner_Profile (
        owner_id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
        company_name VARCHAR(100)
      );

      -- 4. MANAGER_PROFILE
      CREATE TABLE Manager_Profile (
        manager_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
        owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        employee_id VARCHAR(50),
        phone VARCHAR(15),
        department VARCHAR(50),
        UNIQUE (user_id, owner_id),
        UNIQUE (owner_id, employee_id)
      );

      -- 5. DRIVER
      CREATE TABLE Driver (
          driver_id   SERIAL PRIMARY KEY,
          user_id     INT NULL,
          owner_id    INT NULL,
          full_name   VARCHAR(100) NOT NULL,
          phone       VARCHAR(15),
          status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated')),
          joined_date DATE NOT NULL,
          created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES User_Account(user_id) ON DELETE SET NULL,
          FOREIGN KEY (owner_id) REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
          UNIQUE (user_id) -- CHANGED: Ensures one user account = one driver profile globally
      );

      -- 6. VEHICLE
      CREATE TABLE Vehicle (
        vehicle_id SERIAL PRIMARY KEY,
        owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
        registration_no VARCHAR(20) UNIQUE NOT NULL,
        brand VARCHAR(50),
        type VARCHAR(20) NOT NULL,
        model VARCHAR(50),
        year INTEGER,
        capacity INT,
        fuel_type VARCHAR(20),
        last_service_date DATE,
        condition_status VARCHAR(20) DEFAULT 'active' CHECK (condition_status IN ('active', 'in_maintenance', 'retired', 'sold')),
        availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'dispatched'))
      );

      -- 7. ROUTE
      CREATE TABLE Route (
        route_id SERIAL PRIMARY KEY,
        owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
        route_name VARCHAR(100) NOT NULL,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        distance_km NUMERIC(8,2),
        est_mins INT,
        is_active BOOLEAN DEFAULT TRUE
      );

      -- 8. TRIP
      CREATE TABLE Trip (
        trip_id SERIAL PRIMARY KEY,
        owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE RESTRICT,
        driver_id INT NOT NULL REFERENCES Driver(driver_id) ON DELETE RESTRICT,
        route_id INT NULL REFERENCES Route(route_id) ON DELETE RESTRICT,
        origin_address VARCHAR(255),
        destination_address VARCHAR(255),
        departure_time TIMESTAMPTZ NOT NULL,
        arrival_time TIMESTAMPTZ,
        start_odometer INT NOT NULL,
        end_odometer INT,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        cargo_or_passengers TEXT,
        notes TEXT,
        dispatched_by INT REFERENCES User_Account(user_id) ON DELETE SET NULL,
        CHECK (arrival_time IS NULL OR arrival_time >= departure_time),
        CHECK (end_odometer IS NULL OR end_odometer >= start_odometer),
        CHECK ((route_id IS NOT NULL) OR (origin_address IS NOT NULL AND destination_address IS NOT NULL))
      );

      -- 9. MAINTENANCE
      CREATE TABLE Maintenance (
        maintenance_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        vendor_id INT REFERENCES Vendor(vendor_id) ON DELETE SET NULL,
        service_date DATE NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        description TEXT,
        cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
        workshop VARCHAR(100),
        mechanic_name VARCHAR(100),
        odometer_km INT,
        next_due_date DATE,
        next_due_km INT,
        logged_by INT REFERENCES User_Account(user_id) ON DELETE SET NULL
      );

      -- 10. FUEL_LOG
      CREATE TABLE Fuel_Log (
        fuel_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        trip_id INT NULL REFERENCES Trip(trip_id) ON DELETE SET NULL,
        refuel_time TIMESTAMPTZ NOT NULL,
        liters NUMERIC(8,2) NOT NULL CHECK (liters > 0),
        cost_per_liter NUMERIC(6,2) NOT NULL CHECK (cost_per_liter >= 0),
        total_cost NUMERIC(10,2) NOT NULL CHECK (total_cost >= 0),
        odometer_km INT,
        station_name VARCHAR(100),
        logged_by INT REFERENCES User_Account(user_id) ON DELETE SET NULL
      );

      -- 11. INCIDENT
      CREATE TABLE Incident (
        incident_id SERIAL PRIMARY KEY,
        trip_id INT NOT NULL REFERENCES Trip(trip_id) ON DELETE CASCADE,
        incident_date TIMESTAMPTZ NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
        damage_cost NUMERIC(10,2) DEFAULT 0.00 CHECK (damage_cost >= 0),
        reported_to VARCHAR(100),
        logged_by INT REFERENCES User_Account(user_id) ON DELETE SET NULL,
        resolved BOOLEAN DEFAULT FALSE
      );

      -- 12. DRIVER_DOCUMENT
      CREATE TABLE Driver_Document (
        document_id SERIAL PRIMARY KEY,
        driver_id INT NOT NULL REFERENCES Driver(driver_id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        document_no VARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        alert_triggered BOOLEAN DEFAULT FALSE,
        CHECK (expiry_date >= issue_date)
      );

      -- 13. VEHICLE_DOCUMENT
      CREATE TABLE Vehicle_Document (
        document_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        document_no VARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        alert_triggered BOOLEAN DEFAULT FALSE,
        CHECK (expiry_date >= issue_date)
      );

      -- 14. VEHICLE_TELEMETRY (PostGIS enabled, Partitioned)
      CREATE TABLE Vehicle_Telemetry (
        telemetry_id BIGSERIAL,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        trip_id INT REFERENCES Trip(trip_id) ON DELETE SET NULL,
        geom GEOMETRY(Point, 4326) NOT NULL,
        speed_kmh NUMERIC(5, 2) DEFAULT 0.00,
        altitude NUMERIC(6, 2),
        battery_level INT CHECK (battery_level BETWEEN 0 AND 100),
        ping_time TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (telemetry_id, ping_time)
      ) PARTITION BY RANGE (ping_time);

      -- Initial Partition for current month (August 2026)
      CREATE TABLE telemetry_y2026m08 PARTITION OF Vehicle_Telemetry
        FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
    `);

    console.log("4. Creating Views and Indexes...");
    await client.query(`
      CREATE VIEW v_vehicle_expense_ledger AS
      SELECT 
          vehicle_id, 
          'fuel' AS category, 
          total_cost AS amount, 
          refuel_time AS expense_date, 
          fuel_id AS reference_id 
      FROM Fuel_Log
      UNION ALL
      SELECT 
          vehicle_id, 
          'maintenance' AS category, 
          cost AS amount, 
          service_date::timestamptz AS expense_date, 
          maintenance_id AS reference_id 
      FROM Maintenance
      UNION ALL
      SELECT 
          t.vehicle_id,
          'incident' AS category, 
          i.damage_cost AS amount, 
          i.incident_date AS expense_date, 
          i.incident_id AS reference_id 
      FROM Incident i
      JOIN Trip t ON i.trip_id = t.trip_id;

      CREATE VIEW v_vehicle_cost_summary AS
      SELECT 
          v.vehicle_id,
          v.owner_id,
          v.registration_no,
          v.brand,
          v.model,
          COALESCE(SUM(el.amount), 0.00) AS total_expenses_incurred
      FROM Vehicle v
      LEFT JOIN v_vehicle_expense_ledger el ON v.vehicle_id = el.vehicle_id
      GROUP BY v.vehicle_id, v.owner_id, v.registration_no, v.brand, v.model;

      CREATE INDEX idx_trip_owner          ON Trip(owner_id);
      CREATE INDEX idx_trip_vehicle        ON Trip(vehicle_id);
      CREATE INDEX idx_trip_driver         ON Trip(driver_id);
      CREATE INDEX idx_maintenance_vehicle ON Maintenance(vehicle_id);
      CREATE INDEX idx_fuel_vehicle        ON Fuel_Log(vehicle_id);
      CREATE INDEX idx_incident_trip       ON Incident(trip_id);
      CREATE INDEX idx_telemetry_trip      ON Vehicle_Telemetry(trip_id, ping_time DESC);
      CREATE INDEX idx_telemetry_geom      ON Vehicle_Telemetry USING GIST (geom);
    `);

    await client.query("COMMIT");
    console.log(
      "SUCCESS: Old schema replaced with the new optimized enterprise schema!",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error replacing schema:", error);
  } finally {
    client.release();
    process.exit(0);
  }
};

initializeDatabase();
