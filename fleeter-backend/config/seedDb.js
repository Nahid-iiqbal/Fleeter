const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");
const bcrypt = require("bcrypt");

const DEFAULT_PASSWORD = "pass";

// Helpers
const daysAgo = (n) => `NOW() - INTERVAL '${n} days'`;
const daysFromNow = (n) => `NOW() + INTERVAL '${n} days'`;
const dateDaysAgo = (n) => `CURRENT_DATE - INTERVAL '${n} days'`;
const dateDaysFromNow = (n) => `CURRENT_DATE + INTERVAL '${n} days'`;

async function createUser(client, { username, email, role, passwordHash }) {
  const res = await client.query(
    `INSERT INTO User_Account (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING user_id`,
    [username, email, passwordHash, role]
  );
  return res.rows[0].user_id;
}

async function createOwner(client, userId, companyName) {
  const res = await client.query(
    `INSERT INTO Owner_Profile (user_id, company_name) VALUES ($1, $2) RETURNING owner_id`,
    [userId, companyName]
  );
  return res.rows[0].owner_id;
}

async function createManager(client, { userId, ownerId, fullName, employeeId, phone, department }) {
  const res = await client.query(
    `INSERT INTO Manager_Profile (user_id, owner_id, full_name, employee_id, phone, department)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING manager_id`,
    [userId, ownerId, fullName, employeeId, phone, department]
  );
  return res.rows[0].manager_id;
}

async function createDriver(client, { userId, ownerId, fullName, phone, status, joinedDaysAgo }) {
  const res = await client.query(
    `INSERT INTO Driver (user_id, owner_id, full_name, phone, status, joined_date)
     VALUES ($1, $2, $3, $4, $5, ${dateDaysAgo(joinedDaysAgo)}) RETURNING driver_id`,
    [userId, ownerId, fullName, phone, status]
  );
  return res.rows[0].driver_id;
}

// Maps legacy single status to Enterprise condition_status & availability_status
function mapVehicleStatuses(status) {
  switch (status) {
    case "dispatched":
      return { condition: "good", availability: "dispatched" };
    case "in_maintenance":
      return { condition: "in_maintenance", availability: "unavailable" };
    case "retired":
    case "sold":
      return { condition: "retired", availability: "unavailable" };
    case "available":
    default:
      return { condition: "good", availability: "available" };
  }
}

async function createVehicle(client, { ownerId, reg, brand, type, model, year, capacity, fuelType, status }) {
  const { condition, availability } = mapVehicleStatuses(status);
  const res = await client.query(
    `INSERT INTO Vehicle (
       owner_id, registration_no, brand, type, model, year, capacity, fuel_type, condition_status, availability_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING vehicle_id`,
    [ownerId, reg, brand, type, model, year, capacity, fuelType, condition, availability]
  );
  return res.rows[0].vehicle_id;
}

async function createRoute(client, { ownerId, name, origin, destination, distanceKm, estMins }) {
  const res = await client.query(
    `INSERT INTO Route (owner_id, route_name, origin, destination, distance_km, est_mins)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING route_id`,
    [ownerId, name, origin, destination, distanceKm, estMins]
  );
  return res.rows[0].route_id;
}

async function createTrip(client, {
  ownerId, vehicleId, driverId, routeId = null,
  originAddress = null, destinationAddress = null,
  departureDaysAgo, arrivalDaysAgo = null,
  status, cargoType = "cargo", notes = null, dispatchedBy,
}) {
  const departureExpr = departureDaysAgo >= 0 ? daysAgo(departureDaysAgo) : daysFromNow(-departureDaysAgo);
  const arrivalExpr =
    arrivalDaysAgo === null
      ? "NULL"
      : arrivalDaysAgo >= 0
        ? daysAgo(arrivalDaysAgo)
        : daysFromNow(-arrivalDaysAgo);

  const res = await client.query(
    `INSERT INTO Trip (
       owner_id, vehicle_id, driver_id, route_id,
       origin_address, destination_address,
       departure_time, arrival_time,
       status, cargo_type, notes, dispatched_by
     )
     VALUES (
       $1, $2, $3, $4,
       $5, $6,
       ${departureExpr}, ${arrivalExpr},
       $7, $8, $9, $10
     ) RETURNING trip_id`,
    [
      ownerId, vehicleId, driverId, routeId,
      originAddress, destinationAddress,
      status, cargoType, notes, dispatchedBy,
    ]
  );
  return res.rows[0].trip_id;
}

