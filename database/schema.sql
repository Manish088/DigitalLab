-- =========================================================================================
-- LAB - ENTERPRISE MULTI-TENANT PATHOLOGY LIMS DATABASE SCHEMA
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL Database
-- =========================================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LabLimsDb')
BEGIN
    CREATE DATABASE LabLimsDb;
END
GO

USE LabLimsDb;
GO

-- 1. TENANT LABS MASTER TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tenants')
BEGIN
    CREATE TABLE Tenants (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        LabCode NVARCHAR(50) NOT NULL UNIQUE,
        LabName NVARCHAR(250) NOT NULL,
        Tagline NVARCHAR(500) NULL,
        OwnerName NVARCHAR(150) NULL,
        Phone NVARCHAR(50) NULL,
        Email NVARCHAR(150) NULL,
        Address NVARCHAR(500) NULL,
        City NVARCHAR(100) NULL,
        State NVARCHAR(100) NULL,
        Pincode NVARCHAR(20) NULL,
        Gstin NVARCHAR(50) NULL,
        NablNumber NVARCHAR(50) NULL,
        LogoUrl NVARCHAR(MAX) NULL,
        HeaderImageUrl NVARCHAR(MAX) NULL,
        FooterImageUrl NVARCHAR(MAX) NULL,
        DigitalSignatureUrl NVARCHAR(MAX) NULL,
        PathologistName NVARCHAR(150) NULL,
        PathologistDegree NVARCHAR(150) NULL,
        PathologistRegNo NVARCHAR(100) NULL,
        LetterheadMarginTopMm FLOAT NOT NULL DEFAULT 35.0,
        LetterheadMarginBottomMm FLOAT NOT NULL DEFAULT 30.0,
        LetterheadMarginLeftMm FLOAT NOT NULL DEFAULT 15.0,
        LetterheadMarginRightMm FLOAT NOT NULL DEFAULT 15.0,
        ShowHeader BIT NOT NULL DEFAULT 1,
        ShowFooter BIT NOT NULL DEFAULT 1,
        ShowQrCode BIT NOT NULL DEFAULT 1,
        ShowBarcodeOnBill BIT NOT NULL DEFAULT 1,
        ShowDigitalSignature BIT NOT NULL DEFAULT 1,
        ReportFontFamily NVARCHAR(50) NOT NULL DEFAULT 'Helvetica',
        PrimaryColor NVARCHAR(50) NOT NULL DEFAULT '#0284c7',
        IsActive BIT NOT NULL DEFAULT 1,
        SubscriptionPlanId UNIQUEIDENTIFIER NULL,
        SubscriptionExpiryDate DATETIME2 NULL,
        SubscriptionStatus NVARCHAR(50) NOT NULL DEFAULT 'Trial',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0
    );
END
GO

-- 2. PATIENTS MASTER TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
BEGIN
    CREATE TABLE Patients (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Uhid NVARCHAR(50) NOT NULL,
        FullName NVARCHAR(200) NOT NULL,
        Gender INT NOT NULL, -- 1: Male, 2: Female, 3: Other
        AgeYears INT NOT NULL DEFAULT 0,
        AgeMonths INT NOT NULL DEFAULT 0,
        AgeDays INT NOT NULL DEFAULT 0,
        DateOfBirth DATETIME2 NULL,
        Phone NVARCHAR(50) NULL,
        Email NVARCHAR(150) NULL,
        Address NVARCHAR(500) NULL,
        City NVARCHAR(100) NULL,
        BloodGroup NVARCHAR(10) NULL,
        MedicalHistory NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_Patients_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
    );
    CREATE INDEX IX_Patients_Tenant_Uhid ON Patients(TenantId, Uhid);
    CREATE INDEX IX_Patients_Tenant_Phone ON Patients(TenantId, Phone);
END
GO

-- 3. DOCTORS REFERRALS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Doctors')
BEGIN
    CREATE TABLE Doctors (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        DoctorCode NVARCHAR(50) NOT NULL,
        DoctorName NVARCHAR(200) NOT NULL,
        Degree NVARCHAR(100) NULL,
        Specialization NVARCHAR(100) NULL,
        RegistrationNumber NVARCHAR(100) NULL,
        ClinicHospitalName NVARCHAR(200) NULL,
        Phone NVARCHAR(50) NULL,
        Email NVARCHAR(150) NULL,
        Address NVARCHAR(500) NULL,
        CommissionType INT NOT NULL DEFAULT 1, -- 1: %, 2: Flat
        DefaultCommissionValue DECIMAL(18,2) NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_Doctors_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
    );
