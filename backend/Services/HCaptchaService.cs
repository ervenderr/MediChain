using System.Text.Json;

namespace MediChain.Api.Services;

public interface IHCaptchaService
{
    Task<bool> VerifyTokenAsync(string token);
}

public class HCaptchaService : IHCaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;

    public HCaptchaService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _secretKey = _configuration["HCaptcha:SecretKey"] ?? throw new InvalidOperationException("HCaptcha secret key not configured");
    }

    public async Task<bool> VerifyTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            return false;

        // For local development, bypass hCaptcha (hCaptcha doesn't work on localhost)
        var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" ||
                           Environment.GetEnvironmentVariable("DATABASE_URL") == null;
        
        if (isDevelopment)
        {
            return !string.IsNullOrEmpty(token);
        }

        try
        {
            var requestContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("secret", _secretKey),
                new KeyValuePair<string, string>("response", token)
            });

            var response = await _httpClient.PostAsync("https://hcaptcha.com/siteverify", requestContent);
            var responseContent = await response.Content.ReadAsStringAsync();

            var verificationResult = JsonSerializer.Deserialize<HCaptchaVerificationResponse>(responseContent);
            return verificationResult?.Success == true;
        }
        catch
        {
            return false;
        }
    }
}

public class HCaptchaVerificationResponse
{
    public bool Success { get; set; }
    public DateTime? ChallengeTs { get; set; }
    public string? Hostname { get; set; }
    public string[]? ErrorCodes { get; set; }
}