async function createFuelLog(client, { vehicleId, tripId, refuelDaysAgo, liters, costPerLiter, odometerKm, station, loggedBy }) {
  await client.query(
    `INSERT INTO Fuel_Log (vehicle_id, trip_id, refuel_time, liters, cost_per_liter, odometer_km, station_name, logged_by)
     VALUES ($1, $2, ${daysAgo(refuelDaysAgo)}, $3, $4, $5, $6, $7)`,
    [vehicleId, tripId, liters, costPerLiter, odometerKm, station, loggedBy]
  );
}

async function createIncident(client, { tripId, daysAgoVal, type, description, severity, damageCost, reportedTo, loggedBy, resolved }) {
  await client.query(
    `INSERT INTO Incident (trip_id, incident_date, type, description, severity, damage_cost, reported_to, logged_by, resolved)
     VALUES ($1, ${daysAgo(daysAgoVal)}, $2, $3, $4, $5, $6, $7, $8)`,
    [tripId, type, description, severity, damageCost, reportedTo, loggedBy, resolved]
  );
}

async function createMaintenance(client, {
  vehicleId, vendorId = null, serviceDaysAgo, serviceType, description,
  cost, workshop, mechanicName = null, odometerKm,
  nextDueInDays = null, nextDueKm = null, loggedBy,
}) {
  const nextDueDateExpr = nextDueInDays === null ? "NULL" : dateDaysFromNow(nextDueInDays);
  await client.query(
    `INSERT INTO Maintenance (
       vehicle_id, vendor_id, service_date, service_type, description,
       cost, workshop, mechanic_name, odometer_km, next_due_date, next_due_km, logged_by
     )
     VALUES ($1, $2, ${dateDaysAgo(serviceDaysAgo)}, $3, $4, $5, $6, $7, $8, ${nextDueDateExpr}, $9, $10)`,
    [vehicleId, vendorId, serviceType, description, cost, workshop, mechanicName, odometerKm, nextDueKm, loggedBy]
  );
}

async function createVendor(client, { ownerId, name, category, contact, phone, address }) {
  const res = await client.query(
    `INSERT INTO Vendor (owner_id, vendor_name, vendor_category, contact_person, phone, address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING vendor_id`,
    [ownerId, name, category, contact, phone, address]
  );
  return res.rows[0].vendor_id;
}

async function createDriverDocument(client, { driverId, type, docNo, issueDaysAgo, expiryOffsetDays, alertTriggered = false }) {
  const expiryExpr = expiryOffsetDays >= 0 ? dateDaysFromNow(expiryOffsetDays) : dateDaysAgo(-expiryOffsetDays);
  await client.query(
    `INSERT INTO Driver_Document (driver_id, document_type, document_no, issue_date, expiry_date, alert_triggered)
     VALUES ($1, $2, $3, ${dateDaysAgo(issueDaysAgo)}, ${expiryExpr}, $4)`,
    [driverId, type, docNo, alertTriggered]
  );
}

async function createVehicleDocument(client, { vehicleId, type, docNo, issueDaysAgo, expiryOffsetDays, alertTriggered = false }) {
  const expiryExpr = expiryOffsetDays >= 0 ? dateDaysFromNow(expiryOffsetDays) : dateDaysAgo(-expiryOffsetDays);
  await client.query(
    `INSERT INTO Vehicle_Document (vehicle_id, document_type, document_no, issue_date, expiry_date, alert_triggered)
     VALUES ($1, $2, $3, ${dateDaysAgo(issueDaysAgo)}, ${expiryExpr}, $4)`,
    [vehicleId, type, docNo, alertTriggered]
  );
}

