using System.ComponentModel.DataAnnotations;

namespace MediChain.Api.Models;

public class HealthRecord
{
    [Key]
    public string RecordID { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string PatientID { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty; // allergy, medication, condition, lab_result, vaccination

    [Required]
    public string Content { get; set; } = string.Empty; // JSON data

    public DateTime? DateRecorded { get; set; }

    public string? Attachments { get; set; } // JSON array of file paths

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Patient Patient { get; set; } = null!;
}