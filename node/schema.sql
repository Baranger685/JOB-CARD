-- Run this migration in the garment database.
ALTER TABLE laborers_data
    DROP COLUMN IF EXISTS manpower;

ALTER TABLE laborers_data
    ALTER COLUMN working_minutes SET DEFAULT 60;

UPDATE laborers_data
SET working_minutes = 60;

ALTER TABLE laborers_data
    DROP CONSTRAINT IF EXISTS laborers_data_working_minutes_fixed;

ALTER TABLE laborers_data
    ADD CONSTRAINT laborers_data_working_minutes_fixed
    CHECK (working_minutes = 60);