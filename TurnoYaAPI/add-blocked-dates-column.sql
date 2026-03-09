-- Script para agregar la columna BlockedDatesJson a EmployeeSchedules
-- Ejecutar esto en la BD si la migración no se aplicó correctamente

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'EmployeeSchedules' AND COLUMN_NAME = 'BlockedDatesJson'
)
BEGIN
    ALTER TABLE [EmployeeSchedules] 
    ADD [BlockedDatesJson] NVARCHAR(MAX) NULL;
    
    PRINT 'Columna BlockedDatesJson agregada correctamente a EmployeeSchedules';
END
ELSE
BEGIN
    PRINT 'La columna BlockedDatesJson ya existe en EmployeeSchedules';
END
GO
