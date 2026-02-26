using System.ComponentModel.DataAnnotations;

namespace TurnoYa.Application.DTOs.Employee
{
    public class CreateEmployeeDto
    {
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Phone]
        [StringLength(20)]
        public string? Phone { get; set; }

        [EmailAddress]
        [StringLength(256)]
        public string? Email { get; set; }

        [StringLength(100)]
        public string? Position { get; set; }

        [StringLength(500)]
        public string? Bio { get; set; }

        [Url]
        [StringLength(512)]
        public string? ProfilePictureUrl { get; set; }

        // Para recibir la imagen como base64
        public string? PhotoBase64 { get; set; }

        public bool? IsActive { get; set; }
    }
}