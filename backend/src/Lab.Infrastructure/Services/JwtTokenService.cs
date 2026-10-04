using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Lab.Infrastructure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Lab.Infrastructure.Services;

public interface IJwtTokenService
{
    string GenerateJwtToken(ApplicationUser user, string? labName = null);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateJwtToken(ApplicationUser user, string? labName = null)
    {
        var secret = _config["Jwt:Key"] ?? "DigitLabEnterpriseSuperSecretEncryptionKey2026!@#$%^&*";
        var issuer = _config["Jwt:Issuer"] ?? "DigitLab";
        var audience = _config["Jwt:Audience"] ?? "DigitLabApp";
        var expiryMinutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var mins) ? mins : 1440; // 24 hours

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.FullName ?? user.UserName ?? "User"),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Role, user.Role ?? "LabStaff")
        };

        if (user.TenantId.HasValue)
        {
            claims.Add(new Claim("TenantId", user.TenantId.Value.ToString()));
        }

        if (!string.IsNullOrEmpty(labName))
        {
            claims.Add(new Claim("LabName", labName));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
