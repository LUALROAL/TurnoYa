using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTelegramFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlockedDates",
                table: "EmployeeSchedules");

            migrationBuilder.AddColumn<string>(
                name: "TelegramChatId",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelegramLinkingCode",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramChatId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TelegramLinkingCode",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "BlockedDates",
                table: "EmployeeSchedules",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
