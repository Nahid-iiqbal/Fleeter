const db = require('./db');

const createTablesSQL = `
  -- 1. User Accounts (RBAC)
CREATE TABLE IF NOT EXISTS User_Account (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'driver')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicle Register
CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity_kg NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Driver Register
CREATE TABLE IF NOT EXISTS Driver (
    driver_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES User_Account(user_id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    assigned_vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vehicle Assignments History
CREATE TABLE IF NOT EXISTS Vehicle_Assignment (
    assignment_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    driver_id INT REFERENCES Driver(driver_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP
);

-- 5. Live Tracking Status (Map Snapshot)
CREATE TABLE IF NOT EXISTS Live_Tracking_Status (
    vehicle_id INT PRIMARY KEY REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    speed_kmh NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'moving',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Vehicle Telemetry (Historical GPS Pings)
CREATE TABLE IF NOT EXISTS Vehicle_Telemetry (
    telemetry_id BIGSERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    speed_kmh NUMERIC(5, 2) DEFAULT 0.00,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Routes / Trips
CREATE TABLE IF NOT EXISTS Route_Trip (
    trip_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    driver_id INT REFERENCES Driver(driver_id) ON DELETE SET NULL,
    start_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- 8. Geofences
CREATE TABLE IF NOT EXISTS Geofence (
    geofence_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    center_latitude NUMERIC(10, 8) NOT NULL,
    center_longitude NUMERIC(11, 8) NOT NULL,
    radius_meters NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Vehicle Geofence Monitoring
CREATE TABLE IF NOT EXISTS Vehicle_Geofence (
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    geofence_id INT REFERENCES Geofence(geofence_id) ON DELETE CASCADE,
    PRIMARY KEY (vehicle_id, geofence_id)
);

-- 10. System Alerts / Geofence Breach Logs
CREATE TABLE IF NOT EXISTS System_Alert (
    alert_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- e.g., 'SPEEDING', 'GEOFENCE_EXIT', 'ENGINE_FAULT'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Fuel Logs
CREATE TABLE IF NOT EXISTS Fuel_Log (
    log_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    driver_id INT REFERENCES Driver(driver_id) ON DELETE SET NULL,
    liters NUMERIC(8, 2) NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    odometer_reading NUMERIC(10, 2) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Maintenance Schedule & Logs
CREATE TABLE IF NOT EXISTS Maintenance_Log (
    maintenance_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    service_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

-- 13. Expense Reports
CREATE TABLE IF NOT EXISTS Expense_Report (
    expense_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- e.g., 'Toll', 'Parking', 'Fine', 'Miscellaneous'
    amount NUMERIC(10, 2) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Owner Fuel Analytics View
CREATE OR REPLACE VIEW v_owner_fuel_analytics AS
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.model,
    COALESCE(SUM(f.liters), 0) AS total_liters_consumed,
    COALESCE(SUM(f.cost), 0) AS total_fuel_cost,
    COUNT(f.log_id) AS total_refuel_events
FROM Vehicle v
LEFT JOIN Fuel_Log f ON v.vehicle_id = f.vehicle_id
GROUP BY v.vehicle_id, v.registration_no, v.model;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_time ON Vehicle_Telemetry(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON System_Alert(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON Route_Trip(vehicle_id, status);
`;

async function init() {
  try {
    await db.query(createTablesSQL);
    console.log('✅ Fleeter tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
}

init();