END
GO

-- 4. TEST CATEGORIES / DEPARTMENTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestCategories')
BEGIN
    CREATE TABLE TestCategories (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        CategoryCode NVARCHAR(50) NOT NULL,
        CategoryName NVARCHAR(150) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_TestCategories_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
    );
END
GO

-- 5. TEST MASTER TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tests')
BEGIN
    CREATE TABLE Tests (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        CategoryId UNIQUEIDENTIFIER NOT NULL,
        TestCode NVARCHAR(50) NOT NULL,
        TestName NVARCHAR(250) NOT NULL,
        ShortName NVARCHAR(100) NULL,
        ItemType INT NOT NULL DEFAULT 1, -- 1: Single, 2: Profile, 3: Package
        SampleType NVARCHAR(100) NULL,
        ContainerVialType NVARCHAR(100) NULL,
        Price DECIMAL(18,2) NOT NULL DEFAULT 0,
        CostPrice DECIMAL(18,2) NULL,
        TatHours INT NOT NULL DEFAULT 4,
        Methodology NVARCHAR(200) NULL,
        ClinicalSignificance NVARCHAR(MAX) NULL,
        PreTestInstructions NVARCHAR(MAX) NULL,
        InterpretationTemplate NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_Tests_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        CONSTRAINT FK_Tests_Categories FOREIGN KEY (CategoryId) REFERENCES TestCategories(Id)
    );
END
GO

-- 6. TEST PARAMETERS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestParameters')
BEGIN
    CREATE TABLE TestParameters (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        TestId UNIQUEIDENTIFIER NOT NULL,
        ParameterCode NVARCHAR(50) NOT NULL,
        ParameterName NVARCHAR(200) NOT NULL,
        Unit NVARCHAR(50) NULL,
        InputType INT NOT NULL DEFAULT 1, -- 1: Numeric, 2: Text, 3: Dropdown, 4: Formula
        DefaultValue NVARCHAR(MAX) NULL,
        OptionsJson NVARCHAR(MAX) NULL,
        FormulaExpression NVARCHAR(500) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsMandatory BIT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_TestParameters_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        CONSTRAINT FK_TestParameters_Tests FOREIGN KEY (TestId) REFERENCES Tests(Id) ON DELETE CASCADE
    );
END
GO

-- 7. PARAMETER NORMAL RANGES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ParameterNormalRanges')
BEGIN
    CREATE TABLE ParameterNormalRanges (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ParameterId UNIQUEIDENTIFIER NOT NULL,
        ApplicableGender INT NOT NULL DEFAULT 4, -- 1: Male, 2: Female, 4: Both
        MinAgeDays INT NOT NULL DEFAULT 0,
        MaxAgeDays INT NOT NULL DEFAULT 36500,
        MinNormalValue DECIMAL(18,2) NULL,
        MaxNormalValue DECIMAL(18,2) NULL,
        PanicLowValue DECIMAL(18,2) NULL,
        PanicHighValue DECIMAL(18,2) NULL,
        TextualRange NVARCHAR(200) NULL,
        AgeDisplayGroup NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_NormalRanges_Parameters FOREIGN KEY (ParameterId) REFERENCES TestParameters(Id) ON DELETE CASCADE
    );
END
GO

-- 8. CASE ORDERS TABLE (REGISTRATION & BILLING)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CaseOrders')
BEGIN
    CREATE TABLE CaseOrders (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        CaseNumber NVARCHAR(50) NOT NULL,
        Barcode NVARCHAR(50) NOT NULL,
        PatientId UNIQUEIDENTIFIER NOT NULL,
        ReferringDoctorId UNIQUEIDENTIFIER NULL,
        CollectionAgentId UNIQUEIDENTIFIER NULL,
        OrderDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        SampleCollectedDate DATETIME2 NULL,
        ReportingDate DATETIME2 NULL,
        Priority INT NOT NULL DEFAULT 1, -- 1: Routine, 2: Urgent, 3: STAT
        Status INT NOT NULL DEFAULT 1, -- 1: Registered, 2: SampleCollected, 3: InProgress, 4: Completed, 5: Approved
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        DiscountPercent DECIMAL(18,2) NOT NULL DEFAULT 0,
        DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        DiscountReason NVARCHAR(250) NULL,
        TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        NetAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        PaidAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        DueAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        PaymentStatus INT NOT NULL DEFAULT 1, -- 1: Unpaid, 2: Partial, 3: Paid
        DoctorCommissionAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        AgentCommissionAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        IsDoctorCommissionPaid BIT NOT NULL DEFAULT 0,
        PublicAccessToken UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        ClinicalNotes NVARCHAR(MAX) NULL,
        ApprovedByUserId NVARCHAR(450) NULL,
        ApprovedByName NVARCHAR(150) NULL,
        ApprovedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_CaseOrders_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        CONSTRAINT FK_CaseOrders_Patients FOREIGN KEY (PatientId) REFERENCES Patients(Id),
        CONSTRAINT FK_CaseOrders_Doctors FOREIGN KEY (ReferringDoctorId) REFERENCES Doctors(Id)
    );
    CREATE INDEX IX_CaseOrders_Tenant_CaseNumber ON CaseOrders(TenantId, CaseNumber);
    CREATE INDEX IX_CaseOrders_Tenant_Barcode ON CaseOrders(TenantId, Barcode);
    CREATE INDEX IX_CaseOrders_PublicAccessToken ON CaseOrders(PublicAccessToken);
