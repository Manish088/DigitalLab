-- =========================================================================================
-- AD CAMPAIGNS & REPORT MONETIZATION ENGINE MIGRATION
-- Adds: AdCampaigns, AdCampaignLabs, and Tenants.IsAdFree
-- =========================================================================================

-- 1. Add IsAdFree column to Tenants table if it does not exist
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = 'IsAdFree' AND Object_ID = Object_ID('Tenants')
)
BEGIN
    ALTER TABLE Tenants ADD IsAdFree BIT NOT NULL DEFAULT 0;
END
GO

-- 2. Create AdCampaigns Table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AdCampaigns')
BEGIN
    CREATE TABLE AdCampaigns (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CampaignTitle NVARCHAR(250) NOT NULL,
        SponsorName NVARCHAR(250) NOT NULL,
        SponsorContact NVARCHAR(100) NULL,
        BannerImageUrl NVARCHAR(MAX) NOT NULL,
        TargetType INT NOT NULL DEFAULT 1, -- 1: CityWise, 2: LabWise, 3: All
        TargetCity NVARCHAR(150) NULL,
        TargetState NVARCHAR(150) NULL,
        StartDate DATETIME2 NOT NULL,
        EndDate DATETIME2 NOT NULL,
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

    CREATE INDEX IX_AdCampaigns_Status_Dates ON AdCampaigns (IsActive, StartDate, EndDate);
    CREATE INDEX IX_AdCampaigns_City ON AdCampaigns (TargetCity);
END
GO

-- 3. Create AdCampaignLabs Table (Join Table for Direct Lab Targeting)
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
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_AdCampaignLabs_AdCampaigns FOREIGN KEY (AdCampaignId) REFERENCES AdCampaigns(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AdCampaignLabs_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_AdCampaignLabs_TenantId ON AdCampaignLabs (TenantId);
    CREATE INDEX IX_AdCampaignLabs_CampaignId ON AdCampaignLabs (AdCampaignId);
END
GO
