using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurnoYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTermsAcceptedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "TermsAcceptedAt",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TermsAcceptedAt",
                table: "Users");
        }
    }
}
