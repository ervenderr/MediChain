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
public class EmergencyInfoController : ControllerBase
{
    private readonly MediChainDbContext _context;

    public EmergencyInfoController(MediChainDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<EmergencyInfoDto>> GetEmergencyInfo()
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        var emergencyInfo = await _context.EmergencyInfos
            .Where(e => e.PatientID == patientId)
            .FirstOrDefaultAsync();

        if (emergencyInfo == null)
        {
            // Return empty emergency info structure
            return Ok(new EmergencyInfoDto
            {
                PatientID = patientId,
                EmergencyContactName = "",
                EmergencyContactPhone = "",
                CriticalAllergies = new List<string>(),
                ChronicConditions = new List<string>(),
                CurrentMedications = new List<string>(),
                BloodType = "",
                IsConfigured = false
            });
        }

        return Ok(new EmergencyInfoDto
        {
            PatientID = emergencyInfo.PatientID,
            EmergencyContactName = emergencyInfo.EmergencyContactName ?? "",
            EmergencyContactPhone = emergencyInfo.EmergencyContactPhone ?? "",
            CriticalAllergies = ParseJsonArray(emergencyInfo.CriticalAllergies),
            ChronicConditions = ParseJsonArray(emergencyInfo.ChronicConditions),
            CurrentMedications = ParseJsonArray(emergencyInfo.CurrentMedications),
            BloodType = emergencyInfo.BloodType ?? "",
            UpdatedAt = emergencyInfo.UpdatedAt,
            IsConfigured = true
        });
    }

    [HttpPost]
    public async Task<ActionResult<EmergencyInfoDto>> CreateOrUpdateEmergencyInfo([FromBody] CreateEmergencyInfoDto createDto)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existingInfo = await _context.EmergencyInfos
            .Where(e => e.PatientID == patientId)
            .FirstOrDefaultAsync();

