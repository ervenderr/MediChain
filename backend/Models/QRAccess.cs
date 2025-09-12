using System.ComponentModel.DataAnnotations;

namespace MediChain.Api.Models;

public class QRAccess
{
    [Key]
    public string AccessID { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string PatientID { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string QRToken { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string AccessLevel { get; set; } = string.Empty; // emergency, basic, full

    [Required]
    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ViewedAt { get; set; }

    public string? ViewerInfo { get; set; } // JSON with IP, device info

    // Navigation property
    public Patient Patient { get; set; } = null!;
}