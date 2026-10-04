using System;
using System.Linq;
using System.Threading.Tasks;
using Lab.Domain.Entities;
using Lab.Infrastructure.Data;
using Lab.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Lab.Infrastructure.Data;

public static class PasswordResetTool
{
    public static async Task ResetAllPasswordsAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var users = await userManager.Users.ToListAsync();
        foreach (var user in users)
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            await userManager.ResetPasswordAsync(user, token, "Pass@12345");
            Console.WriteLine($"Reset password to Pass@12345 for: {user.Email}");
        }
    }
}
