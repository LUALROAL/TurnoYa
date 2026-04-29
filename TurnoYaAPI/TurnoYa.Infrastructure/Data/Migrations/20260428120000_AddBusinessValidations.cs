using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessValidations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessValidations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KnowsBusiness = table.Column<bool>(type: "bit", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessValidations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessValidations_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BusinessValidations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BusinessValidations_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessValidations_BusinessId_UserId",
                table: "BusinessValidations",
                columns: new[] { "BusinessId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BusinessValidations_BusinessId",
                table: "BusinessValidations",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessValidations_UserId",
                table: "BusinessValidations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessValidations_AppointmentId",
                table: "BusinessValidations",
                column: "AppointmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BusinessValidations_Businesses_BusinessId",
                table: "BusinessValidations");

            migrationBuilder.DropForeignKey(
                name: "FK_BusinessValidations_Users_UserId",
                table: "BusinessValidations");

            migrationBuilder.DropForeignKey(
                name: "FK_BusinessValidations_Appointments_AppointmentId",
                table: "BusinessValidations");

            migrationBuilder.DropTable(
                name: "BusinessValidations");
        }
    }
}