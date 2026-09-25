-- 1. USER ACCOUNT
CREATE TABLE User_Account (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'owner', 'manager', 'driver')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    profile_picture_url TEXT
);

CREATE TABLE Token_Blacklist (
    token VARCHAR(512) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL
);

-- 2. OWNER PROFILE
CREATE TABLE Owner_Profile (
    owner_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20)
);

-- 3. MANAGER PROFILE
CREATE TABLE Manager_Profile (
    manager_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
    owner_id INT REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE Company_Request (
    request_id SERIAL PRIMARY KEY,
    manager_user_id INT NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
    owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 4. DRIVER
CREATE TABLE Driver (
    driver_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
    owner_id INT REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'dispatched', 'on_leave')),
    joined_date DATE DEFAULT CURRENT_DATE
);

-- 5. VEHICLE
CREATE TABLE Vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(50),
    type VARCHAR(30) NOT NULL,
    model VARCHAR(50),
    year INT,
    capacity INT,
    fuel_type VARCHAR(20),
    condition_status VARCHAR(20) DEFAULT 'good'
      CHECK (condition_status IN ('good', 'needs_service', 'in_maintenance', 'retired')),
    availability_status VARCHAR(20) DEFAULT 'available'
      CHECK (availability_status IN ('available', 'dispatched', 'reserved', 'unavailable')),
    registration_document_url TEXT
);

CREATE TABLE Vehicle_Image (
    image_id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. ROUTE
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

-- 7. TRIP
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
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    cargo_type VARCHAR(20) CHECK (cargo_type IN ('cargo', 'passengers')),
    notes TEXT,
    dispatched_by INT REFERENCES User_Account(user_id) ON DELETE SET NULL,
    CHECK (arrival_time IS NULL OR arrival_time >= departure_time),
    CHECK ((route_id IS NOT NULL) OR (origin_address IS NOT NULL AND destination_address IS NOT NULL))
);

