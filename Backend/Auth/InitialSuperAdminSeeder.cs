using Backend.Data;
using Backend.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Auth
{
    public static class InitialSuperAdminSeeder
    {
        private const int PasswordLength = 24;
        private const string UppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        private const string LowercaseChars = "abcdefghijkmnopqrstuvwxyz";
        private const string DigitChars = "23456789";
        private const string PasswordChars = UppercaseChars + LowercaseChars + DigitChars;

        public static async Task EnsureSuperAdminAsync(
            IServiceProvider serviceProvider,
            string primaryHost,
            CancellationToken cancellationToken = default)
        {
            var db = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("InitialSuperAdminSeeder");

            await EnsureDefaultGroupAsync(db, cancellationToken);

            if (await HasSuperAdminAccountAsync(db, cancellationToken))
            {
                return;
            }

            var adminEmail = BuildAdminEmail(primaryHost);
            var password = GeneratePassword();

            var user = await userManager.FindByEmailAsync(adminEmail);
            var createdUser = false;

            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    DisplayName = "Administrator",
                    EmailConfirmed = true,
                    IsEmailVerified = true,
                };

                var createResult = await userManager.CreateAsync(user, password);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException($"Failed to create bootstrap SuperAdmin account: {string.Join(", ", createResult.Errors.Select(error => error.Description))}");
                }

                createdUser = true;
            }
            else
            {
                user.EmailConfirmed = true;
                user.IsEmailVerified = true;

                var updateResult = await userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    throw new InvalidOperationException($"Failed to update bootstrap SuperAdmin account: {string.Join(", ", updateResult.Errors.Select(error => error.Description))}");
                }

                if (await userManager.HasPasswordAsync(user))
                {
                    var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                    var resetResult = await userManager.ResetPasswordAsync(user, resetToken, password);
                    if (!resetResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Failed to reset password for bootstrap SuperAdmin account: {string.Join(", ", resetResult.Errors.Select(error => error.Description))}");
                    }
                }
                else
                {
                    var addPasswordResult = await userManager.AddPasswordAsync(user, password);
                    if (!addPasswordResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Failed to add password for bootstrap SuperAdmin account: {string.Join(", ", addPasswordResult.Errors.Select(error => error.Description))}");
                    }
                }
            }

            var hasDirectSuperAdminFlag = await db.UserFeatureFlags
                .AnyAsync(flag => flag.UserId == user.Id && flag.Flag == FeatureFlag.SuperAdmin, cancellationToken);

            if (!hasDirectSuperAdminFlag)
            {
                db.UserFeatureFlags.Add(new UserFeatureFlag
                {
                    UserId = user.Id,
                    Flag = FeatureFlag.SuperAdmin,
                });

                await db.SaveChangesAsync(cancellationToken);
            }

            var action = createdUser ? "Created" : "Promoted";
            logger.LogWarning("{Action} bootstrap SuperAdmin account. Email: {Email}, Password: {Password}", action, adminEmail, password);
            Console.WriteLine($"[{DateTime.UtcNow:O}] {action} bootstrap SuperAdmin account. Email: {adminEmail}, Password: {password}");
        }

        public static async Task EnsureDefaultGroupAsync(
            ApplicationDbContext db,
            CancellationToken cancellationToken = default)
        {
            var defaultGroup = await db.PermissionGroups
                .FirstOrDefaultAsync(group => group.IsDefault, cancellationToken);

            if (defaultGroup != null)
            {
                if (defaultGroup.Type != PermissionGroupType.Manual || defaultGroup.MatchValue != null || defaultGroup.Name != PermissionGroup.DefaultGroupName)
                {
                    defaultGroup.Type = PermissionGroupType.Manual;
                    defaultGroup.MatchValue = null;
                    defaultGroup.Name = PermissionGroup.DefaultGroupName;
                    await db.SaveChangesAsync(cancellationToken);
                }

                return;
            }

            db.PermissionGroups.Add(new PermissionGroup
            {
                Name = PermissionGroup.DefaultGroupName,
                Type = PermissionGroupType.Manual,
                IsDefault = true,
                Priority = int.MinValue,
            });

            await db.SaveChangesAsync(cancellationToken);
        }

        private static async Task<bool> HasSuperAdminAccountAsync(ApplicationDbContext db, CancellationToken cancellationToken)
        {
            var userIds = await db.Users
                .Select(user => user.Id)
                .ToListAsync(cancellationToken);

            foreach (var userId in userIds)
            {
                if (await PermissionResolver.UserHasFlagAsync(db, userId, FeatureFlag.SuperAdmin))
                {
                    return true;
                }
            }

            return false;
        }

        private static string BuildAdminEmail(string primaryHost)
        {
            if (!Uri.TryCreate(primaryHost, UriKind.Absolute, out var hostUri) || string.IsNullOrWhiteSpace(hostUri.Host))
            {
                throw new InvalidOperationException($"AuthConfig.PrimaryHost must be an absolute URI. Current value: '{primaryHost}'");
            }

            return $"admin@{hostUri.Host}";
        }

        private static string GeneratePassword()
        {
            return SecureRandomString.Generate(PasswordLength, PasswordChars, UppercaseChars, LowercaseChars, DigitChars);
        }
    }
}