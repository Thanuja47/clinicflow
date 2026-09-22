-- Add unique constraint on (clinicId, name) to prevent duplicate branch names per clinic.
-- NOTE: Run the cleanup script below in production FIRST to remove duplicates before applying this migration.
CREATE UNIQUE INDEX "Branch_clinicId_name_key" ON "Branch"("clinicId", "name");