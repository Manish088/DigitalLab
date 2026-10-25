namespace Lab.Application.DTOs;

public class MachineResultSyncRequest
{
    public string? ApiKey { get; set; }
    public string? LabId { get; set; }
    public string? LabCode { get; set; }
    public string? MachineName { get; set; } // e.g. Mindray BC-5000, Sysmex XN-350, Erba Chem 5X
    public string? Protocol { get; set; } // ASTM-1394, HL7-v2, Raw
    public string Barcode { get; set; } = string.Empty; // Barcode or CaseNumber or SampleId
    public DateTime? TestedAt { get; set; }
    public List<MachineParameterResultDto> TestResults { get; set; } = new();
    public string? RawData { get; set; }
}

public class MachineParameterResultDto
{
    public string ParameterCode { get; set; } = string.Empty; // e.g. "HB", "HGB", "WBC", "PLT"
    public string? ParameterName { get; set; }
    public string? Value { get; set; }
    public string? Unit { get; set; }
    public string? Remarks { get; set; }
}

public class MachineSyncResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? MachineName { get; set; }
    public Guid? CaseId { get; set; }
    public string? CaseNumber { get; set; }
    public string? Barcode { get; set; }
    public string? PatientName { get; set; }
    public int SyncedParametersCount { get; set; }
    public int CriticalPanicCount { get; set; }
    public List<SyncedParameterDetailDto> SyncedParameters { get; set; } = new();
    public List<string> UnmatchedParameters { get; set; } = new();
}

public class SyncedParameterDetailDto
{
    public string ParameterCode { get; set; } = string.Empty;
    public string ParameterName { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Unit { get; set; }
    public string? NormalRange { get; set; }
    public string Flag { get; set; } = "Normal";
    public bool IsAbnormal { get; set; }
    public bool IsCriticalPanic { get; set; }
}

public class LabMachineConfigDto
{
    public Guid TenantId { get; set; }
    public string LabCode { get; set; } = string.Empty;
    public string LabName { get; set; } = string.Empty;
    public string LisApiKey { get; set; } = string.Empty;
    public string SyncApiEndpoint { get; set; } = string.Empty;
    public int DefaultListeningPort { get; set; } = 5100;
}

public class SimulateMachineTestDto
{
    public string BarcodeOrCaseNumber { get; set; } = string.Empty;
    public string MachinePreset { get; set; } = "Mindray_CBC"; // "Mindray_CBC", "Severe_Anemia", "High_Infection", "Thrombocytopenia"
}