        if (existingInfo != null)
        {
            // Update existing
            existingInfo.EmergencyContactName = createDto.EmergencyContactName;
            existingInfo.EmergencyContactPhone = createDto.EmergencyContactPhone;
            existingInfo.CriticalAllergies = SerializeJsonArray(createDto.CriticalAllergies);
            existingInfo.ChronicConditions = SerializeJsonArray(createDto.ChronicConditions);
            existingInfo.CurrentMedications = SerializeJsonArray(createDto.CurrentMedications);
            existingInfo.BloodType = createDto.BloodType;
            existingInfo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new EmergencyInfoDto
            {
                PatientID = existingInfo.PatientID,
                EmergencyContactName = existingInfo.EmergencyContactName ?? "",
                EmergencyContactPhone = existingInfo.EmergencyContactPhone ?? "",
                CriticalAllergies = createDto.CriticalAllergies,
                ChronicConditions = createDto.ChronicConditions,
                CurrentMedications = createDto.CurrentMedications,
                BloodType = existingInfo.BloodType ?? "",
                UpdatedAt = existingInfo.UpdatedAt,
                IsConfigured = true
            });
        }
        else
        {
            // Create new
            var emergencyInfo = new EmergencyInfo
            {
                PatientID = patientId,
                EmergencyContactName = createDto.EmergencyContactName,
                EmergencyContactPhone = createDto.EmergencyContactPhone,
                CriticalAllergies = SerializeJsonArray(createDto.CriticalAllergies),
                ChronicConditions = SerializeJsonArray(createDto.ChronicConditions),
                CurrentMedications = SerializeJsonArray(createDto.CurrentMedications),
                BloodType = createDto.BloodType,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EmergencyInfos.Add(emergencyInfo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmergencyInfo), new EmergencyInfoDto
            {
                PatientID = emergencyInfo.PatientID,
                EmergencyContactName = emergencyInfo.EmergencyContactName ?? "",
                EmergencyContactPhone = emergencyInfo.EmergencyContactPhone ?? "",
                CriticalAllergies = createDto.CriticalAllergies,
                ChronicConditions = createDto.ChronicConditions,
                CurrentMedications = createDto.CurrentMedications,
                BloodType = emergencyInfo.BloodType ?? "",
                UpdatedAt = emergencyInfo.UpdatedAt,
                IsConfigured = true
            });
        }
    }

    [HttpGet("summary")]
    public async Task<ActionResult<EmergencySummaryDto>> GetEmergencySummary()
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        // Get patient basic info
        var patient = await _context.Users
            .Where(p => p.Id == patientId)
            .FirstOrDefaultAsync();

        if (patient == null)
            return NotFound();

        // Get emergency info
        var emergencyInfo = await _context.EmergencyInfos
            .Where(e => e.PatientID == patientId)
            .FirstOrDefaultAsync();

        // Get critical health records (allergies and current medications)
        var criticalRecords = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive && 
                       (h.Category == "allergy" || h.Category == "medication"))
            .OrderByDescending(h => h.CreatedAt)
            .Take(10)
            .Select(h => new CriticalHealthRecordDto
            {
                Title = h.Title,
                Category = h.Category,
                Content = h.Content,
                DateRecorded = h.DateRecorded
            })
            .ToListAsync();

        return Ok(new EmergencySummaryDto
        {
            PatientInfo = new PatientSummaryDto
            {
                Name = $"{patient.FirstName} {patient.LastName}",
                DateOfBirth = patient.DateOfBirth,
                BloodType = emergencyInfo?.BloodType ?? patient.BloodType ?? "Unknown"
            },
            EmergencyContact = emergencyInfo != null ? new EmergencyContactDto
            {
                Name = emergencyInfo.EmergencyContactName ?? "",
                Phone = emergencyInfo.EmergencyContactPhone ?? ""
            } : null,
            CriticalAllergies = emergencyInfo != null ? ParseJsonArray(emergencyInfo.CriticalAllergies) : new List<string>(),
            ChronicConditions = emergencyInfo != null ? ParseJsonArray(emergencyInfo.ChronicConditions) : new List<string>(),
            CurrentMedications = emergencyInfo != null ? ParseJsonArray(emergencyInfo.CurrentMedications) : new List<string>(),
            CriticalHealthRecords = criticalRecords,
            IsEmergencyProfileComplete = emergencyInfo != null
        });
    }

    private List<string> ParseJsonArray(string? jsonString)
    {
        if (string.IsNullOrWhiteSpace(jsonString))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(jsonString) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private string SerializeJsonArray(List<string> items)
    {
        return JsonSerializer.Serialize(items ?? new List<string>());
    }
}

// DTOs
public class EmergencyInfoDto
{
    public string PatientID { get; set; } = string.Empty;
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public List<string> CriticalAllergies { get; set; } = new();
    public List<string> ChronicConditions { get; set; } = new();
    public List<string> CurrentMedications { get; set; } = new();
    public string BloodType { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public bool IsConfigured { get; set; }
}

public class CreateEmergencyInfoDto
{
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public List<string> CriticalAllergies { get; set; } = new();
    public List<string> ChronicConditions { get; set; } = new();
    public List<string> CurrentMedications { get; set; } = new();
    public string? BloodType { get; set; }
}

public class EmergencySummaryDto
{
    public PatientSummaryDto PatientInfo { get; set; } = new();
    public EmergencyContactDto? EmergencyContact { get; set; }
    public List<string> CriticalAllergies { get; set; } = new();
    public List<string> ChronicConditions { get; set; } = new();
    public List<string> CurrentMedications { get; set; } = new();
    public List<CriticalHealthRecordDto> CriticalHealthRecords { get; set; } = new();
    public bool IsEmergencyProfileComplete { get; set; }
}

public class PatientSummaryDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string BloodType { get; set; } = string.Empty;
}

public class EmergencyContactDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class CriticalHealthRecordDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? DateRecorded { get; set; }
}