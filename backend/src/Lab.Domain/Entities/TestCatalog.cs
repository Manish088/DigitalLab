using Lab.Domain.Common;
using Lab.Domain.Enums;

namespace Lab.Domain.Entities;

public class TestCategory : TenantEntity
{
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public ICollection<TestMaster> Tests { get; set; } = new List<TestMaster>();
}

public class TestMaster : TenantEntity
{
    public Guid CategoryId { get; set; }
    public TestCategory Category { get; set; } = null!;

    public string TestCode { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public TestItemType ItemType { get; set; } = TestItemType.SingleTest;
    public string? SampleType { get; set; } // Blood, Serum, Plasma, Urine, etc.
    public string? ContainerVialType { get; set; } // EDTA, Fluoride, Plain, Citrate, Sterile Cup
    public decimal Price { get; set; }
    public decimal? CostPrice { get; set; }
    public int TatHours { get; set; } = 4; // Turnaround time in hours
    public string? Methodology { get; set; } // CLIA, ELISA, Photometry, Microscopy, etc.
    public string? ClinicalSignificance { get; set; }
    public string? PreTestInstructions { get; set; } // e.g. 10-12 hours fasting required
    public string? InterpretationTemplate { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<TestParameter> Parameters { get; set; } = new List<TestParameter>();
    public ICollection<PackageProfileItem> ChildPackageItems { get; set; } = new List<PackageProfileItem>();
}

public class TestParameter : TenantEntity
{
    public Guid TestId { get; set; }
    public TestMaster Test { get; set; } = null!;

    public string ParameterCode { get; set; } = string.Empty;
    public string ParameterName { get; set; } = string.Empty;
    public string? Unit { get; set; } // mg/dL, g/dL, %, cells/cumm, IU/L
    public ParameterInputType InputType { get; set; } = ParameterInputType.Numeric;
    public string? DefaultValue { get; set; }
    public string? OptionsJson { get; set; } // For dropdown options
    public string? FormulaExpression { get; set; } // e.g. [ParameterCode1] / [ParameterCode2]
    public int DisplayOrder { get; set; } = 0;
    public bool IsMandatory { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public ICollection<ParameterNormalRange> NormalRanges { get; set; } = new List<ParameterNormalRange>();
}

public class ParameterNormalRange : TenantEntity
{
    public Guid ParameterId { get; set; }
    public TestParameter Parameter { get; set; } = null!;

    public Gender ApplicableGender { get; set; } = Gender.Both;
    public int MinAgeDays { get; set; } = 0;
    public int MaxAgeDays { get; set; } = 36500; // ~100 years
    public decimal? MinNormalValue { get; set; }
    public decimal? MaxNormalValue { get; set; }
    public decimal? PanicLowValue { get; set; }
    public decimal? PanicHighValue { get; set; }
    public string? TextualRange { get; set; } // e.g. "Negative", "Non-Reactive", "0.0 - 5.0"
    public string? AgeDisplayGroup { get; set; } // "Adult", "Pediatric", "Neonate"
}

public class PackageProfileItem : TenantEntity
{
    public Guid ParentPackageId { get; set; }
    public TestMaster ParentPackage { get; set; } = null!;

    public Guid ChildTestId { get; set; }
    public TestMaster ChildTest { get; set; } = null!;

    public int DisplayOrder { get; set; } = 0;
}
