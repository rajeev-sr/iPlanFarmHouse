// ============================================
// Seed Script — populates database with sample data
// Run with: node seed.js
// ============================================
import pool, { testConnection } from "./db.js";
import fs from "fs";

async function seed() {
  await testConnection();

  // 1. Run schema
  const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(schema);
  console.log("✅ Schema created");

  // 2. Clear existing data (order matters for FK constraints)
  await pool.query("DELETE FROM activity_workers");
  await pool.query("DELETE FROM activity_inputs");
  await pool.query("DELETE FROM activities");
  await pool.query("DELETE FROM workers");
  await pool.query("DELETE FROM zones");
  await pool.query("DELETE FROM inputs");
  await pool.query("DELETE FROM crops");
  await pool.query("DELETE FROM farms");
  await pool.query("DELETE FROM users");
  console.log("🗑️  Cleared old data");

  // ---- 3. Users ----
  const usersRes = await pool.query(`
    INSERT INTO users (name, phone, role) VALUES
      ('Admin',   '9876500001', 'admin'),
      ('Rajeev',  '9876500002', 'manager')
    RETURNING id, name, role
  `);
  const admin   = usersRes.rows[0];
  const manager = usersRes.rows[1];
  console.log("✅ Users seeded:", usersRes.rows.map(u => u.name));

  // ---- 4. Farm ----
  const farmRes = await pool.query(`
    INSERT INTO farms (name, location, owner_id) VALUES
      ('Green Valley Farm', 'Nashik, Maharashtra', $1)
    RETURNING id, name
  `, [manager.id]);
  const farm = farmRes.rows[0];
  console.log("✅ Farm seeded:", farm.name);

  // ---- 5. Zones ----
  const zonesRes = await pool.query(`
    INSERT INTO zones (farm_id, name, area) VALUES
      ($1, 'Zone 1 – Vegetable Beds', 2.5),
      ($1, 'Zone 2 – Fruit Orchard',  3.0),
      ($1, 'Zone 3 – Nursery',        1.0)
    RETURNING id, name
  `, [farm.id]);
  const zones = zonesRes.rows;
  console.log("✅ Zones seeded:", zones.map(z => z.name));

  // ---- 6. Crops ----
  const cropsRes = await pool.query(`
    INSERT INTO crops (name, variety) VALUES
      ('Tomato',       'Pusa Ruby'),
      ('Chilli',       'Guntur Sannam'),
      ('Okra',         'Arka Anamika'),
      ('Bitter Gourd', 'Priya'),
      ('Brinjal',      'Pusa Purple Long'),
      ('Mango',        'Alphonso')
    RETURNING id, name
  `);
  const crops = cropsRes.rows;
  console.log("✅ Crops seeded:", crops.map(c => c.name));

  // ---- 7. Inputs ----
  const inputsRes = await pool.query(`
    INSERT INTO inputs (name, type, unit_default) VALUES
      ('Urea',            'fertilizer', 'kg'),
      ('DAP',             'fertilizer', 'kg'),
      ('Vermi-compost',   'fertilizer', 'kg'),
      ('Neem Oil',        'pesticide',  'ml'),
      ('Cypermethrin',    'pesticide',  'ml'),
      ('Glyphosate',      'herbicide',  'ml'),
      ('Tomato Seed',     'seed',       'g'),
      ('Chilli Seed',     'seed',       'g'),
      ('Diesel',          'fuel',       'L')
    RETURNING id, name
  `);
  const inputs = inputsRes.rows;
  console.log("✅ Inputs seeded:", inputs.map(i => i.name));

  // ---- 8. Workers ----
  const workersRes = await pool.query(`
    INSERT INTO workers (farm_id, name, phone) VALUES
      ($1, 'Ram',   '9000000001'),
      ($1, 'Sita',  '9000000002'),
      ($1, 'Raju',  '9000000003')
    RETURNING id, name
  `, [farm.id]);
  const workers = workersRes.rows;
  console.log("✅ Workers seeded:", workers.map(w => w.name));

  // ---- 9. Activities ----
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();
  const fmt   = (d) => d.toISOString().split("T")[0];

  // Helper to find id by name
  const cropId  = (n) => crops.find(c => c.name === n).id;
  const inputId = (n) => inputs.find(i => i.name === n).id;

  const activitiesDef = [
    // ---- past activities ----
    { type: "sowing",       zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, 1),  workers: [{id: workers[0].id, h: 4}, {id: workers[1].id, h: 3}], inputs: [{id: inputId("Tomato Seed"), qty: 200, unit: "g", method: "direct sowing"}], remarks: "First tomato lot sown in raised beds." },
    { type: "irrigation",   zone: zones[1].id, crop: cropId("Mango"),        date: new Date(year, month, 2),  workers: [{id: workers[1].id, h: 2}], inputs: [{id: inputId("Diesel"), qty: 5, unit: "L", method: "pump"}], remarks: "Drip irrigation run for orchard." },
    { type: "fertilizer",   zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, 4),  workers: [{id: workers[0].id, h: 3}], inputs: [{id: inputId("Vermi-compost"), qty: 50, unit: "kg", method: "broadcasting"}], remarks: "Organic manure applied." },
    { type: "weeding",      zone: zones[1].id, crop: cropId("Mango"),        date: new Date(year, month, 5),  workers: [{id: workers[1].id, h: 5}, {id: workers[2].id, h: 5}], inputs: [], remarks: "Manual weeding around trees." },
    { type: "pest_control", zone: zones[1].id, crop: cropId("Mango"),        date: new Date(year, month, 6),  workers: [{id: workers[0].id, h: 3}], inputs: [{id: inputId("Neem Oil"), qty: 500, unit: "ml", method: "spray"}], remarks: "Preventive spray for mango hopper." },
    { type: "irrigation",   zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, 6),  workers: [{id: workers[0].id, h: 2}], inputs: [], remarks: "Manual watering." },
    { type: "fertilizer",   zone: zones[2].id, crop: cropId("Chilli"),       date: new Date(year, month, 7),  workers: [{id: workers[2].id, h: 2}], inputs: [{id: inputId("DAP"), qty: 10, unit: "kg", method: "ring application"}], remarks: "DAP for nursery seedlings." },
    { type: "sowing",       zone: zones[2].id, crop: cropId("Chilli"),       date: new Date(year, month, 8),  workers: [{id: workers[2].id, h: 4}], inputs: [{id: inputId("Chilli Seed"), qty: 100, unit: "g", method: "nursery tray"}], remarks: "Chilli nursery started." },
    { type: "pest_control", zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, 10), workers: [{id: workers[0].id, h: 2}], inputs: [{id: inputId("Cypermethrin"), qty: 200, unit: "ml", method: "spray"}], remarks: "Fruit borer control." },

    // ---- today's activities ----
    { type: "transplant",   zone: zones[0].id, crop: cropId("Chilli"),       date: new Date(year, month, today.getDate()), workers: [{id: workers[1].id, h: 6}, {id: workers[2].id, h: 6}], inputs: [{id: inputId("Vermi-compost"), qty: 20, unit: "kg", method: "pit filling"}], remarks: "Transplanting chilli seedlings from nursery." },
    { type: "irrigation",   zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, today.getDate()), workers: [{id: workers[0].id, h: 2}], inputs: [], remarks: "Routine drip run." },
    { type: "pest_control", zone: zones[1].id, crop: cropId("Mango"),        date: new Date(year, month, today.getDate()), workers: [{id: workers[0].id, h: 3}], inputs: [{id: inputId("Neem Oil"), qty: 300, unit: "ml", method: "spray"}], remarks: "Second neem spray." },

    // ---- future activities ----
    { type: "sowing",       zone: zones[0].id, crop: cropId("Bitter Gourd"), date: new Date(year, month, today.getDate() + 1),  workers: [{id: workers[0].id, h: 4}], inputs: [{id: inputId("Urea"), qty: 5, unit: "kg", method: "basal"}], remarks: "Bitter gourd direct sowing." },
    { type: "harvest",      zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, today.getDate() + 3),  workers: [{id: workers[0].id, h: 3}, {id: workers[2].id, h: 3}], inputs: [], remarks: "First harvest of tomato." },
    { type: "irrigation",   zone: zones[2].id, crop: cropId("Chilli"),       date: new Date(year, month, today.getDate() + 3),  workers: [{id: workers[1].id, h: 1}], inputs: [], remarks: "Nursery mist." },
    { type: "fertilizer",   zone: zones[1].id, crop: cropId("Mango"),        date: new Date(year, month, today.getDate() + 5),  workers: [{id: workers[1].id, h: 3}], inputs: [{id: inputId("Urea"), qty: 15, unit: "kg", method: "ring"}], remarks: "Post-flowering dose." },
    { type: "transplant",   zone: zones[0].id, crop: cropId("Okra"),         date: new Date(year, month, today.getDate() + 7),  workers: [{id: workers[0].id, h: 5}, {id: workers[2].id, h: 5}], inputs: [{id: inputId("DAP"), qty: 8, unit: "kg", method: "pit filling"}], remarks: "Okra transplant." },
    { type: "harvest",      zone: zones[0].id, crop: cropId("Tomato"),       date: new Date(year, month, today.getDate() + 10), workers: [{id: workers[0].id, h: 4}], inputs: [], remarks: "Second tomato harvest." },
    { type: "pest_control", zone: zones[0].id, crop: cropId("Okra"),         date: new Date(year, month, today.getDate() + 14), workers: [{id: workers[2].id, h: 2}], inputs: [{id: inputId("Neem Oil"), qty: 250, unit: "ml", method: "spray"}], remarks: "Preventive spray on okra." },
  ];

  for (const a of activitiesDef) {
    // Insert activity
    const actRes = await pool.query(
      `INSERT INTO activities (farm_id, zone_id, date, activity_type, crop_id, remarks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [farm.id, a.zone, fmt(a.date), a.type, a.crop, a.remarks, manager.id]
    );
    const actId = actRes.rows[0].id;

    // Insert workers
    for (const w of a.workers) {
      await pool.query(
        `INSERT INTO activity_workers (activity_id, worker_id, hours) VALUES ($1, $2, $3)`,
        [actId, w.id, w.h]
      );
    }

    // Insert inputs
    for (const inp of a.inputs) {
      await pool.query(
        `INSERT INTO activity_inputs (activity_id, input_id, quantity, unit, method) VALUES ($1, $2, $3, $4, $5)`,
        [actId, inp.id, inp.qty, inp.unit, inp.method]
      );
    }
  }
  console.log(`✅ ${activitiesDef.length} activities seeded (with workers & inputs)`);

  await pool.end();
  console.log("🎉 Seeding complete!");
}

seed().catch(console.error);