-- 8. VENDOR
CREATE TABLE Vendor (
    vendor_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
    vendor_name VARCHAR(100) NOT NULL,
    vendor_category VARCHAR(50),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- 10. ALERTS & FUEL LOG

CREATE TABLE Message (
    message_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE System_Alert (
    alert_id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
    alert_type VARCHAR(40) NOT NULL,
    reference_type VARCHAR(40) NOT NULL,
    reference_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    about VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (owner_id, alert_type, reference_type, reference_id)
);

CREATE TABLE Fuel_Log (
    fuel_id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    trip_id INT NULL REFERENCES Trip(trip_id) ON DELETE SET NULL,
    refuel_time TIMESTAMPTZ NOT NULL,
    liters NUMERIC(8,2) NOT NULL CHECK (liters > 0),
    cost_per_liter NUMERIC(6,2) NOT NULL CHECK (cost_per_liter >= 0),
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
    resolved BOOLEAN DEFAULT FALSE,
    image_url TEXT
);

-- 12. DOCUMENTS
CREATE TABLE Driver_Document (
    document_id SERIAL PRIMARY KEY,
    driver_id INT NOT NULL REFERENCES Driver(driver_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_no VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    alert_triggered BOOLEAN DEFAULT FALSE,
    document_url TEXT,
    CHECK (expiry_date >= issue_date)
);

CREATE TABLE Vehicle_Document (
    document_id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_no VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    alert_triggered BOOLEAN DEFAULT FALSE,
    document_url TEXT,
    CHECK (expiry_date >= issue_date)
);

-- 13. TELEMETRY
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

CREATE TABLE telemetry_y2026m08 PARTITION OF Vehicle_Telemetry FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
CREATE TABLE telemetry_y2026m09 PARTITION OF Vehicle_Telemetry FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- 14. VIEWS
CREATE VIEW v_vehicle_expense_ledger AS
SELECT vehicle_id, 'fuel' AS category, (liters * cost_per_liter) AS amount, refuel_time AS expense_date, fuel_id AS reference_id
FROM Fuel_Log
UNION ALL
SELECT vehicle_id, 'maintenance' AS category, cost AS amount, service_date::timestamptz AS expense_date, maintenance_id AS reference_id
FROM Maintenance
UNION ALL
SELECT t.vehicle_id, 'incident' AS category, i.damage_cost AS amount, i.incident_date AS expense_date, i.incident_id AS reference_id
FROM Incident i
JOIN Trip t ON i.trip_id = t.trip_id;

CREATE VIEW v_vehicle_cost_summary AS
SELECT v.vehicle_id, v.owner_id, v.registration_no, v.brand, v.model, COALESCE(SUM(el.amount), 0.00) AS total_expenses_incurred
FROM Vehicle v
LEFT JOIN v_vehicle_expense_ledger el ON v.vehicle_id = el.vehicle_id
GROUP BY v.vehicle_id, v.owner_id, v.registration_no, v.brand, v.model;

-- 15. INDEXES
CREATE INDEX idx_trip_owner ON Trip(owner_id);
CREATE INDEX idx_trip_vehicle ON Trip(vehicle_id);
CREATE INDEX idx_trip_driver ON Trip(driver_id);
CREATE INDEX idx_maintenance_vehicle ON Maintenance(vehicle_id);
CREATE INDEX idx_fuel_vehicle ON Fuel_Log(vehicle_id);
CREATE INDEX idx_incident_trip ON Incident(trip_id);
CREATE INDEX idx_telemetry_trip ON Vehicle_Telemetry(trip_id, ping_time DESC);
CREATE INDEX idx_telemetry_geom ON Vehicle_Telemetry USING GIST (geom);
CREATE INDEX idx_company_request_owner_status ON Company_Request(owner_id, status);


-- 16A. Create Audit Table for Trigger
CREATE TABLE IF NOT EXISTS Vehicle_Status_History (
    history_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16B. Trigger Function and Trigger (Audit Logging)
CREATE OR REPLACE FUNCTION log_vehicle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.availability_status IS DISTINCT FROM NEW.availability_status THEN
        INSERT INTO Vehicle_Status_History(vehicle_id, old_status, new_status)
        VALUES (NEW.vehicle_id, OLD.availability_status, NEW.availability_status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_vehicle_status ON Vehicle;
CREATE TRIGGER trg_log_vehicle_status
AFTER UPDATE OF availability_status ON Vehicle
FOR EACH ROW
EXECUTE FUNCTION log_vehicle_status_change();

-- 16C. Database Function (Scalar Calculation)
CREATE OR REPLACE FUNCTION calculate_fleet_utilization(p_owner_id INT)
RETURNS DECIMAL AS $$
DECLARE
    total_vehicles INT;
    dispatched_vehicles INT;
BEGIN
    SELECT COUNT(*) INTO total_vehicles FROM Vehicle WHERE owner_id = p_owner_id;
    IF total_vehicles = 0 THEN
        RETURN 0.00;
    END IF;

    SELECT COUNT(*) INTO dispatched_vehicles
    FROM Vehicle
    WHERE owner_id = p_owner_id AND availability_status = 'dispatched';

    RETURN ROUND((dispatched_vehicles::DECIMAL / total_vehicles::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- 16D. Stored Procedure (Multi-table workflow)
CREATE OR REPLACE PROCEDURE assign_trip_workflow(
    p_owner_id INT,
    p_vehicle_id INT,
    p_driver_id INT,
    p_route_name VARCHAR,
    p_origin VARCHAR,
    p_destination VARCHAR,
    p_departure_time TIMESTAMP,
    p_cargo_type VARCHAR,
    p_notes TEXT,
    p_dispatched_by INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_route_id INT;
BEGIN
    INSERT INTO Route (owner_id, route_name, origin, destination)
    VALUES (p_owner_id, p_route_name, p_origin, p_destination)
    RETURNING route_id INTO v_route_id;

    INSERT INTO Trip (
        owner_id, vehicle_id, driver_id, route_id,
        departure_time, cargo_type, notes, dispatched_by
    )
    VALUES (
        p_owner_id, p_vehicle_id, p_driver_id, v_route_id,
        p_departure_time, p_cargo_type, p_notes, p_dispatched_by
    );

    UPDATE Driver SET status = 'dispatched' WHERE driver_id = p_driver_id;
    UPDATE Vehicle SET availability_status = 'dispatched' WHERE vehicle_id = p_vehicle_id;
END;
$$;
