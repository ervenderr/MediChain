using System.ComponentModel.DataAnnotations;

namespace MediChain.Api.Models;

public class EmergencyInfo
{
    [Key]
    public string PatientID { get; set; } = string.Empty;

    [StringLength(100)]
    public string? EmergencyContactName { get; set; }

    [StringLength(20)]
    public string? EmergencyContactPhone { get; set; }

    public string? CriticalAllergies { get; set; } // JSON array

    public string? ChronicConditions { get; set; } // JSON array

    public string? CurrentMedications { get; set; } // JSON array

    [StringLength(10)]
    public string? BloodType { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Patient Patient { get; set; } = null!;
}