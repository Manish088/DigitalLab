using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Lab.Infrastructure.Identity;
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

        // 1. Seed Roles
        string[] roles = { "SuperAdmin", "LabAdmin", "LabManager", "Pathologist", "Technician", "Receptionist" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Seed Super Admin
        var superAdminEmail = "admin@digitlab.com";
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
                EmailConfirmed = true,
                IsActive = true
            };
            await userManager.CreateAsync(superAdmin, "Admin@12345");
            await userManager.AddToRoleAsync(superAdmin, "SuperAdmin");
        }

        // 3. Seed Subscription Plans
        if (!await context.SubscriptionPlans.AnyAsync())
        {
            var plans = new List<SubscriptionPlan>
            {
                new()
                {
                    PlanCode = "TRIAL",
                    PlanName = "Free Trial (14 Days)",
                    Description = "Full access trial for testing all LIMS features.",
                    MonthlyPrice = 0,
                    AnnualPrice = 0,
                    MaxCasesPerMonth = 100,
                    MaxStaffAccounts = 2,
                    HasCustomLetterhead = true,
                    HasPublicQrDownload = true,
                    HasDoctorReferralModule = true,
                    HasThermalPrinting = true,
                    DisplayOrder = 1
                },
                new()
                {
                    PlanCode = "STANDARD",
                    PlanName = "Standard Lab Plan",
                    Description = "Ideal for single branch standalone pathology labs.",
                    MonthlyPrice = 999,
                    AnnualPrice = 9990,
                    MaxCasesPerMonth = 1500,
                    MaxStaffAccounts = 5,
                    HasCustomLetterhead = true,
                    HasPublicQrDownload = true,
                    HasDoctorReferralModule = true,
                    HasThermalPrinting = true,
                    DisplayOrder = 2
                },
                new()
                {
                    PlanCode = "PREMIUM",
                    PlanName = "Enterprise / Multi-Branch",
                    Description = "Unlimited cases, multi-centre collection tracking, WhatsApp alerts.",
                    MonthlyPrice = 1999,
                    AnnualPrice = 19990,
                    MaxCasesPerMonth = 10000,
                    MaxStaffAccounts = 25,
                    HasCustomLetterhead = true,
                    HasPublicQrDownload = true,
                    HasDoctorReferralModule = true,
                    HasThermalPrinting = true,
                    HasWhatsAppAlerts = true,
                    DisplayOrder = 3
                }
            };
            await context.SubscriptionPlans.AddRangeAsync(plans);
            await context.SaveChangesAsync();
        }

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

        // 4. Ensure standard master catalog is seeded for ALL existing tenants (if any)
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
                    NormalRanges = { new() { TenantId = tenantId, ApplicableGender = Gender.Both, MinNormalValue = 36, MaxNormalValue = 50, TextualRange = "36 - 50 %" } } }
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
    }
}
