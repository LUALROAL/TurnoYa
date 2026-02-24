using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TurnoYa.Core.Entities
{
    public class BusinessImage
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid BusinessId { get; set; }

        [ForeignKey("BusinessId")]
        public Business Business { get; set; } = null!;

        // El campo ImagePath ya no se usará, pero lo dejamos para compatibilidad
        public string? ImagePath { get; set; }

        // Nueva propiedad para almacenar la imagen en la base de datos
        public byte[]? ImageData { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