END
GO

-- 9. CASE ORDER ITEMS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CaseOrderItems')
BEGIN
    CREATE TABLE CaseOrderItems (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        CaseOrderId UNIQUEIDENTIFIER NOT NULL,
        TestId UNIQUEIDENTIFIER NOT NULL,
        ItemPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
        DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        NetAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        Status INT NOT NULL DEFAULT 1,
        SampleCollectedNotes NVARCHAR(500) NULL,
        PathologistRemarks NVARCHAR(MAX) NULL,
        InterpretationNote NVARCHAR(MAX) NULL,
        VerifiedAt DATETIME2 NULL,
        VerifiedByName NVARCHAR(150) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_CaseOrderItems_CaseOrders FOREIGN KEY (CaseOrderId) REFERENCES CaseOrders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CaseOrderItems_Tests FOREIGN KEY (TestId) REFERENCES Tests(Id)
    );
END
GO

-- 10. TEST RESULT VALUES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestResultValues')
BEGIN
    CREATE TABLE TestResultValues (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        CaseOrderItemId UNIQUEIDENTIFIER NOT NULL,
        ParameterId UNIQUEIDENTIFIER NOT NULL,
        ParameterName NVARCHAR(200) NOT NULL,
        ResultValue NVARCHAR(MAX) NULL,
        Unit NVARCHAR(50) NULL,
        NormalRangeText NVARCHAR(200) NULL,
        NumericValue DECIMAL(18,2) NULL,
        Flag INT NOT NULL DEFAULT 0, -- 0: Normal, 1: High, 2: Low, 3: Critical
        IsAbnormal BIT NOT NULL DEFAULT 0,
        IsCriticalPanic BIT NOT NULL DEFAULT 0,
        Remarks NVARCHAR(500) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_TestResultValues_Items FOREIGN KEY (CaseOrderItemId) REFERENCES CaseOrderItems(Id) ON DELETE CASCADE,
        CONSTRAINT FK_TestResultValues_Parameters FOREIGN KEY (ParameterId) REFERENCES TestParameters(Id)
    );
END
GO

-- 11. PAYMENT TRANSACTIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentTransactions')
BEGIN
    CREATE TABLE PaymentTransactions (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        CaseOrderId UNIQUEIDENTIFIER NOT NULL,
        TransactionNumber NVARCHAR(50) NOT NULL,
        TransactionDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        Amount DECIMAL(18,2) NOT NULL,
        PaymentMethod INT NOT NULL DEFAULT 1, -- 1: Cash, 2: UPI, 3: Card, 4: NetBanking
        ReferenceNumber NVARCHAR(100) NULL,
        ReceivedByName NVARCHAR(150) NULL,
        Remarks NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_PaymentTransactions_CaseOrders FOREIGN KEY (CaseOrderId) REFERENCES CaseOrders(Id) ON DELETE CASCADE
    );
END
GO

-- 12. SYSTEM SETTINGS MASTER TABLE
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

    INSERT INTO SystemSettings (Id, SettingKey, SettingValue, Description)
    VALUES 
        (NEWID(), 'AdminUpiId', 'yadavmanishkk-2@okhdfcbank', 'UPI VPA ID for Direct SaaS Subscription Payments'),
        (NEWID(), 'AdminPayeeName', 'Manish Yadav', 'Payee / Account Holder Name displayed on UPI checkout'),
        (NEWID(), 'AdminWhatsApp', '7706087066', 'WhatsApp Number for Payment Screenshots & Proofs');
END
GO
