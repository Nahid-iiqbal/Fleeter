const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require('./db');

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Wiping old schema...');
    // This completely removes the old schema and all its tables/views
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');

    console.log('2. Enabling PostGIS...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    console.log('3. Creating new tables...');
    await client.query(`
      -- 1. VENDOR
      CREATE TABLE Vendor (
        vendor_id SERIAL PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        service_type VARCHAR(50) CHECK (service_type IN ('mechanic', 'fuel_station', 'insurance', 'parts_supplier')) NOT NULL,
        contact_name VARCHAR(100),
        phone VARCHAR(15),
        address TEXT
      );

      -- 2. USER_ACCOUNT
      CREATE TABLE User_Account (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('owner', 'driver', 'admin')) NOT NULL DEFAULT 'driver',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. OWNER_PROFILE
      CREATE TABLE Owner_Profile (
        owner_id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        company_name VARCHAR(100),
        phone VARCHAR(15) UNIQUE
      );

      -- 4. DRIVER
      CREATE TABLE Driver (
        driver_id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NULL REFERENCES User_Account(user_id) ON DELETE SET NULL,
        full_name VARCHAR(100) NOT NULL,
        license_no VARCHAR(30) UNIQUE NOT NULL,
        license_type VARCHAR(5) CHECK (license_type IN ('A', 'B', 'C', 'D')) NOT NULL,
        license_expiry DATE NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        address TEXT,
        status VARCHAR(20) CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated')) DEFAULT 'active',
        joined_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. VEHICLE
      CREATE TABLE Vehicle (
        vehicle_id SERIAL PRIMARY KEY,
        registration_no VARCHAR(20) UNIQUE NOT NULL,
        type VARCHAR(20) CHECK (type IN ('bus', 'minibus', 'truck', 'van', 'car')) NOT NULL,
        brand VARCHAR(50),
        model VARCHAR(50),
        year INT,
        capacity INT,
        fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'CNG', 'electric')) DEFAULT 'diesel',
        status VARCHAR(20) CHECK (status IN ('active', 'in_maintenance', 'retired')) DEFAULT 'active',
        last_service_date DATE,
        current_driver_id INT REFERENCES Driver(driver_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. ROUTE
      CREATE TABLE Route (
        route_id SERIAL PRIMARY KEY,
        route_name VARCHAR(100) NOT NULL,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        distance_km NUMERIC(8,2),
        estimated_minutes INT,
        is_active BOOLEAN DEFAULT TRUE
      );

      -- 7. VEHICLE_ASSIGNMENT
      CREATE TABLE Vehicle_Assignment (
        assignment_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        driver_id INT NOT NULL REFERENCES Driver(driver_id) ON DELETE CASCADE,
        assigned_from DATE NOT NULL,
        assigned_to DATE,
        notes TEXT
      );

      -- 8. TRIP
      CREATE TABLE Trip (
        trip_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id),
        driver_id INT NOT NULL REFERENCES Driver(driver_id),
        route_id INT NOT NULL REFERENCES Route(route_id),
        departure_time TIMESTAMP NOT NULL,
        arrival_time TIMESTAMP,
        status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
        fare_collected NUMERIC(10,2) DEFAULT 0.00,
        passenger_count INT DEFAULT 0,
        notes TEXT
      );

      -- 9. MAINTENANCE
      CREATE TABLE Maintenance (
        maintenance_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        vendor_id INT REFERENCES Vendor(vendor_id) ON DELETE SET NULL,
        service_date DATE NOT NULL,
        service_type VARCHAR(20) CHECK (service_type IN ('routine', 'repair', 'inspection', 'emergency')) NOT NULL,
        description TEXT,
        cost NUMERIC(10,2),
        workshop VARCHAR(100),
        mechanic_name VARCHAR(100),
        odometer_km INT,
        next_due_date DATE,
        next_due_km INT
      );

      -- 10. FUEL_LOG
      CREATE TABLE Fuel_Log (
        fuel_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        trip_id INT REFERENCES Trip(trip_id) ON DELETE SET NULL,
        refuel_time TIMESTAMP NOT NULL,
        liters NUMERIC(8,2) NOT NULL,
        cost_per_liter NUMERIC(6,2) NOT NULL,
        total_cost NUMERIC(10,2),
        odometer_km INT,
        station_name VARCHAR(100)
      );

      -- 11. INCIDENT
      CREATE TABLE Incident (
        incident_id SERIAL PRIMARY KEY,
        trip_id INT REFERENCES Trip(trip_id) ON DELETE SET NULL,
        driver_id INT REFERENCES Driver(driver_id) ON DELETE SET NULL,
        incident_date DATE NOT NULL,
        type VARCHAR(50) CHECK (type IN ('accident', 'breakdown', 'traffic_violation', 'theft', 'other')) NOT NULL,
        description TEXT,
        severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'major')) DEFAULT 'minor',
        damage_cost NUMERIC(10,2) DEFAULT 0.00,
        reported_to VARCHAR(100),
        resolved BOOLEAN DEFAULT FALSE
      );

      -- 12. VEHICLE_TELEMETRY
      CREATE TABLE Vehicle_Telemetry (
        telemetry_id BIGSERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        trip_id INT REFERENCES Trip(trip_id) ON DELETE SET NULL,
        geom GEOMETRY(Point, 4326) NOT NULL,
        speed_kmh NUMERIC(5, 2) DEFAULT 0.00,
        heading INT,
        altitude NUMERIC(6, 2),
        battery_level INT,
        ping_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 13. LIVE_TRACKING_STATUS
      CREATE TABLE Live_Tracking_Status (
        vehicle_id INT PRIMARY KEY REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        geom GEOMETRY(Point, 4326) NOT NULL,
        speed_kmh NUMERIC(5, 2) NOT NULL,
        heading INT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) CHECK (status IN ('moving', 'idling', 'stopped', 'offline')) DEFAULT 'offline'
      );

      -- 14. VEHICLE_DOCUMENT
      CREATE TABLE Vehicle_Document (
        document_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
        document_type VARCHAR(50) CHECK (document_type IN ('fitness_certificate', 'tax_token', 'insurance_policy', 'route_permit')) NOT NULL,
        document_no VARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        alert_triggered BOOLEAN DEFAULT FALSE
      );
    `);

    console.log('4. Creating Views and Indexes...');
    await client.query(`
      CREATE VIEW v_owner_fuel_analytics AS
      SELECT 
          f.vehicle_id,
          v.registration_no,
          f.refuel_time,
          f.liters,
          f.total_cost,
          (f.odometer_km - LAG(f.odometer_km, 1) OVER (PARTITION BY f.vehicle_id ORDER BY f.refuel_time)) AS distance_driven_km,
          (f.odometer_km - LAG(f.odometer_km, 1) OVER (PARTITION BY f.vehicle_id ORDER BY f.refuel_time)) / f.liters AS km_per_liter
      FROM Fuel_Log f
      JOIN Vehicle v ON f.vehicle_id = v.vehicle_id;

      CREATE INDEX idx_trip_vehicle  ON Trip(vehicle_id);
      CREATE INDEX idx_trip_driver   ON Trip(driver_id);
      CREATE INDEX idx_maintenance_vehicle ON Maintenance(vehicle_id);
      CREATE INDEX idx_fuel_vehicle  ON Fuel_Log(vehicle_id);
      CREATE INDEX idx_telemetry_v_time ON Vehicle_Telemetry(vehicle_id, ping_time DESC);
      CREATE INDEX idx_telemetry_geom ON Vehicle_Telemetry USING GIST (geom);
      CREATE INDEX idx_live_status_geom ON Live_Tracking_Status USING GIST (geom);
    `);

    await client.query('COMMIT');
    console.log('SUCCESS: Old schema replaced with the new unified schema!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error replacing schema:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

initializeDatabase();