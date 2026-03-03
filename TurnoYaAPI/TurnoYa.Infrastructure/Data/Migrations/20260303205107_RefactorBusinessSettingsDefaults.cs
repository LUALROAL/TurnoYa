using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorBusinessSettingsDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NoShowDepositAmount",
                table: "BusinessSettings");

            migrationBuilder.DropColumn(
                name: "NoShowPolicyType",
                table: "BusinessSettings");

            migrationBuilder.DropColumn(
                name: "SlotDuration",
                table: "BusinessSettings");

            migrationBuilder.AlterColumn<int>(
                name: "MaxAdvanceBookingDays",
                table: "BusinessSettings",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "BufferTime",
                table: "BusinessSettings",
                type: "int",
                nullable: false,
                defaultValue: 15,
                oldClrType: typeof(int),
                oldType: "int");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "MaxAdvanceBookingDays",
                table: "BusinessSettings",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "BufferTime",
                table: "BusinessSettings",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 15);

            migrationBuilder.AddColumn<decimal>(
                name: "NoShowDepositAmount",
                table: "BusinessSettings",
                type: "decimal(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "NoShowPolicyType",
                table: "BusinessSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SlotDuration",
                table: "BusinessSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
