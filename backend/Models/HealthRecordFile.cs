using System.ComponentModel.DataAnnotations;

namespace MediChain.Api.Models;

public class HealthRecordFile
{
    [Key]
    public string FileID { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string RecordID { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string StoredFileName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ContentType { get; set; } = string.Empty;

    [Required]
    public long FileSize { get; set; }

    [StringLength(500)]
    public string FilePath { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public HealthRecord HealthRecord { get; set; } = null!;
}