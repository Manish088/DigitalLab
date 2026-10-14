using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Lab.Infrastructure.Identity;
using Lab.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Lab.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await context.Database.EnsureCreatedAsync();

        // 0. Auto-migrate missing columns and tables safely (Self-Healing DB Schema)
        try
        {
            if (context.Database.IsSqlServer())
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = 'IsAdFree' AND Object_ID = Object_ID('Tenants'))
                    BEGIN
                        ALTER TABLE Tenants ADD IsAdFree BIT NOT NULL DEFAULT 0;
                    END

                    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AdCampaigns')
                    BEGIN
                        CREATE TABLE AdCampaigns (
                            Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                            CampaignTitle NVARCHAR(250) NOT NULL,
                            SponsorName NVARCHAR(250) NOT NULL,
                            SponsorContact NVARCHAR(100) NULL,
                            BannerImageUrl NVARCHAR(MAX) NOT NULL,
                            TargetType INT NOT NULL DEFAULT 1,
                            TargetCity NVARCHAR(150) NULL,
                            TargetState NVARCHAR(150) NULL,
                            StartDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            EndDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            DurationDays INT NOT NULL DEFAULT 30,
                            IsActive BIT NOT NULL DEFAULT 1,
                            DealAmount DECIMAL(18, 2) NULL,
                            PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                            TargetUrl NVARCHAR(MAX) NULL,
                            QrCodeUrl NVARCHAR(MAX) NULL,
                            WhatsAppNote NVARCHAR(500) NULL,
                            TotalImpressionsCount BIGINT NOT NULL DEFAULT 0,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME2 NULL,
                            CreatedBy NVARCHAR(100) NULL,
                            UpdatedBy NVARCHAR(100) NULL,
                            IsDeleted BIT NOT NULL DEFAULT 0
                        );
                    END

                    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AdCampaignLabs')
                    BEGIN
                        CREATE TABLE AdCampaignLabs (
                            Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                            AdCampaignId UNIQUEIDENTIFIER NOT NULL,
                            TenantId UNIQUEIDENTIFIER NOT NULL,
                            AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME2 NULL,
                            CreatedBy NVARCHAR(100) NULL,
                            UpdatedBy NVARCHAR(100) NULL,
                            IsDeleted BIT NOT NULL DEFAULT 0
                        );
                    END

                    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SystemSettings')
                    BEGIN
                        CREATE TABLE SystemSettings (
                            Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                            SettingKey NVARCHAR(100) NOT NULL UNIQUE,
                            SettingValue NVARCHAR(MAX) NOT NULL,
                            Description NVARCHAR(500) NULL,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME2 NULL,
                            CreatedBy NVARCHAR(100) NULL,
                            UpdatedBy NVARCHAR(100) NULL,
                            IsDeleted BIT NOT NULL DEFAULT 0
                        );
                    END
                ");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbInitializer] Migration patch warning: {ex.Message}");
        }

        // 1. Seed Roles
        string[] roles = { "SuperAdmin", "LabAdmin", "LabManager", "Pathologist", "Technician", "Receptionist" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Seed Master Laboratory Tenant & Super Admin
        var superAdminEmail = "admin@digitlab.com";
        var masterTenant = await context.Tenants.FirstOrDefaultAsync(t => t.Id == CurrentUserService.MasterTenantId || t.LabCode == "MASTER" || t.Email == superAdminEmail);
        if (masterTenant == null)
        {
            masterTenant = new TenantLab
            {
                Id = CurrentUserService.MasterTenantId,
                LabCode = "MASTER",
                LabName = "DigitLab Central Diagnostic Lab",
                Tagline = "Central Pathology & Diagnostic Services",
                OwnerName = "Super Administrator",
                Email = superAdminEmail,
                Phone = "7706087066",
                Address = "Central Laboratory HQ",
                City = "Delhi",
                State = "Delhi",
                SubscriptionStatus = "Active",
                SubscriptionExpiryDate = DateTime.UtcNow.AddYears(50),
                IsActive = true
            };
            await context.Tenants.AddAsync(masterTenant);
            await context.SaveChangesAsync();
        }
        else
        {
            masterTenant.IsActive = true;
            masterTenant.SubscriptionStatus = "Active";
            if (!masterTenant.SubscriptionExpiryDate.HasValue || masterTenant.SubscriptionExpiryDate.Value < DateTime.UtcNow)
            {
                masterTenant.SubscriptionExpiryDate = DateTime.UtcNow.AddYears(50);
            }
            await context.SaveChangesAsync();
        }

        var superAdmin = await userManager.FindByEmailAsync(superAdminEmail);
        if (superAdmin == null)
        {
            superAdmin = new ApplicationUser
            {
                UserName = superAdminEmail,
                Email = superAdminEmail,
                FullName = "Super Administrator",
                Role = "SuperAdmin",
                Designation = "Platform Owner",
                TenantId = masterTenant.Id,
                EmailConfirmed = true,
                IsActive = true
            };
            await userManager.CreateAsync(superAdmin, "Admin@12345");
            await userManager.AddToRoleAsync(superAdmin, "SuperAdmin");
        }
        else
        {
            if (!superAdmin.TenantId.HasValue || superAdmin.TenantId == Guid.Empty)
            {
                superAdmin.TenantId = masterTenant.Id;
                await userManager.UpdateAsync(superAdmin);
            }
        }

        // 3. Seed & Sync Subscription Plans (Step 3: Starter 499, Pro 999, Advanced 1999 + 20% annual discount)
        var definedPlans = new List<SubscriptionPlan>
        {
            new()
            {
                PlanCode = "TRIAL",
                PlanName = "Free Trial (14 Days)",
                Description = "Zero-risk 14-day evaluation for testing all LIMS features.",
                MonthlyPrice = 0,
                AnnualPrice = 0,
                MaxCasesPerMonth = 100,
                MaxStaffAccounts = 2,
                HasCustomLetterhead = true,
                HasPublicQrDownload = true,
                HasDoctorReferralModule = true,
                HasThermalPrinting = true,
                HasWhatsAppAlerts = true,
                DisplayOrder = 1
            },
            new()
            {
                PlanCode = "STARTER",
                PlanName = "Starter Lab",
                Description = "Chhoti clinic lab & single-technician collection points.",
                MonthlyPrice = 399,
                AnnualPrice = 4790, // 20% annual discount
                MaxCasesPerMonth = 100,
                MaxStaffAccounts = 1,
                HasCustomLetterhead = false,
                HasPublicQrDownload = true,
                HasDoctorReferralModule = false,
                HasThermalPrinting = true,
                HasWhatsAppAlerts = false,
                DisplayOrder = 2
            },
            new()
            {
                PlanCode = "PRO",
                PlanName = "Pro Lab",
                Description = "Medium diagnostic labs with high daily footfall.",
                MonthlyPrice = 799,
                AnnualPrice = 9590, // 20% annual discount
                MaxCasesPerMonth = 0, // Unlimited patient cases
                MaxStaffAccounts = 5,
                HasCustomLetterhead = true,
                HasPublicQrDownload = true,
                HasDoctorReferralModule = true,
                HasThermalPrinting = true,
                HasWhatsAppAlerts = true,
                DisplayOrder = 3
            },
            new()
            {
                PlanCode = "ADVANCED",
                PlanName = "Advanced / Multi-Branch",
                Description = "For large labs & hospitals: multi-counter, B2B collection agents, barcode tracking & priority support.",
                MonthlyPrice = 1999,
                AnnualPrice = 18990, // 20% annual discount
                MaxCasesPerMonth = 50000,
                MaxStaffAccounts = 25,
                HasCustomLetterhead = true,
                HasPublicQrDownload = true,
                HasDoctorReferralModule = true,
                HasThermalPrinting = true,
                HasWhatsAppAlerts = true,
                DisplayOrder = 4
            }
        };

        foreach (var defPlan in definedPlans)
        {
            var existingPlan = await context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanCode == defPlan.PlanCode);
            if (existingPlan == null)
            {
                // Check if legacy code exists (STANDARD -> PRO, PREMIUM -> ADVANCED)
                if (defPlan.PlanCode == "PRO")
                    existingPlan = await context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanCode == "STANDARD");
                else if (defPlan.PlanCode == "ADVANCED")
                    existingPlan = await context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanCode == "PREMIUM");
            }

            if (existingPlan == null)
            {
                await context.SubscriptionPlans.AddAsync(defPlan);
            }
            else
            {
                existingPlan.PlanCode = defPlan.PlanCode;
                existingPlan.PlanName = defPlan.PlanName;
                existingPlan.Description = defPlan.Description;
                existingPlan.MonthlyPrice = defPlan.MonthlyPrice;
                existingPlan.AnnualPrice = defPlan.AnnualPrice;
                existingPlan.MaxCasesPerMonth = defPlan.MaxCasesPerMonth;
                existingPlan.MaxStaffAccounts = defPlan.MaxStaffAccounts;
                existingPlan.HasCustomLetterhead = defPlan.HasCustomLetterhead;
                existingPlan.HasPublicQrDownload = defPlan.HasPublicQrDownload;
                existingPlan.HasDoctorReferralModule = defPlan.HasDoctorReferralModule;
                existingPlan.HasThermalPrinting = defPlan.HasThermalPrinting;
                existingPlan.HasWhatsAppAlerts = defPlan.HasWhatsAppAlerts;
                existingPlan.DisplayOrder = defPlan.DisplayOrder;
            }
        }
        await context.SaveChangesAsync();

        // 3.1 Seed System Settings (UPI, WhatsApp, Admin details)
        try
        {
            if (context.Database.IsSqlServer())
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemSettings')
                    BEGIN
                        CREATE TABLE SystemSettings (
                            Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                            SettingKey NVARCHAR(100) NOT NULL UNIQUE,
                            SettingValue NVARCHAR(MAX) NOT NULL,
                            Description NVARCHAR(500) NULL,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME2 NULL,
                            CreatedBy NVARCHAR(100) NULL,
                            UpdatedBy NVARCHAR(100) NULL,
                            IsDeleted BIT NOT NULL DEFAULT 0
                        );
                    END
                ");
            }
            else if (context.Database.IsSqlite())
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS SystemSettings (
                        Id TEXT PRIMARY KEY,
                        SettingKey TEXT NOT NULL UNIQUE,
                        SettingValue TEXT NOT NULL,
                        Description TEXT NULL,
                        CreatedAt TEXT NOT NULL,
                        UpdatedAt TEXT NULL,
                        CreatedBy TEXT NULL,
                        UpdatedBy TEXT NULL,
                        IsDeleted INTEGER NOT NULL DEFAULT 0
                    );
                ");
            }

            var defaultSettings = new Dictionary<string, (string Value, string Description)>
            {
                { "AdminUpiId", ("yadavmanishkk-2@okhdfcbank", "UPI VPA ID for Direct SaaS Subscription Payments") },
                { "AdminPayeeName", ("Manish Yadav", "Payee / Account Holder Name displayed on UPI checkout") },
                { "AdminWhatsApp", ("7706087066", "WhatsApp Number for Payment Screenshots & Proofs") },
                { "AdminBankName", ("", "Bank Name for Direct NEFT / RTGS Transfer") },
                { "AdminAccountNo", ("", "Bank Account Number for Wire Transfer") },
                { "AdminIfscCode", ("", "Bank IFSC Code") }
            };

            foreach (var kvp in defaultSettings)
            {
                var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == kvp.Key);
                if (setting == null)
                {
                    await context.SystemSettings.AddAsync(new SystemSetting
                    {
                        SettingKey = kvp.Key,
                        SettingValue = kvp.Value.Value,
                        Description = kvp.Value.Description
                    });
                }
                else if (kvp.Key == "AdminUpiId" && setting.SettingValue != kvp.Value.Value)
                {
                    setting.SettingValue = kvp.Value.Value;
                }
            }
            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbInitializer] SystemSettings warning: {ex.Message}");
        }

        // 4. Data Cleanup & Migration: Remove/reassign Guid.Empty tests and deduplicate tests per tenant
        try
        {
            var masterId = masterTenant.Id;

            // Step A: Reassign or remove any Guid.Empty tests
            var emptyTests = await context.Tests.IgnoreQueryFilters().Where(t => t.TenantId == Guid.Empty).ToListAsync();
            if (emptyTests.Any())
            {
                foreach (var t in emptyTests)
                {
                    var masterAlreadyHas = await context.Tests.IgnoreQueryFilters().AnyAsync(x => x.TenantId == masterId && x.TestCode == t.TestCode);
                    var isUsed = await context.CaseOrderItems.IgnoreQueryFilters().AnyAsync(x => x.TestId == t.Id);
                    if (masterAlreadyHas && !isUsed)
                    {
                        var pList = await context.TestParameters.IgnoreQueryFilters().Where(p => p.TestId == t.Id).ToListAsync();
                        var pIds = pList.Select(p => p.Id).ToList();
                        var rList = await context.ParameterNormalRanges.IgnoreQueryFilters().Where(r => pIds.Contains(r.ParameterId)).ToListAsync();
                        context.ParameterNormalRanges.RemoveRange(rList);
                        context.TestParameters.RemoveRange(pList);
                        context.Tests.Remove(t);
                    }
                    else
                    {
                        t.TenantId = masterId;
                    }
                }
                await context.SaveChangesAsync();
            }

            // Step B: Reassign or remove empty categories
            var emptyCats = await context.TestCategories.IgnoreQueryFilters().Where(c => c.TenantId == Guid.Empty).ToListAsync();
            if (emptyCats.Any())
            {
                foreach (var c in emptyCats)
                {
                    var masterAlreadyHas = await context.TestCategories.IgnoreQueryFilters().AnyAsync(x => x.TenantId == masterId && x.CategoryCode == c.CategoryCode);
                    var isUsed = await context.Tests.IgnoreQueryFilters().AnyAsync(x => x.CategoryId == c.Id);
                    if (masterAlreadyHas && !isUsed)
                    {
                        context.TestCategories.Remove(c);
                    }
                    else
                    {
                        c.TenantId = masterId;
                    }
                }
                await context.SaveChangesAsync();
            }

            // Step C: Reassign any remaining empty parameters and ranges to masterId
            var emptyParams = await context.TestParameters.IgnoreQueryFilters().Where(p => p.TenantId == Guid.Empty).ToListAsync();
            foreach (var p in emptyParams) p.TenantId = masterId;
            var emptyRanges = await context.ParameterNormalRanges.IgnoreQueryFilters().Where(r => r.TenantId == Guid.Empty).ToListAsync();
            foreach (var r in emptyRanges) r.TenantId = masterId;
            await context.SaveChangesAsync();

            // Step D: Reassign any patients, doctors, cases that had Guid.Empty to masterId
            var emptyPatients = await context.Patients.IgnoreQueryFilters().Where(p => p.TenantId == Guid.Empty).ToListAsync();
            foreach (var p in emptyPatients) p.TenantId = masterId;
            var emptyCases = await context.CaseOrders.IgnoreQueryFilters().Where(c => c.TenantId == Guid.Empty).ToListAsync();
            foreach (var c in emptyCases) c.TenantId = masterId;
            var emptyOrderItems = await context.CaseOrderItems.IgnoreQueryFilters().Where(i => i.TenantId == Guid.Empty).ToListAsync();
            foreach (var i in emptyOrderItems) i.TenantId = masterId;
            var emptyDoctors = await context.Doctors.IgnoreQueryFilters().Where(d => d.TenantId == Guid.Empty).ToListAsync();
            foreach (var d in emptyDoctors) d.TenantId = masterId;
            var emptyAgents = await context.CollectionAgents.IgnoreQueryFilters().Where(a => a.TenantId == Guid.Empty).ToListAsync();
            foreach (var a in emptyAgents) a.TenantId = masterId;
            await context.SaveChangesAsync();

            // Step E: Deduplicate tests within each tenant so every tenant has exactly 1 of each test
            var allTenantsList = await context.Tenants.Select(t => t.Id).ToListAsync();
            foreach (var tid in allTenantsList)
            {
                var tenantTests = await context.Tests.IgnoreQueryFilters().Where(t => t.TenantId == tid).ToListAsync();
                var grouped = tenantTests.GroupBy(t => t.TestCode).Where(g => g.Count() > 1);
                foreach (var g in grouped)
                {
                    var toDrop = g.Skip(1).ToList();
                    foreach (var dup in toDrop)
                    {
                        var isUsed = await context.CaseOrderItems.IgnoreQueryFilters().AnyAsync(x => x.TestId == dup.Id);
                        if (!isUsed)
                        {
                            var pList = await context.TestParameters.IgnoreQueryFilters().Where(p => p.TestId == dup.Id).ToListAsync();
                            var pIds = pList.Select(p => p.Id).ToList();
                            var rList = await context.ParameterNormalRanges.IgnoreQueryFilters().Where(r => pIds.Contains(r.ParameterId)).ToListAsync();
                            context.ParameterNormalRanges.RemoveRange(rList);
                            context.TestParameters.RemoveRange(pList);
                            context.Tests.Remove(dup);
                        }
                    }
                    await context.SaveChangesAsync();
                }

                var tenantCats = await context.TestCategories.IgnoreQueryFilters().Where(c => c.TenantId == tid).ToListAsync();
                var groupedCats = tenantCats.GroupBy(c => c.CategoryCode).Where(g => g.Count() > 1);
                foreach (var gc in groupedCats)
                {
                    var toDrop = gc.Skip(1).ToList();
                    foreach (var dupCat in toDrop)
                    {
                        var isUsed = await context.Tests.IgnoreQueryFilters().AnyAsync(x => x.CategoryId == dupCat.Id);
                        if (!isUsed)
                        {
                            context.TestCategories.Remove(dupCat);
                        }
                    }
                    await context.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbInitializer] Deduplication notice: {ex.Message}");
        }

        // 5. Ensure standard master catalog is seeded for each existing tenant (NOT Guid.Empty!)
        var allTenants = await context.Tenants.ToListAsync();
        foreach (var t in allTenants)
        {
            await SeedStandardCatalogForTenantAsync(context, t.Id);
        }
    }

    public static async Task SeedStandardCatalogForTenantAsync(ApplicationDbContext context, Guid tenantId)
    {
        // 1. Categories
        var catHema = await context.TestCategories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.TenantId == tenantId && c.CategoryCode == "HEMA");
        if (catHema == null)
        {
            catHema = new TestCategory { TenantId = tenantId, CategoryCode = "HEMA", CategoryName = "Hematology", DisplayOrder = 1 };
            await context.TestCategories.AddAsync(catHema);
        }

        var catBio = await context.TestCategories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.TenantId == tenantId && c.CategoryCode == "BIO");
        if (catBio == null)
        {
            catBio = new TestCategory { TenantId = tenantId, CategoryCode = "BIO", CategoryName = "Biochemistry", DisplayOrder = 2 };
            await context.TestCategories.AddAsync(catBio);
        }

        var catSer = await context.TestCategories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.TenantId == tenantId && c.CategoryCode == "SERO");
        if (catSer == null)
        {
            catSer = new TestCategory { TenantId = tenantId, CategoryCode = "SERO", CategoryName = "Serology & Immunology", DisplayOrder = 3 };
            await context.TestCategories.AddAsync(catSer);
        }

        var catClin = await context.TestCategories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.TenantId == tenantId && c.CategoryCode == "CLIN");
        if (catClin == null)
        {
            catClin = new TestCategory { TenantId = tenantId, CategoryCode = "CLIN", CategoryName = "Clinical Pathology & Urine", DisplayOrder = 4 };
            await context.TestCategories.AddAsync(catClin);
        }

        await context.SaveChangesAsync();

        // 2. CBC Test
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "CBC"))
        {
            var cbcTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catHema.Id,
                TestCode = "CBC",
                TestName = "Complete Blood Count (CBC with Automated 5-Part Diff)",
                ShortName = "CBC",
                ItemType = TestItemType.SingleTest,
                SampleType = "Whole Blood EDTA",
                ContainerVialType = "Lavender / EDTA Tube",
                Price = 350,
                CostPrice = 70,
                TatHours = 2,
                Methodology = "Automated Flow Cytometry & Impedance",
                ClinicalSignificance = "Primary screening for anemia, infections, leukemia, and platelet disorders."
            };
            await context.Tests.AddAsync(cbcTest);
            await context.SaveChangesAsync();

            var cbcParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "HB", ParameterName = "Hemoglobin (Hb)", Unit = "g/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Male, MinNormalValue = 13.0m, MaxNormalValue = 17.0m, PanicLowValue = 6.0m, PanicHighValue = 20.0m, TextualRange = "13.0 - 17.0 g/dL", AgeDisplayGroup = "Adult Male" },
                                     new() { TenantId = tenantId, ApplicableGender = Gender.Female, MinNormalValue = 12.0m, MaxNormalValue = 15.5m, PanicLowValue = 6.0m, PanicHighValue = 20.0m, TextualRange = "12.0 - 15.5 g/dL", AgeDisplayGroup = "Adult Female" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "TLC", ParameterName = "Total Leukocyte Count (TLC / WBC)", Unit = "/cumm", InputType = ParameterInputType.Numeric, DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 4000, MaxNormalValue = 11000, PanicLowValue = 1500, PanicHighValue = 35000, TextualRange = "4,000 - 11,000 /cumm", AgeDisplayGroup = "Adult" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "PLT", ParameterName = "Platelet Count", Unit = "lakhs/cumm", InputType = ParameterInputType.Numeric, DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 1.5m, MaxNormalValue = 4.5m, PanicLowValue = 0.2m, PanicHighValue = 10.0m, TextualRange = "1.50 - 4.50 lakhs/cumm", AgeDisplayGroup = "Adult" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "NEUT", ParameterName = "Neutrophils", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 4,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 40, MaxNormalValue = 75, TextualRange = "40 - 75 %" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "LYMPH", ParameterName = "Lymphocytes", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 5,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 20, MaxNormalValue = 45, TextualRange = "20 - 45 %" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "MONO", ParameterName = "Monocytes", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 6,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 2, MaxNormalValue = 10, TextualRange = "2 - 10 %" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "EOS", ParameterName = "Eosinophils", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 7,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 1, MaxNormalValue = 6, TextualRange = "1 - 6 %" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "PCV", ParameterName = "Packed Cell Volume (PCV / Hematocrit)", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 8,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 36, MaxNormalValue = 50, TextualRange = "36 - 50 %" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "BASO", ParameterName = "Basophils", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 9,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0, MaxNormalValue = 2, TextualRange = "0 - 2 %" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "RBC", ParameterName = "Total RBC Count", Unit = "mil/cumm", InputType = ParameterInputType.Numeric, DisplayOrder = 10,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Male, MinNormalValue = 4.5m, MaxNormalValue = 5.9m, TextualRange = "4.5 - 5.9 mil/cumm", AgeDisplayGroup = "Adult Male" },
                                     new() { TenantId = tenantId, ApplicableGender = Gender.Female, MinNormalValue = 4.0m, MaxNormalValue = 5.2m, TextualRange = "4.0 - 5.2 mil/cumm", AgeDisplayGroup = "Adult Female" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "MCV", ParameterName = "Mean Corpuscular Volume (MCV)", Unit = "fL", InputType = ParameterInputType.Numeric, DisplayOrder = 11,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 80, MaxNormalValue = 100, TextualRange = "80 - 100 fL" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "MCH", ParameterName = "Mean Corpuscular Hemoglobin (MCH)", Unit = "pg", InputType = ParameterInputType.Numeric, DisplayOrder = 12,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 27, MaxNormalValue = 32, TextualRange = "27 - 32 pg" } } },
                new() { TenantId = tenantId, TestId = cbcTest.Id, ParameterCode = "MCHC", ParameterName = "Mean Corpuscular Hb Conc (MCHC)", Unit = "g/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 13,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 32, MaxNormalValue = 36, TextualRange = "32 - 36 g/dL" } } }
            };
            await context.TestParameters.AddRangeAsync(cbcParams);
            await context.SaveChangesAsync();
        }

        // 3. Lipid Profile Test
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "LIPID"))
        {
            var lipidTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catBio.Id,
                TestCode = "LIPID",
                TestName = "Lipid Profile (Complete Cholesterol & Triglycerides)",
                ShortName = "Lipid",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Fasting",
                ContainerVialType = "Yellow / Gel SST",
                Price = 600,
                CostPrice = 120,
                TatHours = 4,
                Methodology = "Enzymatic Colorimetric (CHOD-PAP / GPO-PAP)",
                PreTestInstructions = "10 - 12 hours overnight fasting mandatory."
            };
            await context.Tests.AddAsync(lipidTest);
            await context.SaveChangesAsync();

            var lipidParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = lipidTest.Id, ParameterCode = "CHOL", ParameterName = "Total Cholesterol", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 120, MaxNormalValue = 200, PanicHighValue = 350, TextualRange = "< 200 mg/dL Desirable" } } },
                new() { TenantId = tenantId, TestId = lipidTest.Id, ParameterCode = "TRIG", ParameterName = "Triglycerides", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 50, MaxNormalValue = 150, PanicHighValue = 500, TextualRange = "< 150 mg/dL Normal" } } },
                new() { TenantId = tenantId, TestId = lipidTest.Id, ParameterCode = "HDL", ParameterName = "HDL Cholesterol (Good)", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 40, MaxNormalValue = 60, TextualRange = "> 40 mg/dL Optimal" } } },
                new() { TenantId = tenantId, TestId = lipidTest.Id, ParameterCode = "LDL", ParameterName = "LDL Cholesterol (Bad)", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 4,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 60, MaxNormalValue = 100, TextualRange = "< 100 mg/dL Optimal" } } }
            };
            await context.TestParameters.AddRangeAsync(lipidParams);
            await context.SaveChangesAsync();
        }

        // 4. Liver Function Test (LFT)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "LFT"))
        {
            var lftTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catBio.Id,
                TestCode = "LFT",
                TestName = "Liver Function Test (LFT with Enzymes & Proteins)",
                ShortName = "LFT",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Clotted",
                ContainerVialType = "Yellow / Gel SST",
                Price = 650,
                CostPrice = 130,
                TatHours = 4,
                Methodology = "Automated Spectrophotometry / Kinetic IFCC"
            };
            await context.Tests.AddAsync(lftTest);
            await context.SaveChangesAsync();

            var lftParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "TBIL", ParameterName = "Bilirubin (Total)", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0.2m, MaxNormalValue = 1.2m, TextualRange = "0.2 - 1.2 mg/dL" } } },
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "DBIL", ParameterName = "Bilirubin (Direct)", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0.0m, MaxNormalValue = 0.3m, TextualRange = "0.0 - 0.3 mg/dL" } } },
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "SGOT", ParameterName = "SGOT / AST", Unit = "U/L", InputType = ParameterInputType.Numeric, DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 10, MaxNormalValue = 40, TextualRange = "10 - 40 U/L" } } },
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "SGPT", ParameterName = "SGPT / ALT", Unit = "U/L", InputType = ParameterInputType.Numeric, DisplayOrder = 4,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 10, MaxNormalValue = 45, TextualRange = "10 - 45 U/L" } } },
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "ALP", ParameterName = "Alkaline Phosphatase (ALP)", Unit = "U/L", InputType = ParameterInputType.Numeric, DisplayOrder = 5,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 30, MaxNormalValue = 120, TextualRange = "30 - 120 U/L" } } },
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "TP", ParameterName = "Total Protein", Unit = "g/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 6,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 6.0m, MaxNormalValue = 8.3m, TextualRange = "6.0 - 8.3 g/dL" } } },
                new() { TenantId = tenantId, TestId = lftTest.Id, ParameterCode = "ALB", ParameterName = "Serum Albumin", Unit = "g/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 7,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 3.5m, MaxNormalValue = 5.0m, TextualRange = "3.5 - 5.0 g/dL" } } }
            };
            await context.TestParameters.AddRangeAsync(lftParams);
            await context.SaveChangesAsync();
        }

        // 5. Kidney Function Test (KFT)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "KFT"))
        {
            var kftTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catBio.Id,
                TestCode = "KFT",
                TestName = "Kidney Function Test (KFT / RFT with Electrolytes)",
                ShortName = "KFT",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Clotted",
                ContainerVialType = "Yellow / Gel SST",
                Price = 650,
                CostPrice = 130,
                TatHours = 4,
                Methodology = "Automated Enzymatic & ISE"
            };
            await context.Tests.AddAsync(kftTest);
            await context.SaveChangesAsync();

            var kftParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = kftTest.Id, ParameterCode = "UREA", ParameterName = "Blood Urea", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 15, MaxNormalValue = 40, TextualRange = "15 - 40 mg/dL" } } },
                new() { TenantId = tenantId, TestId = kftTest.Id, ParameterCode = "CREAT", ParameterName = "Serum Creatinine", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0.6m, MaxNormalValue = 1.2m, TextualRange = "0.6 - 1.2 mg/dL" } } },
                new() { TenantId = tenantId, TestId = kftTest.Id, ParameterCode = "URIC", ParameterName = "Serum Uric Acid", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 3.5m, MaxNormalValue = 7.2m, TextualRange = "3.5 - 7.2 mg/dL" } } },
                new() { TenantId = tenantId, TestId = kftTest.Id, ParameterCode = "CALC", ParameterName = "Serum Calcium", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 4,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 8.5m, MaxNormalValue = 10.5m, TextualRange = "8.5 - 10.5 mg/dL" } } }
            };
            await context.TestParameters.AddRangeAsync(kftParams);
            await context.SaveChangesAsync();
        }

        // 6. Blood Sugar Tests
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "FBS"))
        {
            var fbsTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catBio.Id,
                TestCode = "FBS",
                TestName = "Blood Glucose Fasting (FBS)",
                ShortName = "Sugar Fasting",
                ItemType = TestItemType.SingleTest,
                SampleType = "Fluoride Plasma",
                ContainerVialType = "Grey / Sodium Fluoride Tube",
                Price = 80,
                CostPrice = 15,
                TatHours = 2,
                Methodology = "GOD-POD Enzymatic Method"
            };
            await context.Tests.AddAsync(fbsTest);
            await context.SaveChangesAsync();

            var fbsParam = new TestParameter
            {
                TenantId = tenantId,
                TestId = fbsTest.Id,
                ParameterCode = "GLUF",
                ParameterName = "Fasting Blood Glucose",
                Unit = "mg/dL",
                InputType = ParameterInputType.Numeric,
                DisplayOrder = 1,
                NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 70, MaxNormalValue = 100, PanicLowValue = 50, PanicHighValue = 350, TextualRange = "70 - 100 mg/dL Normal" } }
            };
            await context.TestParameters.AddAsync(fbsParam);
            await context.SaveChangesAsync();
        }

        // 7. Urine Routine & Microscopy
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "URINE"))
        {
            var urineTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catClin.Id,
                TestCode = "URINE",
                TestName = "Urine Routine & Microscopic Examination",
                ShortName = "Urine R/E",
                ItemType = TestItemType.SingleTest,
                SampleType = "Spot Mid-Stream Urine",
                ContainerVialType = "Sterile Urine Container",
                Price = 150,
                CostPrice = 30,
                TatHours = 2,
                Methodology = "Automated Strip Analyzer & High Power Microscopy"
            };
            await context.Tests.AddAsync(urineTest);
            await context.SaveChangesAsync();

            var urineParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "COL", ParameterName = "Colour", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Pale Yellow", DisplayOrder = 1 },
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "APP", ParameterName = "Appearance", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Clear", DisplayOrder = 2 },
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "PH", ParameterName = "Reaction pH", Unit = "", InputType = ParameterInputType.Numeric, DefaultValue = "6.5", DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 5.0m, MaxNormalValue = 7.5m, TextualRange = "5.0 - 7.5" } } },
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "PROT", ParameterName = "Urine Protein (Albumin)", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Nil", DisplayOrder = 4 },
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "SUG", ParameterName = "Urine Sugar (Glucose)", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Nil", DisplayOrder = 5 },
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "PUS", ParameterName = "Pus Cells (WBCs)", Unit = "/HPF", InputType = ParameterInputType.Text, DefaultValue = "1-2", DisplayOrder = 6,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "1 - 5 /HPF" } } },
                new() { TenantId = tenantId, TestId = urineTest.Id, ParameterCode = "EPI", ParameterName = "Epithelial Cells", Unit = "/HPF", InputType = ParameterInputType.Text, DefaultValue = "2-3", DisplayOrder = 7,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "1 - 5 /HPF" } } }
            };
            await context.TestParameters.AddRangeAsync(urineParams);
            await context.SaveChangesAsync();
        }

        // 8. Thyroid Profile (TFT)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "TFT"))
        {
            var tftTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catSer.Id,
                TestCode = "TFT",
                TestName = "Thyroid Profile (Total T3, Total T4, TSH Ultrasensitive)",
                ShortName = "Thyroid Profile",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Clotted",
                ContainerVialType = "Yellow / Gel SST",
                Price = 500,
                CostPrice = 100,
                TatHours = 6,
                Methodology = "Chemiluminescent Immunoassay (CLIA)"
            };
            await context.Tests.AddAsync(tftTest);
            await context.SaveChangesAsync();

            var tftParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = tftTest.Id, ParameterCode = "T3", ParameterName = "Triiodothyronine (Total T3)", Unit = "ng/mL", InputType = ParameterInputType.Numeric, DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0.8m, MaxNormalValue = 2.0m, TextualRange = "0.8 - 2.0 ng/mL" } } },
                new() { TenantId = tenantId, TestId = tftTest.Id, ParameterCode = "T4", ParameterName = "Thyroxine (Total T4)", Unit = "ug/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 5.1m, MaxNormalValue = 14.1m, TextualRange = "5.1 - 14.1 ug/dL" } } },
                new() { TenantId = tenantId, TestId = tftTest.Id, ParameterCode = "TSH", ParameterName = "Thyroid Stimulating Hormone (TSH)", Unit = "uIU/mL", InputType = ParameterInputType.Numeric, DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0.35m, MaxNormalValue = 4.94m, TextualRange = "0.35 - 4.94 uIU/mL" } } }
            };
            await context.TestParameters.AddRangeAsync(tftParams);
            await context.SaveChangesAsync();
        }

        // 9. Blood Glucose Post Prandial (PPBS)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "PPBS"))
        {
            var ppbsTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catBio.Id,
                TestCode = "PPBS",
                TestName = "Blood Glucose Post Prandial (PPBS / 2 Hrs Post Meal)",
                ShortName = "Sugar PP",
                ItemType = TestItemType.SingleTest,
                SampleType = "Fluoride Plasma",
                ContainerVialType = "Grey / Sodium Fluoride Tube",
                Price = 80,
                CostPrice = 15,
                TatHours = 2,
                Methodology = "GOD-POD Enzymatic Method",
                PreTestInstructions = "Blood sample must be taken exactly 2 hours after completion of meal."
            };
            await context.Tests.AddAsync(ppbsTest);
            await context.SaveChangesAsync();

            var ppbsParam = new TestParameter
            {
                TenantId = tenantId,
                TestId = ppbsTest.Id,
                ParameterCode = "GLUPP",
                ParameterName = "Post Prandial Blood Glucose",
                Unit = "mg/dL",
                InputType = ParameterInputType.Numeric,
                DisplayOrder = 1,
                NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 70, MaxNormalValue = 140, PanicHighValue = 350, TextualRange = "< 140 mg/dL Normal" } }
            };
            await context.TestParameters.AddAsync(ppbsParam);
            await context.SaveChangesAsync();
        }

        // 10. Glycated Hemoglobin (HbA1c)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "HBA1C"))
        {
            var hba1cTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catBio.Id,
                TestCode = "HBA1C",
                TestName = "Glycated Hemoglobin (HbA1c with Estimated Average Glucose)",
                ShortName = "HbA1c",
                ItemType = TestItemType.SingleTest,
                SampleType = "Whole Blood EDTA",
                ContainerVialType = "Lavender / EDTA Tube",
                Price = 450,
                CostPrice = 90,
                TatHours = 4,
                Methodology = "High Performance Liquid Chromatography (HPLC)",
                ClinicalSignificance = "Reflects average blood glucose levels over the past 2 to 3 months for diabetes monitoring."
            };
            await context.Tests.AddAsync(hba1cTest);
            await context.SaveChangesAsync();

            var hba1cParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = hba1cTest.Id, ParameterCode = "HBA1C", ParameterName = "HbA1c (Glycated Hb)", Unit = "%", InputType = ParameterInputType.Numeric, DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 4.0m, MaxNormalValue = 5.6m, TextualRange = "< 5.7% Non-Diabetic, 5.7 - 6.4% Prediabetes, >= 6.5% Diabetes" } } },
                new() { TenantId = tenantId, TestId = hba1cTest.Id, ParameterCode = "EAG", ParameterName = "Estimated Average Glucose (eAG)", Unit = "mg/dL", InputType = ParameterInputType.Numeric, DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 70, MaxNormalValue = 126, TextualRange = "70 - 126 mg/dL" } } }
            };
            await context.TestParameters.AddRangeAsync(hba1cParams);
            await context.SaveChangesAsync();
        }

        // 11. Widal Slide Agglutination (Typhoid Fever)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "WIDAL"))
        {
            var widalTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catSer.Id,
                TestCode = "WIDAL",
                TestName = "Widal Slide Agglutination Test (Enteric / Typhoid Fever)",
                ShortName = "Widal Test",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Clotted",
                ContainerVialType = "Yellow / Gel SST",
                Price = 180,
                CostPrice = 35,
                TatHours = 2,
                Methodology = "Rapid Slide Agglutination Method",
                ClinicalSignificance = "Serological diagnosis of enteric fever caused by Salmonella enterica."
            };
            await context.Tests.AddAsync(widalTest);
            await context.SaveChangesAsync();

            var widalParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = widalTest.Id, ParameterCode = "TYPH_O", ParameterName = "Salmonella Typhi 'O' Antigen", Unit = "Titre", InputType = ParameterInputType.Text, DefaultValue = "Negative (< 1:80)", DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Titre < 1:80 is Non-Significant" } } },
                new() { TenantId = tenantId, TestId = widalTest.Id, ParameterCode = "TYPH_H", ParameterName = "Salmonella Typhi 'H' Antigen", Unit = "Titre", InputType = ParameterInputType.Text, DefaultValue = "Negative (< 1:80)", DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Titre < 1:80 is Non-Significant" } } },
                new() { TenantId = tenantId, TestId = widalTest.Id, ParameterCode = "PARA_AH", ParameterName = "Salmonella Paratyphi 'AH' Antigen", Unit = "Titre", InputType = ParameterInputType.Text, DefaultValue = "Negative (< 1:80)", DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Titre < 1:80 is Non-Significant" } } },
                new() { TenantId = tenantId, TestId = widalTest.Id, ParameterCode = "PARA_BH", ParameterName = "Salmonella Paratyphi 'BH' Antigen", Unit = "Titre", InputType = ParameterInputType.Text, DefaultValue = "Negative (< 1:80)", DisplayOrder = 4,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Titre < 1:80 is Non-Significant" } } }
            };
            await context.TestParameters.AddRangeAsync(widalParams);
            await context.SaveChangesAsync();
        }

        // 12. Dengue Combo (NS1 Antigen + IgG/IgM Antibodies)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "DENGUE"))
        {
            var dengueTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catSer.Id,
                TestCode = "DENGUE",
                TestName = "Dengue Duo / Combo (NS1 Antigen + IgG & IgM Antibodies)",
                ShortName = "Dengue Combo",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Clotted",
                ContainerVialType = "Yellow / Gel SST",
                Price = 750,
                CostPrice = 180,
                TatHours = 2,
                Methodology = "Rapid Immunochromatographic Card Test",
                ClinicalSignificance = "Rapid differential detection of early Dengue NS1 antigen and secondary IgG/IgM immune response."
            };
            await context.Tests.AddAsync(dengueTest);
            await context.SaveChangesAsync();

            var dengueParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = dengueTest.Id, ParameterCode = "DENG_NS1", ParameterName = "Dengue NS1 Antigen", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Negative", DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Negative / Non-Reactive" } } },
                new() { TenantId = tenantId, TestId = dengueTest.Id, ParameterCode = "DENG_IGM", ParameterName = "Dengue IgM Antibody", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Negative", DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Negative / Non-Reactive" } } },
                new() { TenantId = tenantId, TestId = dengueTest.Id, ParameterCode = "DENG_IGG", ParameterName = "Dengue IgG Antibody", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Negative", DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Negative / Non-Reactive" } } }
            };
            await context.TestParameters.AddRangeAsync(dengueParams);
            await context.SaveChangesAsync();
        }

        // 13. Blood Group & Rh Factor (ABO & Rh D)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "BG"))
        {
            var bgTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catHema.Id,
                TestCode = "BG",
                TestName = "ABO Blood Grouping & Rh Factor (D Typing)",
                ShortName = "Blood Group",
                ItemType = TestItemType.SingleTest,
                SampleType = "Whole Blood EDTA",
                ContainerVialType = "Lavender / EDTA Tube",
                Price = 120,
                CostPrice = 20,
                TatHours = 1,
                Methodology = "Slide & Tube Agglutination Method",
                ClinicalSignificance = "Mandatory for blood transfusion, surgery clearance, pre-pregnancy, and donor screening."
            };
            await context.Tests.AddAsync(bgTest);
            await context.SaveChangesAsync();

            var bgParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = bgTest.Id, ParameterCode = "ABO", ParameterName = "ABO Blood Group", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "B", DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "A / B / AB / O" } } },
                new() { TenantId = tenantId, TestId = bgTest.Id, ParameterCode = "RH", ParameterName = "Rh Factor (Rh-D)", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Positive (+ve)", DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Positive (+ve) / Negative (-ve)" } } }
            };
            await context.TestParameters.AddRangeAsync(bgParams);
            await context.SaveChangesAsync();
        }

        // 14. Erythrocyte Sedimentation Rate (ESR)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "ESR"))
        {
            var esrTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catHema.Id,
                TestCode = "ESR",
                TestName = "Erythrocyte Sedimentation Rate (ESR - Westergren Method)",
                ShortName = "ESR",
                ItemType = TestItemType.SingleTest,
                SampleType = "Sodium Citrate / EDTA Blood",
                ContainerVialType = "Black / Citrate or EDTA Tube",
                Price = 100,
                CostPrice = 15,
                TatHours = 2,
                Methodology = "Automated Westergren Method (1st Hour)",
                ClinicalSignificance = "Non-specific inflammatory marker for chronic infections, autoimmune diseases, and tuberculosis."
            };
            await context.Tests.AddAsync(esrTest);
            await context.SaveChangesAsync();

            var esrParam = new TestParameter
            {
                TenantId = tenantId,
                TestId = esrTest.Id,
                ParameterCode = "ESR_VAL",
                ParameterName = "ESR (1st Hour)",
                Unit = "mm/hr",
                InputType = ParameterInputType.Numeric,
                DisplayOrder = 1,
                NormalRanges = {
                    new() { TenantId = tenantId, ApplicableGender = Gender.Male, MinNormalValue = 0, MaxNormalValue = 15, TextualRange = "0 - 15 mm/hr (Adult Male)" },
                    new() { TenantId = tenantId, ApplicableGender = Gender.Female, MinNormalValue = 0, MaxNormalValue = 20, TextualRange = "0 - 20 mm/hr (Adult Female)" }
                }
            };
            await context.TestParameters.AddAsync(esrParam);
            await context.SaveChangesAsync();
        }

        // 15. Malarial Parasite (MP - Antigen & Smear)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "MP"))
        {
            var mpTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catHema.Id,
                TestCode = "MP",
                TestName = "Malarial Parasite Detection (Rapid Antigen & Blood Smear)",
                ShortName = "MP Test",
                ItemType = TestItemType.SingleTest,
                SampleType = "Whole Blood EDTA",
                ContainerVialType = "Lavender / EDTA Tube",
                Price = 200,
                CostPrice = 35,
                TatHours = 1,
                Methodology = "Immunochromatographic Antigen Card & Leishman Thick/Thin Smear",
                ClinicalSignificance = "Detection of Plasmodium vivax and Plasmodium falciparum in acute febrile illness."
            };
            await context.Tests.AddAsync(mpTest);
            await context.SaveChangesAsync();

            var mpParams = new List<TestParameter>
            {
                new() { TenantId = tenantId, TestId = mpTest.Id, ParameterCode = "MP_PV", ParameterName = "Plasmodium vivax (Pv Antigen)", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Negative", DisplayOrder = 1,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Negative / Non-Reactive" } } },
                new() { TenantId = tenantId, TestId = mpTest.Id, ParameterCode = "MP_PF", ParameterName = "Plasmodium falciparum (Pf Antigen)", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "Negative", DisplayOrder = 2,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "Negative / Non-Reactive" } } },
                new() { TenantId = tenantId, TestId = mpTest.Id, ParameterCode = "MP_SMEAR", ParameterName = "Peripheral Blood Smear (Thick/Thin)", Unit = "", InputType = ParameterInputType.Text, DefaultValue = "No Malarial Parasites Seen", DisplayOrder = 3,
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, TextualRange = "No Malarial Parasites Seen" } } }
            };
            await context.TestParameters.AddRangeAsync(mpParams);
            await context.SaveChangesAsync();
        }

        // 16. C-Reactive Protein (CRP - Quantitative)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "CRP"))
        {
            var crpTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catSer.Id,
                TestCode = "CRP",
                TestName = "C-Reactive Protein (CRP - Quantitative)",
                ShortName = "CRP Quantitative",
                ItemType = TestItemType.SingleTest,
                SampleType = "Serum Clotted",
                ContainerVialType = "Yellow / Gel SST",
                Price = 350,
                CostPrice = 70,
                TatHours = 2,
                Methodology = "Immunoturbidimetry Method",
                ClinicalSignificance = "Acute phase reactant in bacterial infections, tissue injury, and systemic inflammation."
            };
            await context.Tests.AddAsync(crpTest);
            await context.SaveChangesAsync();

            var crpParam = new TestParameter
            {
                TenantId = tenantId,
                TestId = crpTest.Id,
                ParameterCode = "CRP_VAL",
                ParameterName = "C-Reactive Protein (CRP)",
                Unit = "mg/L",
                InputType = ParameterInputType.Numeric,
                DisplayOrder = 1,
                NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 0, MaxNormalValue = 6.0m, PanicHighValue = 50.0m, TextualRange = "< 6.0 mg/L Normal" } }
            };
            await context.TestParameters.AddAsync(crpParam);
            await context.SaveChangesAsync();
        }

        // 17. Urine Pregnancy Test (UPT)
        if (!await context.Tests.IgnoreQueryFilters().AnyAsync(t => t.TenantId == tenantId && t.TestCode == "UPT"))
        {
            var uptTest = new TestMaster
            {
                TenantId = tenantId,
                CategoryId = catClin.Id,
                TestCode = "UPT",
                TestName = "Urine Pregnancy Test (hCG Card Test)",
                ShortName = "UPT (Pregnancy)",
                ItemType = TestItemType.SingleTest,
                SampleType = "First Morning Urine",
                ContainerVialType = "Sterile Urine Container",
                Price = 120,
                CostPrice = 20,
                TatHours = 1,
                Methodology = "Rapid Immunochromatographic hCG Detection",
                ClinicalSignificance = "Qualitative detection of human Chorionic Gonadotropin for early pregnancy confirmation."
            };
            await context.Tests.AddAsync(uptTest);
            await context.SaveChangesAsync();

            var uptParam = new TestParameter
            {
                TenantId = tenantId,
                TestId = uptTest.Id,
                ParameterCode = "HCG_QUAL",
                ParameterName = "Urine hCG Status",
                Unit = "",
                InputType = ParameterInputType.Text,
                DefaultValue = "Negative",
                DisplayOrder = 1,
                NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Female, TextualRange = "Negative / Positive" } }
            };
            await context.TestParameters.AddAsync(uptParam);
            await context.SaveChangesAsync();
        }
    }
}

