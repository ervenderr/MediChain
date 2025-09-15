using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace MediChain.Api.Models;

public class Patient : IdentityUser
{
    [Required]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public DateTime DateOfBirth { get; set; }

    [StringLength(10)]
    public string? BloodType { get; set; }

    [Phone]
    [StringLength(20)]
    public override string? PhoneNumber { get; set; }

    [StringLength(200)]
    public string? ProfilePhoto { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<HealthRecord> HealthRecords { get; set; } = new List<HealthRecord>();
    public EmergencyInfo? EmergencyInfo { get; set; }
    public ICollection<QRAccess> QRAccesses { get; set; } = new List<QRAccess>();
}