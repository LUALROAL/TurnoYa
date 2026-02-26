using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class NuevaMigracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EmployeeId1",
                table: "EmployeeSchedules",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "PhotoData",
                table: "Employees",
                type: "varbinary(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeSchedules_EmployeeId1",
                table: "EmployeeSchedules",
                column: "EmployeeId1",
                unique: true,
                filter: "[EmployeeId1] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeSchedules_Employees_EmployeeId1",
                table: "EmployeeSchedules",
                column: "EmployeeId1",
                principalTable: "Employees",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeSchedules_Employees_EmployeeId1",
                table: "EmployeeSchedules");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeSchedules_EmployeeId1",
                table: "EmployeeSchedules");

            migrationBuilder.DropColumn(
                name: "EmployeeId1",
                table: "EmployeeSchedules");

            migrationBuilder.DropColumn(
                name: "PhotoData",
                table: "Employees");
        }
    }
}
