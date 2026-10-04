namespace Lab.Domain.Enums;

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3,
    Both = 4
}

public enum CaseStatus
{
    Registered = 1,
    SampleCollected = 2,
    InProgress = 3,
    Completed = 4,
    Approved = 5,
    Delivered = 6,
    Cancelled = 7
}

public enum ItemResultStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Approved = 4
}

public enum PaymentStatus
{
    Unpaid = 1,
    Partial = 2,
    Paid = 3,
    Refunded = 4
}

public enum PaymentMethod
{
    Cash = 1,
    UPI = 2,
    Card = 3,
    NetBanking = 4,
    Cheque = 5,
    Wallet = 6
}

public enum TestItemType
{
    SingleTest = 1,
    Profile = 2,
    Package = 3
}

public enum ParameterInputType
{
    Numeric = 1,
    Text = 2,
    Dropdown = 3,
    Formula = 4,
    Heading = 5
}

public enum PriorityLevel
{
    Routine = 1,
    Urgent = 2,
    STAT = 3
}

public enum CommissionType
{
    Percentage = 1,
    FixedAmount = 2
}

public enum ResultFlag
{
    Normal = 0,
    High = 1,
    Low = 2,
    Critical = 3
}

public enum TicketPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4
}

public enum TicketStatus
{
    Open = 1,
    InProgress = 2,
    Resolved = 3,
    Closed = 4
}
