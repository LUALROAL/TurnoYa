using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeePermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InvitationToken",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InvitationTokenExpiry",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInvitationUsed",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "EmployeePermissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CanViewAppointments = table.Column<bool>(type: "bit", nullable: false),
                    CanAcceptAppointments = table.Column<bool>(type: "bit", nullable: false),
                    CanRejectAppointments = table.Column<bool>(type: "bit", nullable: false),
                    CanCancelAppointments = table.Column<bool>(type: "bit", nullable: false),
                    CanRescheduleAppointments = table.Column<bool>(type: "bit", nullable: false),
                    CanManageSchedule = table.Column<bool>(type: "bit", nullable: false),
                    CanViewServices = table.Column<bool>(type: "bit", nullable: false),
                    CanManageServices = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeePermissions_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePermissions_EmployeeId",
                table: "EmployeePermissions",
                column: "EmployeeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeePermissions");

            migrationBuilder.DropColumn(
                name: "InvitationToken",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "InvitationTokenExpiry",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IsInvitationUsed",
                table: "Employees");
        }
    }
}
