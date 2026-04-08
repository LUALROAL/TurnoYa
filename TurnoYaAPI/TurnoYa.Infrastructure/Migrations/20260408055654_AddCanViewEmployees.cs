using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCanViewEmployees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanViewEmployees",
                table: "EmployeePermissions",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanViewEmployees",
                table: "EmployeePermissions");
        }
    }
}
