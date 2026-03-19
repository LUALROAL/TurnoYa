-- Sync EF Migration History for SQL Server
-- Insert all migrations that were applied manually (tables already exist)
-- Uses MERGE to handle if record already exists

MERGE __EFMigrationsHistory AS target
USING (VALUES 
    ('20260224084038_PrimeraMigracion', '8.0.7'),
    ('20260224084417_Inicial', '8.0.7'),
    ('20260224085151_BaseNueva', '8.0.7'),
    ('20260224090237_Sincronizar', '8.0.7'),
    ('20260225033540_AddBusinessScheduleModel', '8.0.7'),
    ('20260225040633_AddEmployeeScheduleModel', '8.0.7'),
    ('20260226190010_NuevaMigracion', '8.0.7'),
    ('20260226220148_AddUserProfileFields', '8.0.7'),
    ('20260303205107_RefactorBusinessSettingsDefaults', '8.0.7'),
    ('20260304042802_AddEmployeeServiceAssignments', '8.0.7'),
    ('20260309162956_AddBlockedDatesToEmployeeSchedule', '8.0.7'),
    ('20260313045516_AddTelegramFields', '8.0.7'),
    ('20260318040211_AddTelegramLinkingCodeExpiry', '8.0.7')
) AS source (MigrationId, ProductVersion)
ON target.MigrationId = source.MigrationId
WHEN NOT MATCHED THEN
    INSERT (MigrationId, ProductVersion) VALUES (source.MigrationId, source.ProductVersion);
