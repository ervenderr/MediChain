using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MediChain.Api.Data;
using MediChain.Api.Models;

namespace MediChain.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly MediChainDbContext _context;
    private readonly ILogger<FileController> _logger;
    private readonly string _uploadsPath;

    public FileController(MediChainDbContext context, ILogger<FileController> logger, IWebHostEnvironment environment)
    {
        _context = context;
        _logger = logger;
        _uploadsPath = Path.Combine(environment.ContentRootPath, "uploads");
        
        // Ensure uploads directory exists
        if (!Directory.Exists(_uploadsPath))
        {
            Directory.CreateDirectory(_uploadsPath);
        }
    }

    [HttpPost("upload/{recordId}")]
    public async Task<ActionResult<HealthRecordFileDto>> UploadFile(string recordId, IFormFile file)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        // Check if HealthRecordFiles table exists
        try
        {
            await _context.HealthRecordFiles.CountAsync();
        }
        catch (Microsoft.Data.Sqlite.SqliteException)
        {
            return BadRequest("File upload feature not available yet. Please run database migration first.");
        }

        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File size exceeds 10MB limit");

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf", "text/plain" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest("File type not allowed. Supported types: JPEG, PNG, GIF, PDF, TXT");

        // Additional security: Check file extension matches content type
        var fileExtension = Path.GetExtension(file.FileName).ToLower();
        var validExtensions = new Dictionary<string, string[]>
        {
            ["image/jpeg"] = [".jpg", ".jpeg"],
            ["image/jpg"] = [".jpg", ".jpeg"],
            ["image/png"] = [".png"],
            ["image/gif"] = [".gif"],
            ["application/pdf"] = [".pdf"],
            ["text/plain"] = [".txt"]
        };

        if (validExtensions.ContainsKey(file.ContentType.ToLower()) && 
            !validExtensions[file.ContentType.ToLower()].Contains(fileExtension))
            return BadRequest("File extension doesn't match content type");

        // Validate filename to prevent path traversal
        if (file.FileName.Contains("..") || file.FileName.Contains("/") || file.FileName.Contains("\\"))
            return BadRequest("Invalid filename");

        try
        {
            // Verify the health record belongs to the patient
            var healthRecord = await _context.HealthRecords
                .FirstOrDefaultAsync(h => h.RecordID == recordId && h.PatientID == patientId);
            
            if (healthRecord == null)
                return NotFound("Health record not found");

            // Generate unique filename
            var originalExtension = Path.GetExtension(file.FileName);
            var storedFileName = $"{Guid.NewGuid()}{originalExtension}";
            var filePath = Path.Combine(_uploadsPath, storedFileName);

            // Save file to disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create file record
            var fileRecord = new HealthRecordFile
            {
                RecordID = recordId,
                OriginalFileName = file.FileName,
                StoredFileName = storedFileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                FilePath = filePath
            };

            _context.HealthRecordFiles.Add(fileRecord);
            await _context.SaveChangesAsync();

            _logger.LogInformation("File uploaded successfully: {FileName} for record {RecordId}", file.FileName, recordId);

            return Ok(new HealthRecordFileDto
            {
                FileID = fileRecord.FileID,
                OriginalFileName = fileRecord.OriginalFileName,
                ContentType = fileRecord.ContentType,
                FileSize = fileRecord.FileSize,
                UploadedAt = fileRecord.UploadedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file for record {RecordId}", recordId);
            return StatusCode(500, "An error occurred while uploading the file");
        }
    }

    [HttpGet("download/{fileId}")]
    public async Task<IActionResult> DownloadFile(string fileId)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        try
        {
            var fileRecord = await _context.HealthRecordFiles
                .Include(f => f.HealthRecord)
                .FirstOrDefaultAsync(f => f.FileID == fileId && f.HealthRecord.PatientID == patientId);

            if (fileRecord == null)
                return NotFound("File not found");

            if (!System.IO.File.Exists(fileRecord.FilePath))
                return NotFound("File not found on disk");

            var memory = new MemoryStream();
            using (var stream = new FileStream(fileRecord.FilePath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            return File(memory, fileRecord.ContentType, fileRecord.OriginalFileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file {FileId}", fileId);
            return StatusCode(500, "An error occurred while downloading the file");
        }
    }

    [HttpGet("record/{recordId}")]
    public async Task<ActionResult<List<HealthRecordFileDto>>> GetRecordFiles(string recordId)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        try
        {
            var files = await _context.HealthRecordFiles
                .Include(f => f.HealthRecord)
                .Where(f => f.RecordID == recordId && f.HealthRecord.PatientID == patientId)
                .Select(f => new HealthRecordFileDto
                {
                    FileID = f.FileID,
                    OriginalFileName = f.OriginalFileName,
                    ContentType = f.ContentType,
                    FileSize = f.FileSize,
                    UploadedAt = f.UploadedAt
                })
                .ToListAsync();

            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting files for record {RecordId}", recordId);
            return StatusCode(500, "An error occurred while retrieving files");
        }
    }

    [HttpDelete("{fileId}")]
    public async Task<IActionResult> DeleteFile(string fileId)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        try
        {
            var fileRecord = await _context.HealthRecordFiles
                .Include(f => f.HealthRecord)
                .FirstOrDefaultAsync(f => f.FileID == fileId && f.HealthRecord.PatientID == patientId);

            if (fileRecord == null)
                return NotFound("File not found");

            // Delete file from disk
            if (System.IO.File.Exists(fileRecord.FilePath))
            {
                System.IO.File.Delete(fileRecord.FilePath);
            }

            // Delete record from database
            _context.HealthRecordFiles.Remove(fileRecord);
            await _context.SaveChangesAsync();

            _logger.LogInformation("File deleted successfully: {FileName}", fileRecord.OriginalFileName);

            return Ok("File deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FileId}", fileId);
            return StatusCode(500, "An error occurred while deleting the file");
        }
    }
}

// Note: HealthRecordFileDto is defined in HealthRecordsController.cs to avoid duplication