IF COL_LENGTH('BusinessSettings', 'SlotDuration') IS NOT NULL
BEGIN
    ALTER TABLE BusinessSettings DROP COLUMN SlotDuration;
END
GO

IF COL_LENGTH('BusinessSettings', 'NoShowPolicyType') IS NOT NULL
BEGIN
    ALTER TABLE BusinessSettings DROP COLUMN NoShowPolicyType;
END
GO

IF COL_LENGTH('BusinessSettings', 'NoShowDepositAmount') IS NOT NULL
BEGIN
    ALTER TABLE BusinessSettings DROP COLUMN NoShowDepositAmount;
END
GO
