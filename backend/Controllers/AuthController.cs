using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MediChain.Api.Models;
using MediChain.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MediChain.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Patient> _userManager;
    private readonly SignInManager<Patient> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly IHCaptchaService _hCaptchaService;

    public AuthController(
        UserManager<Patient> userManager,
        SignInManager<Patient> signInManager,
        IConfiguration configuration,
        IHCaptchaService hCaptchaService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _hCaptchaService = hCaptchaService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Validate that either email or phone is provided
        if (string.IsNullOrEmpty(model.Email) && string.IsNullOrEmpty(model.PhoneNumber))
            return BadRequest("Either email or phone number is required.");

        // Check if request is from mobile app (skip captcha for mobile)
        var isMobileApp = Request.Headers.ContainsKey("X-Mobile-App") ||
                         Request.Headers.UserAgent.ToString().Contains("Expo") ||
                         Request.Headers.UserAgent.ToString().Contains("ReactNative");

        // Verify hCaptcha token only for web requests
        if (!isMobileApp)
        {
            if (string.IsNullOrEmpty(model.HCaptchaToken))
                return BadRequest("Captcha verification required.");

            var isCaptchaValid = await _hCaptchaService.VerifyTokenAsync(model.HCaptchaToken);
            if (!isCaptchaValid)
                return BadRequest("Invalid captcha verification.");
        }

        // Use email as username if provided, otherwise use phone number
        var userName = !string.IsNullOrEmpty(model.Email) ? model.Email : model.PhoneNumber;

        var patient = new Patient
        {
            UserName = userName,
            Email = model.Email,
            PhoneNumber = model.PhoneNumber,
            FirstName = model.FirstName,
            LastName = model.LastName,
            DateOfBirth = model.DateOfBirth,
            BloodType = model.BloodType
        };

        var result = await _userManager.CreateAsync(patient, model.Password);

        if (result.Succeeded)
        {
            var token = await GenerateJwtToken(patient);
            return Ok(new AuthResponse
            {
                Token = token,
                PatientId = patient.Id,
                Email = patient.Email,
                FirstName = patient.FirstName,
                LastName = patient.LastName
            });
        }

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Validate that either email or phone is provided
        if (string.IsNullOrEmpty(model.Email) && string.IsNullOrEmpty(model.PhoneNumber))
            return BadRequest("Either email or phone number is required.");

        // Check if request is from mobile app (skip captcha for mobile)
        var isMobileApp = Request.Headers.ContainsKey("X-Mobile-App") ||
                         Request.Headers.UserAgent.ToString().Contains("Expo") ||
                         Request.Headers.UserAgent.ToString().Contains("ReactNative");

        // Verify hCaptcha token only for web requests
        if (!isMobileApp)
        {
            if (string.IsNullOrEmpty(model.HCaptchaToken))
                return BadRequest("Captcha verification required.");

            var isCaptchaValid = await _hCaptchaService.VerifyTokenAsync(model.HCaptchaToken);
            if (!isCaptchaValid)
                return BadRequest("Invalid captcha verification.");
        }

        Patient? patient = null;

        // Try to find user by email or phone
        if (!string.IsNullOrEmpty(model.Email))
        {
            patient = await _userManager.FindByEmailAsync(model.Email);
        }
        else if (!string.IsNullOrEmpty(model.PhoneNumber))
        {
            patient = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == model.PhoneNumber);
        }

        if (patient == null)
            return BadRequest("Invalid credentials.");

        var result = await _signInManager.CheckPasswordSignInAsync(patient, model.Password, false);

        if (result.Succeeded)
        {
            var token = await GenerateJwtToken(patient);
            return Ok(new AuthResponse
            {
                Token = token,
                PatientId = patient.Id,
                Email = patient.Email,
                FirstName = patient.FirstName,
                LastName = patient.LastName
            });
        }

        return BadRequest("Invalid credentials.");
    }

    private async Task<string> GenerateJwtToken(Patient patient)
    {
        var jwtKey = _configuration["JWT:Key"] ?? "your-super-secret-jwt-key-that-is-at-least-32-chars-long";
        var key = Encoding.ASCII.GetBytes(jwtKey);

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, patient.Id),
                new Claim(ClaimTypes.Email, patient.Email!),
                new Claim(ClaimTypes.Name, $"{patient.FirstName} {patient.LastName}")
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

public class RegisterModel
{
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? BloodType { get; set; }
    public string? HCaptchaToken { get; set; }
}

public class LoginModel
{
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = string.Empty;
    public string? HCaptchaToken { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string PatientId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}