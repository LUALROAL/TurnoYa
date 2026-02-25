using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessScheduleModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessSchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppointmentDuration = table.Column<int>(type: "int", nullable: false, defaultValue: 30)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessSchedules_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessWorkingDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    IsOpen = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessWorkingDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessWorkingDays_BusinessSchedules_BusinessScheduleId",
                        column: x => x.BusinessScheduleId,
                        principalTable: "BusinessSchedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessBreakTimes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkingDayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessBreakTimes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessBreakTimes_BusinessWorkingDays_WorkingDayId",
                        column: x => x.WorkingDayId,
                        principalTable: "BusinessWorkingDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessTimeBlocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkingDayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessTimeBlocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessTimeBlocks_BusinessWorkingDays_WorkingDayId",
                        column: x => x.WorkingDayId,
                        principalTable: "BusinessWorkingDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessBreakTimes_WorkingDayId",
                table: "BusinessBreakTimes",
                column: "WorkingDayId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessSchedules_BusinessId",
                table: "BusinessSchedules",
                column: "BusinessId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BusinessTimeBlocks_WorkingDayId",
                table: "BusinessTimeBlocks",
                column: "WorkingDayId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessWorkingDays_BusinessScheduleId",
                table: "BusinessWorkingDays",
                column: "BusinessScheduleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessBreakTimes");

            migrationBuilder.DropTable(
                name: "BusinessTimeBlocks");

            migrationBuilder.DropTable(
                name: "BusinessWorkingDays");

            migrationBuilder.DropTable(
                name: "BusinessSchedules");
        }
    }
}
