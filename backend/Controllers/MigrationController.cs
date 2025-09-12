using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediChain.Api.Data;

namespace MediChain.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MigrationController : ControllerBase
{
    private readonly MediChainDbContext _context;
    private readonly ILogger<MigrationController> _logger;

    public MigrationController(MediChainDbContext context, ILogger<MigrationController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("create-files-table")]
    public async Task<IActionResult> CreateFilesTable()
    {
        try
        {
            // Use Entity Framework to create the table
            await _context.Database.EnsureCreatedAsync();
            
            // Test if the table exists now
            var tableExists = await _context.HealthRecordFiles.CountAsync();
            
            _logger.LogInformation("HealthRecordFiles table created successfully");
            
            return Ok(new { 
                message = "HealthRecordFiles table created successfully",
                filesCount = tableExists 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating HealthRecordFiles table");
            return StatusCode(500, new { 
                message = "Error creating table", 
                error = ex.Message 
            });
        }
    }

    [HttpGet("check-files-table")]
    public async Task<IActionResult> CheckFilesTable()
    {
        try
        {
            var count = await _context.HealthRecordFiles.CountAsync();
            return Ok(new { 
                exists = true, 
                message = "HealthRecordFiles table exists",
                filesCount = count
            });
        }
        catch (Exception ex)
        {
            return Ok(new { 
                exists = false, 
                message = "HealthRecordFiles table does not exist",
                error = ex.Message
            });
        }
    }
}