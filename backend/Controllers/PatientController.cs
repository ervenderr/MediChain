using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MediChain.Api.Models;
using System.Security.Claims;

namespace MediChain.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly UserManager<Patient> _userManager;

    public PatientController(UserManager<Patient> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var patient = await _userManager.FindByIdAsync(userId);
        if (patient == null)
            return NotFound("Patient not found");

        var profile = new PatientProfileResponse
        {
            PatientID = patient.Id,
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            Email = patient.Email!,
            DateOfBirth = patient.DateOfBirth,
            BloodType = patient.BloodType,
            CreatedAt = patient.CreatedAt,
            UpdatedAt = DateTime.UtcNow // For now, using current time as updated timestamp
        };

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var patient = await _userManager.FindByIdAsync(userId);
        if (patient == null)
            return NotFound("Patient not found");

        // Update patient information
        patient.FirstName = model.FirstName;
        patient.LastName = model.LastName;
        patient.Email = model.Email;
        patient.UserName = model.Email; // Update username as well since it's typically the email
        patient.DateOfBirth = model.DateOfBirth;
        patient.BloodType = model.BloodType;

        var result = await _userManager.UpdateAsync(patient);

        if (result.Succeeded)
        {
            var updatedProfile = new PatientProfileResponse
            {
                PatientID = patient.Id,
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                Email = patient.Email!,
                DateOfBirth = patient.DateOfBirth,
                BloodType = patient.BloodType,
                CreatedAt = patient.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(updatedProfile);
        }

        return BadRequest(result.Errors);
    }
}

public class PatientProfileResponse
{
    public string PatientID { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? BloodType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdatePatientProfileModel
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? BloodType { get; set; }
}