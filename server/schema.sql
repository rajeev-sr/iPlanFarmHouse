-- ============================================
-- iPlanFarmHouse Database Schema (v2)
-- Full farm-management schema
-- ============================================

-- ---------- ENUM types ----------
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'manager'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE input_type AS ENUM ('fertilizer', 'pesticide', 'herbicide', 'seed', 'fuel', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE activity_type_enum AS ENUM ('sowing', 'irrigation', 'pest_control', 'fertilizer', 'harvest', 'transplant', 'weeding'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role  user_role NOT NULL DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ---------- Farms ----------
CREATE TABLE IF NOT EXISTS farms (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  location  VARCHAR(255),
  owner_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ---------- Zones ----------
CREATE TABLE IF NOT EXISTS zones (
  id        SERIAL PRIMARY KEY,
  farm_id   INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  area      DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ---------- Crops ----------
CREATE TABLE IF NOT EXISTS crops (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  variety  VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ---------- Inputs ----------
CREATE TABLE IF NOT EXISTS inputs (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  type         input_type NOT NULL,
  unit_default VARCHAR(50),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ---------- Workers ----------
CREATE TABLE IF NOT EXISTS workers (
  id        SERIAL PRIMARY KEY,
  farm_id   INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  phone     VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ---------- Activities ----------
CREATE TABLE IF NOT EXISTS activities (
  id            SERIAL PRIMARY KEY,
  farm_id       INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  zone_id       INTEGER REFERENCES zones(id) ON DELETE SET NULL,
  date          DATE NOT NULL,
  activity_type activity_type_enum NOT NULL,
  crop_id       INTEGER REFERENCES crops(id) ON DELETE SET NULL,
  remarks       TEXT,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ---------- Activity ↔ Inputs (junction) ----------
CREATE TABLE IF NOT EXISTS activity_inputs (
  id          SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  input_id    INTEGER NOT NULL REFERENCES inputs(id)    ON DELETE CASCADE,
  quantity    DECIMAL(10,2),
  unit        VARCHAR(50),
  method      VARCHAR(100)
);

-- ---------- Activity ↔ Workers (junction) ----------
CREATE TABLE IF NOT EXISTS activity_workers (
  id          SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  worker_id   INTEGER NOT NULL REFERENCES workers(id)   ON DELETE CASCADE,
  hours       DECIMAL(5,2)
);

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_activities_date    ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_farm    ON activities(farm_id);
CREATE INDEX IF NOT EXISTS idx_zones_farm         ON zones(farm_id);
CREATE INDEX IF NOT EXISTS idx_workers_farm       ON workers(farm_id);
CREATE INDEX IF NOT EXISTS idx_activity_inputs_a  ON activity_inputs(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_workers_a ON activity_workers(activity_id);
