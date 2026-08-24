CREATE TABLE IF NOT EXISTS labers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    age INTEGER,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'labor')),
    password TEXT
);

CREATE TABLE IF NOT EXISTS laborers_data (
    id SERIAL PRIMARY KEY,
    laborers_id INTEGER NOT NULL REFERENCES labers(id) ON DELETE CASCADE,
    output NUMERIC NOT NULL CHECK (output >= 0),
    efficiency NUMERIC NOT NULL,
    smv NUMERIC NOT NULL CHECK (smv > 0),
    manpower NUMERIC NOT NULL DEFAULT 1 CHECK (manpower > 0),
    working_minutes NUMERIC NOT NULL DEFAULT 60 CHECK (working_minutes > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL CHECK (status IN ('HIGH', 'MEDIUM', 'LOW'))
);

CREATE TABLE IF NOT EXISTS supervisor_data (
    id SERIAL PRIMARY KEY,
    supervisor_id INTEGER NOT NULL,
    efficiency NUMERIC NOT NULL,
    smv NUMERIC NOT NULL,
    manpower NUMERIC,
    working_minutes NUMERIC NOT NULL DEFAULT 60,
    date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    time TIME,
    mark VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS laborers_data_laborers_id_idx
    ON laborers_data (laborers_id);