async function createCompanyRequest(client, { requesterUserId, ownerId, requestedRole, message, status, decidedByUserId = null, decidedDaysAgo = null }) {
  const decidedAtExpr = decidedDaysAgo === null ? "NULL" : daysAgo(decidedDaysAgo);
  const createdAtDays = (decidedDaysAgo ?? 3) + 2;

  await client.query(
    `INSERT INTO Company_Request (
       requester_user_id, owner_id, requested_role, message, status, decided_by, decided_at, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, ${decidedAtExpr}, ${daysAgo(createdAtDays)})`,
    [requesterUserId, ownerId, requestedRole, message, status, decidedByUserId]
  );
}

async function createTelemetryPing(client, { vehicleId, tripId, lat, lng, speedKmh, battery, minutesAgo }) {
  await client.query(
    `INSERT INTO Vehicle_Telemetry (vehicle_id, trip_id, geom, speed_kmh, battery_level, ping_time)
     VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, NOW() - INTERVAL '${minutesAgo} minutes')`,
    [vehicleId, tripId, lng, lat, speedKmh, battery]
  );
}

// ------------------------------------------------------------------

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("1. Clearing old data...");

    await client.query(`
      TRUNCATE TABLE
        User_Account, Token_Blacklist, Owner_Profile, Manager_Profile, Driver,
        Company_Request,
        Vehicle, Route, Trip, Maintenance, Fuel_Log, Incident,
        Driver_Document, Vehicle_Document, Vehicle_Telemetry, Vendor
      CASCADE;
    `);

    console.log("2. Hashing default password ('pass' for every account)...");
    const salt = await bcrypt.genSalt(10);
    const pw = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    console.log("3. Seeding admin...");
    await createUser(client, { username: "admin_super", email: "admin@fleeter.com", role: "admin", passwordHash: pw });

    const companyDefs = [
      {
        key: "apex",
        companyName: "Apex Logistics Inc.",
        ownerUsername: "apex_boss",
        ownerEmail: "owner@fleeter.com",
        managers: [
          { username: "apex_dispatch", email: "manager@fleeter.com", fullName: "Sarah Jenkins", employeeId: "EMP-001", phone: "555-0100", department: "Operations" },
          { username: "apex_ops", email: "apex.ops@fleeter.com", fullName: "Tom Reilly", employeeId: "EMP-002", phone: "555-0101", department: "Logistics" },
        ],
        drivers: [
          { username: "marcus_w", email: "driver1@fleeter.com", fullName: "Marcus Wright", phone: "555-0110", status: "dispatched", joinedDaysAgo: 620 },
          { username: "leo_h", email: "driver2@fleeter.com", fullName: "Leo Hernandez", phone: "555-0111", status: "available", joinedDaysAgo: 190 },
          { username: "priya_k", email: "driver3@fleeter.com", fullName: "Priya Khan", phone: "555-0112", status: "available", joinedDaysAgo: 95 },
          { username: "danny_o", email: "driver4@fleeter.com", fullName: "Danny Osei", phone: "555-0113", status: "on_leave", joinedDaysAgo: 400 },
          { username: "fatima_r", email: "driver5@fleeter.com", fullName: "Fatima Rahman", phone: "555-0114", status: "suspended", joinedDaysAgo: 300 },
        ],
        vehicles: [
          { reg: "XYZ-1234", brand: "Volvo", type: "truck", model: "FH16", year: 2023, capacity: 15000, fuelType: "diesel", status: "dispatched" },
          { reg: "ABC-9876", brand: "Ford", type: "van", model: "Transit", year: 2024, capacity: 3000, fuelType: "petrol", status: "available" },
          { reg: "APX-4410", brand: "Mercedes-Benz", type: "truck", model: "Actros", year: 2021, capacity: 18000, fuelType: "diesel", status: "in_maintenance" },
          { reg: "APX-7702", brand: "Toyota", type: "pickup", model: "Hilux", year: 2022, capacity: 1000, fuelType: "diesel", status: "available" },
          { reg: "APX-9981", brand: "Isuzu", type: "truck", model: "NPR", year: 2019, capacity: 8000, fuelType: "diesel", status: "retired" },
        ],
        routes: [
          { name: "Northern Cargo Run", origin: "Warehouse A", destination: "Port Terminal", distanceKm: 45.5, estMins: 60 },
          { name: "City Distribution Loop", origin: "Central Depot", destination: "Downtown Retail Hub", distanceKm: 22.0, estMins: 40 },
          { name: "Cross-Border Freight", origin: "Warehouse A", destination: "Benapole Border Checkpoint", distanceKm: 260.0, estMins: 300 },
        ],
      },
      {
        key: "metro",
        companyName: "Metro Transport Co.",
        ownerUsername: "metro_boss",
        ownerEmail: "owner2@fleeter.com",
        managers: [
          { username: "metro_dispatch", email: "metro.dispatch@fleeter.com", fullName: "Nina Patel", employeeId: "MT-001", phone: "555-0200", department: "Operations" },
          { username: "metro_ops", email: "metro.ops@fleeter.com", fullName: "Carlos Diaz", employeeId: "MT-002", phone: "555-0201", department: "Fleet Ops" },
        ],
        drivers: [
          { username: "amir_s", email: "amir.s@fleeter.com", fullName: "Amir Siddiqui", phone: "555-0210", status: "dispatched", joinedDaysAgo: 500 },
          { username: "grace_l", email: "grace.l@fleeter.com", fullName: "Grace Lin", phone: "555-0211", status: "available", joinedDaysAgo: 210 },
          { username: "victor_m", email: "victor.m@fleeter.com", fullName: "Victor Mensah", phone: "555-0212", status: "available", joinedDaysAgo: 150 },
          { username: "hana_t", email: "hana.t@fleeter.com", fullName: "Hana Tanaka", phone: "555-0213", status: "available", joinedDaysAgo: 60 },
          { username: "oscar_p", email: "oscar.p@fleeter.com", fullName: "Oscar Pereira", phone: "555-0214", status: "terminated", joinedDaysAgo: 700 },
        ],
        vehicles: [
          { reg: "MTC-1001", brand: "Hino", type: "truck", model: "500 Series", year: 2022, capacity: 12000, fuelType: "diesel", status: "dispatched" },
          { reg: "MTC-1002", brand: "Toyota", type: "van", model: "HiAce", year: 2023, capacity: 2500, fuelType: "petrol", status: "available" },
          { reg: "MTC-1003", brand: "Volvo", type: "truck", model: "FM11", year: 2020, capacity: 16000, fuelType: "diesel", status: "available" },
          { reg: "MTC-1004", brand: "Suzuki", type: "pickup", model: "Carry", year: 2024, capacity: 800, fuelType: "petrol", status: "available" },
          { reg: "MTC-1005", brand: "Isuzu", type: "truck", model: "Elf", year: 2018, capacity: 7000, fuelType: "diesel", status: "retired" },
        ],
        routes: [
          { name: "Airport Cargo Express", origin: "Metro Depot", destination: "International Airport Cargo Wing", distanceKm: 18.3, estMins: 30 },
          { name: "Suburban Delivery Circuit", origin: "Metro Depot", destination: "Suburban Retail Park", distanceKm: 34.0, estMins: 55 },
          { name: "Industrial Zone Shuttle", origin: "Metro Depot", destination: "Riverside Industrial Zone", distanceKm: 27.5, estMins: 45 },
        ],
      },
      {
        key: "greenvalley",
        companyName: "Green Valley Freight",
        ownerUsername: "greenvalley_boss",
        ownerEmail: "owner3@fleeter.com",
        managers: [
          { username: "gv_dispatch", email: "gv.dispatch@fleeter.com", fullName: "Amara Okafor", employeeId: "GV-001", phone: "555-0300", department: "Dispatch" },
          { username: "gv_ops", email: "gv.ops@fleeter.com", fullName: "Ben Turner", employeeId: "GV-002", phone: "555-0301", department: "Fleet Ops" },
        ],
        drivers: [
          { username: "sam_c", email: "sam.c@fleeter.com", fullName: "Samuel Chowdhury", phone: "555-0310", status: "available", joinedDaysAgo: 380 },
          { username: "wei_z", email: "wei.z@fleeter.com", fullName: "Wei Zhang", phone: "555-0311", status: "dispatched", joinedDaysAgo: 140 },
          { username: "ines_v", email: "ines.v@fleeter.com", fullName: "Ines Varela", phone: "555-0312", status: "available", joinedDaysAgo: 80 },
          { username: "kwame_a", email: "kwame.a@fleeter.com", fullName: "Kwame Asante", phone: "555-0313", status: "available", joinedDaysAgo: 45 },
          { username: "julia_f", email: "julia.f@fleeter.com", fullName: "Julia Ferreira", phone: "555-0314", status: "on_leave", joinedDaysAgo: 260 },
        ],
        vehicles: [
          { reg: "GVF-2201", brand: "Scania", type: "truck", model: "R450", year: 2023, capacity: 20000, fuelType: "diesel", status: "available" },
          { reg: "GVF-2202", brand: "Nissan", type: "van", model: "NV350", year: 2022, capacity: 2800, fuelType: "petrol", status: "dispatched" },
          { reg: "GVF-2203", brand: "Mitsubishi", type: "truck", model: "Fuso Fighter", year: 2021, capacity: 11000, fuelType: "diesel", status: "available" },
          { reg: "GVF-2204", brand: "Honda", type: "pickup", model: "Ridgeline", year: 2024, capacity: 900, fuelType: "petrol", status: "available" },
          { reg: "GVF-2205", brand: "MAN", type: "truck", model: "TGX", year: 2019, capacity: 17000, fuelType: "diesel", status: "in_maintenance" },
        ],
        routes: [
          { name: "Highland Produce Run", origin: "Green Valley Yard", destination: "Highland Wholesale Market", distanceKm: 62.0, estMins: 80 },
          { name: "Coastal Cold Chain", origin: "Green Valley Yard", destination: "Coastal Cold Storage Facility", distanceKm: 88.0, estMins: 105 },
          { name: "Regional Hub Transfer", origin: "Green Valley Yard", destination: "Regional Distribution Hub", distanceKm: 40.0, estMins: 55 },
        ],
      },
    ];

    const companies = {};

    for (const def of companyDefs) {
      console.log(`4. Seeding company: ${def.companyName}...`);

      const ownerUserId = await createUser(client, {
        username: def.ownerUsername, email: def.ownerEmail, role: "owner", passwordHash: pw,
      });
      const ownerId = await createOwner(client, ownerUserId, def.companyName);

      const managerRecords = [];
      for (const m of def.managers) {
        const managerUserId = await createUser(client, {
          username: m.username, email: m.email, role: "manager", passwordHash: pw,
        });
        const managerId = await createManager(client, {
          userId: managerUserId, ownerId, fullName: m.fullName,
          employeeId: m.employeeId, phone: m.phone, department: m.department,
        });
        managerRecords.push({ managerUserId, managerId });
      }

      const driverRecords = [];
      for (const d of def.drivers) {
        const driverUserId = await createUser(client, {
          username: d.username, email: d.email, role: "driver", passwordHash: pw,
        });
        const driverId = await createDriver(client, {
          userId: driverUserId, ownerId, fullName: d.fullName, phone: d.phone,
          status: d.status, joinedDaysAgo: d.joinedDaysAgo,
        });
        driverRecords.push({ driverUserId, driverId, fullName: d.fullName, status: d.status });
      }

      const vehicleIds = [];
      for (const v of def.vehicles) {
        const vehicleId = await createVehicle(client, { ownerId, ...v });
        vehicleIds.push({ vehicleId, ...v });
      }

      const routeIds = [];
      for (const r of def.routes) {
        const routeId = await createRoute(client, { ownerId, ...r });
        routeIds.push(routeId);
      }

      companies[def.key] = {
        ownerId, ownerUserId, companyName: def.companyName,
        managers: managerRecords, drivers: driverRecords, vehicles: vehicleIds, routes: routeIds,
      };
    }

    // Trips, Maintenance, Fuel, Incidents
    for (const key of Object.keys(companies)) {
      const co = companies[key];
      console.log(`5. Seeding trips & records for ${co.companyName}...`);

      const dispatcherUserId = co.managers[0].managerUserId;

      const vendorId = await createVendor(client, {
        ownerId: co.ownerId,
        name: `${co.companyName.split(" ")[0]} Certified Workshop`,
        category: "General Repair",
        contact: "Workshop Manager",
        phone: "555-9000",
        address: "Industrial Area, Unit 4",
      });

      for (const [i, v] of co.vehicles.entries()) {
        await createVehicleDocument(client, {
          vehicleId: v.vehicleId, type: "registration", docNo: `REG-${v.reg}`,
          issueDaysAgo: 700, expiryOffsetDays: 400,
        });
        await createVehicleDocument(client, {
          vehicleId: v.vehicleId, type: "insurance", docNo: `INS-${v.reg}`,
          issueDaysAgo: 300,
          expiryOffsetDays: i === 0 ? -10 : i === 1 ? 5 : 200,
          alertTriggered: i === 0,
        });
        await createVehicleDocument(client, {
          vehicleId: v.vehicleId, type: "fitness_certificate", docNo: `FIT-${v.reg}`,
          issueDaysAgo: 180, expiryOffsetDays: 185,
        });
      }

      for (const [i, d] of co.drivers.entries()) {
        await createDriverDocument(client, {
          driverId: d.driverId, type: "driving_license", docNo: `DL-${co.ownerId}${d.driverId}001`,
          issueDaysAgo: 900,
          expiryOffsetDays: i === 0 ? -5 : i === 1 ? 10 : 900,
          alertTriggered: i === 0,
        });
        await createDriverDocument(client, {
          driverId: d.driverId, type: "medical", docNo: `MED-${co.ownerId}${d.driverId}`,
          issueDaysAgo: 365, expiryOffsetDays: i === 2 ? -2 : 365, alertTriggered: i === 2,
        });
        if (i % 2 === 0) {
          await createDriverDocument(client, {
            driverId: d.driverId, type: "insurance", docNo: `DINS-${co.ownerId}${d.driverId}`,
            issueDaysAgo: 200, expiryOffsetDays: 165,
          });
        }
      }

      const vehicleFor = (idx) => co.vehicles[idx % co.vehicles.length];
      let odometerCursor = {};
      co.vehicles.forEach((v) => (odometerCursor[v.vehicleId] = 10000 + Math.floor(Math.random() * 5000)));

      for (const [dIdx, d] of co.drivers.entries()) {
        const vehicle = vehicleFor(dIdx);

        // Completed trips
        for (let t = 0; t < 3; t++) {
          const distance = 80 + Math.floor(Math.random() * 220);
          odometerCursor[vehicle.vehicleId] += distance;

          const departureDaysAgo = 20 + t * 15 + dIdx * 2;
          const arrivalDaysAgo = departureDaysAgo - 1;

          const tripId = await createTrip(client, {
            ownerId: co.ownerId,
            vehicleId: vehicle.vehicleId,
            driverId: d.driverId,
            routeId: co.routes[t % co.routes.length],
            departureDaysAgo,
            arrivalDaysAgo,
            status: "completed",
            cargoType: "cargo",
            notes: t === 0 ? "Delivered on schedule." : null,
            dispatchedBy: dispatcherUserId,
          });

          if (t !== 1) {
            await createFuelLog(client, {
              vehicleId: vehicle.vehicleId, tripId,
              refuelDaysAgo: arrivalDaysAgo,
              liters: 40 + Math.random() * 60,
              costPerLiter: 1.35 + Math.random() * 0.4,
              odometerKm: odometerCursor[vehicle.vehicleId],
              station: "Highway Fuel Station",
              loggedBy: d.driverUserId,
            });
          }

          if (dIdx === 0 && t === 2) {
            await createIncident(client, {
              tripId,
              daysAgoVal: arrivalDaysAgo,
              type: "breakdown",
              description: "Vehicle experienced a flat tire mid-route; roadside assistance called.",
              severity: "minor",
              damageCost: 45.0,
              reportedTo: "Fleet Dispatch",
              loggedBy: d.driverUserId,
              resolved: true,
            });
          }
          if (dIdx === 1 && t === 0) {
            await createIncident(client, {
              tripId,
              daysAgoVal: arrivalDaysAgo,
              type: "accident",
              description: "Minor collision while reversing at the loading dock. No injuries.",
              severity: "moderate",
              damageCost: 620.5,
              reportedTo: "Local Traffic Police",
              loggedBy: d.driverUserId,
              resolved: false,
            });
          }
        }

        // Scheduled trips
        await createTrip(client, {
          ownerId: co.ownerId,
          vehicleId: vehicle.vehicleId,
          driverId: d.driverId,
          routeId: co.routes[(dIdx + 1) % co.routes.length],
          departureDaysAgo: -(2 + dIdx),
          arrivalDaysAgo: null,
          status: "scheduled",
          cargoType: "cargo",
          notes: "Scheduled regional dispatch",
          dispatchedBy: dispatcherUserId,
        });
      }

      // Active trip
      const activeDriver = co.drivers[0];
      const activeVehicle = vehicleFor(0);

      const activeTripRes = await client.query(
        `INSERT INTO Trip (
           owner_id, vehicle_id, driver_id, route_id,
           departure_time, arrival_time,
           status, cargo_type, notes, dispatched_by
         )
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '1 hour', NULL, $5, $6, $7, $8)
         RETURNING trip_id`,
        [
          co.ownerId, activeVehicle.vehicleId, activeDriver.driverId, co.routes[0],
          "in_progress", "cargo", "Live delivery in progress", dispatcherUserId
        ]
      );
      const activeTripId = activeTripRes.rows[0].trip_id;

      // Telemetry pings (last 25 minutes)
      const baseLat = 23.8103 + (Math.random() - 0.5) * 0.05;
      const baseLng = 90.4125 + (Math.random() - 0.5) * 0.05;
      for (let p = 0; p < 5; p++) {
        await createTelemetryPing(client, {
          vehicleId: activeVehicle.vehicleId,
          tripId: activeTripId,
          lat: baseLat + p * 0.01,
          lng: baseLng + p * 0.008,
          speedKmh: 35 + Math.random() * 40,
          battery: 90 - p * 3,
          minutesAgo: (4 - p) * 5,
        });
      }

      // Maintenance history
      for (const [i, v] of co.vehicles.entries()) {
        await createMaintenance(client, {
          vehicleId: v.vehicleId, vendorId,
          serviceDaysAgo: 60 + i * 10,
          serviceType: "routine",
          description: "Scheduled oil change and multi-point inspection.",
          cost: 85.0 + i * 5,
          workshop: `${co.companyName.split(" ")[0]} Certified Workshop`,
          mechanicName: "J. Alvarez",
          odometerKm: odometerCursor[v.vehicleId] - 500,
          nextDueInDays: 30,
          nextDueKm: odometerCursor[v.vehicleId] + 5000,
          loggedBy: dispatcherUserId,
        });

        if (v.status === "in_maintenance") {
          await createMaintenance(client, {
            vehicleId: v.vehicleId, vendorId,
            serviceDaysAgo: 2,
            serviceType: "repair",
            description: "Transmission diagnostics and repair in progress.",
            cost: 950.0,
            workshop: `${co.companyName.split(" ")[0]} Certified Workshop`,
            mechanicName: "R. Costa",
            odometerKm: odometerCursor[v.vehicleId],
            loggedBy: dispatcherUserId,
          });
        }
      }
    }

    console.log("6. Seeding company-join-request test cases...");

    const pendingDriverUserId = await createUser(client, {
      username: "pending_driver1", email: "pending.driver1@fleeter.com", role: "driver", passwordHash: pw,
    });
    await createDriver(client, {
      userId: pendingDriverUserId, ownerId: null, fullName: "Noah Bennett", phone: "555-0500",
      status: "available", joinedDaysAgo: 5,
    });
    await createCompanyRequest(client, {
      requesterUserId: pendingDriverUserId, ownerId: companies.apex.ownerId,
      requestedRole: "driver", message: "Long-haul experience, available immediately.",
      status: "pending",
    });

    const pendingDriverUserId2 = await createUser(client, {
      username: "pending_driver2", email: "pending.driver2@fleeter.com", role: "driver", passwordHash: pw,
    });
    await createDriver(client, {
      userId: pendingDriverUserId2, ownerId: null, fullName: "Elena Vasquez", phone: "555-0501",
      status: "available", joinedDaysAgo: 3,
    });
    await createCompanyRequest(client, {
      requesterUserId: pendingDriverUserId2, ownerId: companies.metro.ownerId,
      requestedRole: "driver", message: null, status: "pending",
    });

    const pendingManagerUserId = await createUser(client, {
      username: "pending_manager1", email: "pending.manager1@fleeter.com", role: "manager", passwordHash: pw,
    });
    await createManager(client, {
      userId: pendingManagerUserId, ownerId: null, fullName: "Ravi Shankar",
      employeeId: null, phone: "555-0502", department: "Dispatch",
    });
    await createCompanyRequest(client, {
      requesterUserId: pendingManagerUserId, ownerId: companies.greenvalley.ownerId,
      requestedRole: "manager", message: "8 years dispatch experience, references available.",
      status: "pending",
    });

    const rejectedDriverUserId = await createUser(client, {
      username: "rejected_driver1", email: "rejected.driver1@fleeter.com", role: "driver", passwordHash: pw,
    });
    await createDriver(client, {
      userId: rejectedDriverUserId, ownerId: null, fullName: "Miguel Torres", phone: "555-0503",
      status: "available", joinedDaysAgo: 40,
    });
    await createCompanyRequest(client, {
      requesterUserId: rejectedDriverUserId, ownerId: companies.apex.ownerId,
      requestedRole: "driver", message: "Interested in joining your fleet.",
      status: "rejected", decidedByUserId: companies.apex.ownerUserId, decidedDaysAgo: 12,
    });

    const soloDriverUserId = await createUser(client, {
      username: "solo_driver", email: "solo.driver@fleeter.com", role: "driver", passwordHash: pw,
    });
    await createDriver(client, {
      userId: soloDriverUserId, ownerId: null, fullName: "Yusuf Demir", phone: "555-0504",
      status: "available", joinedDaysAgo: 1,
    });

    await createUser(client, {
      username: "no_profile_driver", email: "no.profile.driver@fleeter.com", role: "driver", passwordHash: pw,
    });

    await client.query("COMMIT");

    console.log("\n=============================================");
    console.log("DATABASE SEEDED SUCCESSFULLY");
    console.log("=============================================");
    console.log("Default password for all accounts: pass\n");
    console.log("ADMIN      | admin@fleeter.com          | admin_super");
    console.log("APEX       | owner@fleeter.com           | apex_boss");
    console.log("METRO      | owner2@fleeter.com          | metro_boss");
    console.log("GREEN V.   | owner3@fleeter.com          | greenvalley_boss");
    console.log("=============================================\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    process.exit();
  }
};

seedDatabase();
