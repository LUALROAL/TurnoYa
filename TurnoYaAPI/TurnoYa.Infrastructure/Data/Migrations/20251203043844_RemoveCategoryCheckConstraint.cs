using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCategoryCheckConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Eliminar la restricción CHECK de la columna Category en la tabla Businesses
            migrationBuilder.Sql(@"
                DECLARE @ConstraintName NVARCHAR(200)
                SELECT @ConstraintName = Name FROM sys.check_constraints 
                WHERE parent_object_id = OBJECT_ID('Businesses') 
                AND col_name(parent_object_id, parent_column_id) = 'Category'
                
                IF @ConstraintName IS NOT NULL
                    EXEC('ALTER TABLE Businesses DROP CONSTRAINT ' + @ConstraintName)
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No se puede recrear la restricción porque no sabemos los valores originales permitidos
        }
    }
}
