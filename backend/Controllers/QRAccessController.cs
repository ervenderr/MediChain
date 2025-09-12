using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediChain.Api.Data;
using MediChain.Api.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MediChain.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QRAccessController : ControllerBase
{
    private readonly MediChainDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<QRAccessController> _logger;

    public QRAccessController(
        MediChainDbContext context, 
        IConfiguration configuration,
        ILogger<QRAccessController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("generate")]
    [Authorize]
    public async Task<ActionResult<QRTokenResponseDto>> GenerateQRToken([FromBody] GenerateQRTokenDto request)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Validate access level
        if (!IsValidAccessLevel(request.AccessLevel))
            return BadRequest("Invalid access level");

        // Validate expiration time (max 24 hours, min 5 minutes)
        // Use more flexible validation for 5 minutes (0.083 hours)
        if (request.ExpirationHours < 0.08 || request.ExpirationHours > 24)
            return BadRequest("Expiration must be between 5 minutes and 24 hours");

        try
        {
            // Generate cryptographically secure token
            var secureToken = GenerateSecureToken();
            var expiresAt = DateTime.UtcNow.AddHours(request.ExpirationHours);

            // Create QR access record
            var qrAccess = new QRAccess
            {
                PatientID = patientId,
                QRToken = secureToken,
                AccessLevel = request.AccessLevel.ToLower(),
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            _context.QRAccesses.Add(qrAccess);
            await _context.SaveChangesAsync();

            // Generate the public URL
            var baseUrl = GetBaseUrl();
            var qrUrl = $"{baseUrl}/view/{request.AccessLevel.ToLower()}/{secureToken}";

            // Log QR generation (without sensitive data)
            _logger.LogInformation("QR token generated for patient {PatientId} with access level {AccessLevel}",
                patientId, request.AccessLevel);

            return Ok(new QRTokenResponseDto
            {
                AccessID = qrAccess.AccessID,
                QRToken = secureToken,
                QRUrl = qrUrl,
                AccessLevel = qrAccess.AccessLevel,
                ExpiresAt = ConvertToPhilippineTime(qrAccess.ExpiresAt),
                CreatedAt = ConvertToPhilippineTime(qrAccess.CreatedAt)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR token for patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while generating the QR token");
        }
    }

    [HttpGet("verify/{token}")]
    public async Task<ActionResult<QRVerificationDto>> VerifyQRToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest("Token is required");

        // Sanitize token input
        token = SanitizeToken(token);
        if (string.IsNullOrEmpty(token))
            return BadRequest("Invalid token format");

        try
        {
            var qrAccess = await _context.QRAccesses
                .Include(q => q.Patient)
                .Where(q => q.QRToken == token)
                .FirstOrDefaultAsync();

            if (qrAccess == null)
            {
                _logger.LogWarning("Invalid QR token access attempt: {Token}", token);
                return NotFound("Invalid or expired QR code");
            }

            // Check if token is expired
            if (qrAccess.ExpiresAt <= DateTime.UtcNow)
            {
                _logger.LogWarning("Expired QR token access attempt: {Token} expired at {ExpiresAt}", 
                    token, qrAccess.ExpiresAt);
                return BadRequest("QR code has expired");
            }

            // Log access attempt
            qrAccess.ViewedAt = DateTime.UtcNow;
            qrAccess.ViewerInfo = JsonSerializer.Serialize(new
            {
                IP = GetClientIP(),
                UserAgent = Request.Headers.UserAgent.ToString(),
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            _logger.LogInformation("QR token verified successfully for patient {PatientId}, access level {AccessLevel}",
                qrAccess.PatientID, qrAccess.AccessLevel);

            return Ok(new QRVerificationDto
            {
                IsValid = true,
                PatientID = qrAccess.PatientID,
                AccessLevel = qrAccess.AccessLevel,
                ExpiresAt = ConvertToPhilippineTime(qrAccess.ExpiresAt),
                PatientName = $"{qrAccess.Patient.FirstName} {qrAccess.Patient.LastName}",
                ViewCount = await _context.QRAccesses
                    .Where(q => q.QRToken == token && q.ViewedAt != null)
                    .CountAsync()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying QR token {Token}", token);
            return StatusCode(500, "An error occurred while verifying the QR token");
        }
    }

    [HttpGet("data/{token}/{accessLevel}")]
    public async Task<ActionResult<QRHealthDataDto>> GetHealthData(string token, string accessLevel)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(accessLevel))
            return BadRequest("Token and access level are required");

        // Sanitize inputs
        token = SanitizeToken(token);
        accessLevel = accessLevel.ToLower().Trim();

        if (string.IsNullOrEmpty(token) || !IsValidAccessLevel(accessLevel))
            return BadRequest("Invalid token or access level");

        try
        {
            // Verify token first
            var verificationResult = await VerifyQRToken(token);
            if (verificationResult.Result is not OkObjectResult okResult)
                return verificationResult.Result!;

            var verification = okResult.Value as QRVerificationDto;
            if (verification == null || !verification.IsValid)
                return BadRequest("Invalid or expired QR code");

            // Check if access level matches
            if (verification.AccessLevel != accessLevel)
                return BadRequest("Access level mismatch");

            var patientId = verification.PatientID;

            // Get health data based on access level
            var healthData = await GetHealthDataByAccessLevel(patientId, accessLevel);

            _logger.LogInformation("Health data accessed for patient {PatientId} with access level {AccessLevel}",
                patientId, accessLevel);

            return Ok(healthData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting health data for token {Token}", token);
            return StatusCode(500, "An error occurred while retrieving health data");
        }
    }

    [HttpGet("active")]
    [Authorize]
    public async Task<ActionResult<List<ActiveQRTokenDto>>> GetActiveTokens()
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        try
        {
            var activeTokensData = await _context.QRAccesses
                .Where(q => q.PatientID == patientId && q.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(q => q.CreatedAt)
                .ToListAsync();

            var activeTokens = activeTokensData.Select(q => new ActiveQRTokenDto
            {
                AccessID = q.AccessID,
                AccessLevel = q.AccessLevel,
                QRToken = q.QRToken,
                QRUrl = $"{GetBaseUrl()}/view/{q.AccessLevel}/{q.QRToken}",
                CreatedAt = ConvertToPhilippineTime(q.CreatedAt),
                ExpiresAt = ConvertToPhilippineTime(q.ExpiresAt),
                ViewedAt = q.ViewedAt != null ? ConvertToPhilippineTime(q.ViewedAt.Value) : null,
                IsViewed = q.ViewedAt != null
            }).ToList();

            return Ok(activeTokens);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active tokens for patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while retrieving active tokens");
        }
    }

    [HttpDelete("revoke/{accessId}")]
    [Authorize]
    public async Task<IActionResult> RevokeToken(string accessId)
    {
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(patientId))
            return Unauthorized();

        try
        {
            var qrAccess = await _context.QRAccesses
                .Where(q => q.AccessID == accessId && q.PatientID == patientId)
                .FirstOrDefaultAsync();

            if (qrAccess == null)
                return NotFound("QR token not found");

            // Revoke by setting expiration to past
            qrAccess.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await _context.SaveChangesAsync();

            _logger.LogInformation("QR token revoked for patient {PatientId}, access ID {AccessId}",
                patientId, accessId);

            return Ok("QR token revoked successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking QR token {AccessId} for patient {PatientId}", accessId, patientId);
            return StatusCode(500, "An error occurred while revoking the QR token");
        }
    }

    // Private helper methods
    private string GenerateSecureToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32]; // 256 bits
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", ""); // URL-safe base64
    }

    private string SanitizeToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return string.Empty;

        // Remove any non-alphanumeric characters except - and _
        var sanitized = new StringBuilder();
        foreach (char c in token.Trim())
        {
            if (char.IsLetterOrDigit(c) || c == '-' || c == '_')
                sanitized.Append(c);
        }

        return sanitized.ToString();
    }

    private DateTime ConvertToPhilippineTime(DateTime utcDateTime)
    {
        // Philippine Standard Time is UTC+8
        var philippineTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila");
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, philippineTimeZone);
    }

    private bool IsValidAccessLevel(string accessLevel)
    {
        var validLevels = new[] { "emergency", "basic", "full" };
        return validLevels.Contains(accessLevel.ToLower());
    }

    private string GetBaseUrl()
    {
        var request = HttpContext.Request;
        var baseUrl = _configuration["Frontend:BaseUrl"] ?? $"{request.Scheme}://{request.Host}";
        return baseUrl.TrimEnd('/');
    }

    private string GetClientIP()
    {
        var forwarded = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwarded))
            return forwarded.Split(',').First().Trim();

        var realIP = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIP))
            return realIP;

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }

    private async Task<QRHealthDataDto> GetHealthDataByAccessLevel(string patientId, string accessLevel)
    {
        var patient = await _context.Users.FindAsync(patientId);
        if (patient == null)
            throw new InvalidOperationException("Patient not found");

        var result = new QRHealthDataDto
        {
            PatientInfo = new QRPatientInfoDto
            {
                Name = $"{patient.FirstName} {patient.LastName}",
                DateOfBirth = patient.DateOfBirth,
                BloodType = patient.BloodType ?? "Unknown"
            }
        };

        switch (accessLevel)
        {
            case "emergency":
                await PopulateEmergencyData(result, patientId);
                break;
            case "basic":
                await PopulateBasicData(result, patientId);
                break;
            case "full":
                await PopulateFullData(result, patientId);
                break;
        }

        return result;
    }

    private async Task PopulateEmergencyData(QRHealthDataDto data, string patientId)
    {
        var emergencyInfo = await _context.EmergencyInfos
            .Where(e => e.PatientID == patientId)
            .FirstOrDefaultAsync();

        if (emergencyInfo != null)
        {
            data.EmergencyContact = new QREmergencyContactDto
            {
                Name = emergencyInfo.EmergencyContactName ?? "",
                Phone = emergencyInfo.EmergencyContactPhone ?? ""
            };

            try
            {
                data.CriticalAllergies = string.IsNullOrWhiteSpace(emergencyInfo.CriticalAllergies) 
                    ? new List<string>() 
                    : JsonSerializer.Deserialize<List<string>>(emergencyInfo.CriticalAllergies) ?? new List<string>();

                data.CurrentMedications = string.IsNullOrWhiteSpace(emergencyInfo.CurrentMedications) 
                    ? new List<string>() 
                    : JsonSerializer.Deserialize<List<string>>(emergencyInfo.CurrentMedications) ?? new List<string>();
            }
            catch
            {
                data.CriticalAllergies = new List<string>();
                data.CurrentMedications = new List<string>();
            }
        }
    }

    private async Task PopulateBasicData(QRHealthDataDto data, string patientId)
    {
        await PopulateEmergencyData(data, patientId);

        // Add recent health records (last 30 days)
        data.RecentHealthRecords = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive && 
                       h.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .OrderByDescending(h => h.CreatedAt)
            .Take(10)
            .Select(h => new QRHealthRecordDto
            {
                Title = h.Title,
                Category = h.Category,
                Content = h.Content.Length > 200 ? h.Content.Substring(0, 200) + "..." : h.Content,
                DateRecorded = h.DateRecorded,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync();
    }

    private async Task PopulateFullData(QRHealthDataDto data, string patientId)
    {
        await PopulateBasicData(data, patientId);

        // Add all health records
        data.AllHealthRecords = await _context.HealthRecords
            .Where(h => h.PatientID == patientId && h.IsActive)
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new QRHealthRecordDto
            {
                Title = h.Title,
                Category = h.Category,
                Content = h.Content,
                DateRecorded = h.DateRecorded,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync();

        // Add emergency info details
        var emergencyInfo = await _context.EmergencyInfos
            .Where(e => e.PatientID == patientId)
            .FirstOrDefaultAsync();

        if (emergencyInfo != null)
        {
            try
            {
                data.ChronicConditions = string.IsNullOrWhiteSpace(emergencyInfo.ChronicConditions) 
                    ? new List<string>() 
                    : JsonSerializer.Deserialize<List<string>>(emergencyInfo.ChronicConditions) ?? new List<string>();
            }
            catch
            {
                data.ChronicConditions = new List<string>();
            }
        }
    }
}

// DTOs for QR system
public class GenerateQRTokenDto
{
    public string AccessLevel { get; set; } = string.Empty; // emergency, basic, full
    public double ExpirationHours { get; set; } = 2.0; // Default 2 hours
}

public class QRTokenResponseDto
{
    public string AccessID { get; set; } = string.Empty;
    public string QRToken { get; set; } = string.Empty;
    public string QRUrl { get; set; } = string.Empty;
    public string AccessLevel { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class QRVerificationDto
{
    public bool IsValid { get; set; }
    public string PatientID { get; set; } = string.Empty;
    public string AccessLevel { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int ViewCount { get; set; }
}

public class QRHealthDataDto
{
    public QRPatientInfoDto PatientInfo { get; set; } = new();
    public QREmergencyContactDto? EmergencyContact { get; set; }
    public List<string> CriticalAllergies { get; set; } = new();
    public List<string> CurrentMedications { get; set; } = new();
    public List<string> ChronicConditions { get; set; } = new();
    public List<QRHealthRecordDto> RecentHealthRecords { get; set; } = new();
    public List<QRHealthRecordDto> AllHealthRecords { get; set; } = new();
}

public class QRPatientInfoDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string BloodType { get; set; } = string.Empty;
}

public class QREmergencyContactDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class QRHealthRecordDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? DateRecorded { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ActiveQRTokenDto
{
    public string AccessID { get; set; } = string.Empty;
    public string AccessLevel { get; set; } = string.Empty;
    public string QRToken { get; set; } = string.Empty;
    public string QRUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ViewedAt { get; set; }
    public bool IsViewed { get; set; }
}