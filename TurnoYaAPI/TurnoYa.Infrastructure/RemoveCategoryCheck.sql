-- Script para eliminar la restricción CHECK de Category en Businesses
USE TurnoyaDB;
GO

-- Buscar y eliminar todas las restricciones CHECK en la columna Category de Businesses
DECLARE @ConstraintName NVARCHAR(200);
DECLARE constraint_cursor CURSOR FOR
SELECT name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('dbo.Businesses')
AND definition LIKE '%Category%';

OPEN constraint_cursor;
FETCH NEXT FROM constraint_cursor INTO @ConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @SQL NVARCHAR(MAX) = 'ALTER TABLE dbo.Businesses DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    EXEC sp_executesql @SQL;
    PRINT 'Eliminada restricción: ' + @ConstraintName;
    FETCH NEXT FROM constraint_cursor INTO @ConstraintName;
END

CLOSE constraint_cursor;
DEALLOCATE constraint_cursor;
GO

PRINT 'Restricciones CHECK de Category eliminadas exitosamente.';
