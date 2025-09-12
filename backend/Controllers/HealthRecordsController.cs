using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediChain.Api.Data;
using MediChain.Api.Models;
using System.Security.Claims;
using System.Text.Json;

namespace MediChain.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HealthRecordsController : ControllerBase
{
    private readonly MediChainDbContext _context;

    public HealthRecordsController(MediChainDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HealthRecordDto>>> GetHealthRecords()
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        var healthRecords = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        var records = new List<HealthRecordDto>();
        foreach (var hr in healthRecords)
        {
            var files = new List<HealthRecordFileDto>();
            
            // Try to get files, but handle case where table doesn't exist yet
            try
            {
                files = await _context.HealthRecordFiles
                    .Where(f => f.RecordID == hr.RecordID)
                    .Select(f => new HealthRecordFileDto
                    {
                        FileID = f.FileID,
                        OriginalFileName = f.OriginalFileName,
                        ContentType = f.ContentType,
                        FileSize = f.FileSize,
                        UploadedAt = f.UploadedAt
                    })
                    .ToListAsync();
            }
            catch (Microsoft.Data.Sqlite.SqliteException)
            {
                // Table doesn't exist yet, use empty list
                files = new List<HealthRecordFileDto>();
            }

            records.Add(new HealthRecordDto
            {
                RecordID = hr.RecordID,
                Title = hr.Title,
                Category = hr.Category,
                Content = hr.Content,
                DateRecorded = hr.DateRecorded,
                Attachments = hr.Attachments,
                CreatedAt = hr.CreatedAt,
                Files = files
            });
        }

        return Ok(records);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HealthRecordDto>> GetHealthRecord(string id)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        var healthRecord = await _context.HealthRecords
            .FirstOrDefaultAsync(h => h.RecordID == id && h.PatientID == patientId && h.IsActive);

        if (healthRecord == null)
            return NotFound();

        var files = new List<HealthRecordFileDto>();
        
        // Try to get files, but handle case where table doesn't exist yet
        try
        {
            files = await _context.HealthRecordFiles
                .Where(f => f.RecordID == healthRecord.RecordID)
                .Select(f => new HealthRecordFileDto
                {
                    FileID = f.FileID,
                    OriginalFileName = f.OriginalFileName,
                    ContentType = f.ContentType,
                    FileSize = f.FileSize,
                    UploadedAt = f.UploadedAt
                })
                .ToListAsync();
        }
        catch (Microsoft.Data.Sqlite.SqliteException)
        {
            // Table doesn't exist yet, use empty list
            files = new List<HealthRecordFileDto>();
        }

        var record = new HealthRecordDto
        {
            RecordID = healthRecord.RecordID,
            Title = healthRecord.Title,
            Category = healthRecord.Category,
            Content = healthRecord.Content,
            DateRecorded = healthRecord.DateRecorded,
            Attachments = healthRecord.Attachments,
            CreatedAt = healthRecord.CreatedAt,
            Files = files
        };

        return Ok(record);
    }

    [HttpPost]
    public async Task<ActionResult<HealthRecordDto>> CreateHealthRecord([FromBody] CreateHealthRecordDto createDto)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var healthRecord = new HealthRecord
        {
            PatientID = patientId,
            Title = createDto.Title,
            Category = createDto.Category,
            Content = createDto.Content,
            DateRecorded = createDto.DateRecorded,
            Attachments = createDto.Attachments
        };

        _context.HealthRecords.Add(healthRecord);
        await _context.SaveChangesAsync();

        var resultDto = new HealthRecordDto
        {
            RecordID = healthRecord.RecordID,
            Title = healthRecord.Title,
            Category = healthRecord.Category,
            Content = healthRecord.Content,
            DateRecorded = healthRecord.DateRecorded,
            Attachments = healthRecord.Attachments,
            CreatedAt = healthRecord.CreatedAt
        };

        return CreatedAtAction(nameof(GetHealthRecord), new { id = healthRecord.RecordID }, resultDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHealthRecord(string id, [FromBody] UpdateHealthRecordDto updateDto)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var healthRecord = await _context.HealthRecords
            .Where(h => h.RecordID == id && h.PatientID == patientId && h.IsActive)
            .FirstOrDefaultAsync();

        if (healthRecord == null)
            return NotFound();

        healthRecord.Title = updateDto.Title;
        healthRecord.Category = updateDto.Category;
        healthRecord.Content = updateDto.Content;
        healthRecord.DateRecorded = updateDto.DateRecorded;
        healthRecord.Attachments = updateDto.Attachments;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHealthRecord(string id)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        var healthRecord = await _context.HealthRecords
            .Where(h => h.RecordID == id && h.PatientID == patientId && h.IsActive)
            .FirstOrDefaultAsync();

        if (healthRecord == null)
            return NotFound();

        // Soft delete
        healthRecord.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("categories")]
    public ActionResult<IEnumerable<string>> GetCategories()
    {
        var categories = new[]
        {
            "allergy",
            "medication", 
            "condition",
            "lab_result",
            "vaccination",
            "procedure",
            "appointment"
        };

        return Ok(categories);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<HealthRecordStatsDto>> GetStats()
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        var totalRecords = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive)
            .CountAsync();

        var categoryCounts = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive)
            .GroupBy(h => h.Category)
            .Select(g => new CategoryCountDto
            {
                Category = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        var recentRecords = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive)
            .Where(h => h.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return Ok(new HealthRecordStatsDto
        {
            TotalRecords = totalRecords,
            CategoryCounts = categoryCounts,
            RecentRecords = recentRecords
        });
    }

    // DEVELOPMENT ONLY - Clear all records for current user
    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAllUserRecords()
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        try
        {
            // Delete all health records for this patient
            var records = await _context.HealthRecords
                .Where(h => h.PatientID == patientId)
                .ToListAsync();
            
            _context.HealthRecords.RemoveRange(records);
            await _context.SaveChangesAsync();

            return Ok(new { message = "All health records cleared", deletedCount = records.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Error clearing records: " + ex.Message);
        }
    }
}

// DTOs
public class HealthRecordDto
{
    public string RecordID { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? DateRecorded { get; set; }
    public string? Attachments { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<HealthRecordFileDto> Files { get; set; } = new List<HealthRecordFileDto>();
}

public class HealthRecordFileDto
{
    public string FileID { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class CreateHealthRecordDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? DateRecorded { get; set; }
    public string? Attachments { get; set; }
}

public class UpdateHealthRecordDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? DateRecorded { get; set; }
    public string? Attachments { get; set; }
}

public class CategoryCountDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class HealthRecordStatsDto
{
    public int TotalRecords { get; set; }
    public List<CategoryCountDto> CategoryCounts { get; set; } = new();
    public int RecentRecords { get; set; }
}