using System.Net;
using System.Net.Mail;
using Lab.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Lab.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public bool IsConfigured
    {
        get
        {
            var senderEmail = _config["EmailSettings:SenderEmail"] 
                ?? Environment.GetEnvironmentVariable("SMTP_SENDER_EMAIL");
            var senderPassword = _config["EmailSettings:SenderPassword"] 
                ?? Environment.GetEnvironmentVariable("SMTP_SENDER_PASSWORD");
            return !string.IsNullOrWhiteSpace(senderEmail) && !string.IsNullOrWhiteSpace(senderPassword);
        }
    }

    public async Task<(bool Success, string Message)> SendPasswordResetOtpAsync(string toEmail, string recipientName, string otp)
    {
        var subject = $"DigitalLab - Your Password Reset OTP: {otp}";
        var greetingName = string.IsNullOrWhiteSpace(recipientName) ? "User" : recipientName;
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>DigitalLab Password Reset</title>
</head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <!-- Header -->
    <tr>
      <td style=""background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;"">DigitalLab LIMS</h1>
        <p style=""color: #bae6fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;"">Cloud Pathology & Diagnostic Laboratory Management</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style=""padding: 32px 28px;"">
        <h2 style=""margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;"">Password Reset Request</h2>
        <p style=""margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          Hello <strong>{WebUtility.HtmlEncode(greetingName)}</strong>,
        </p>
        <p style=""margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          We received a request to reset the password for your DigitalLab account. Please use the following One-Time Password (OTP) to complete your verification:
        </p>

        <!-- OTP Card -->
        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 0 0 24px 0;"">
          <tr>
            <td align=""center"" style=""background: #f8fafc; border: 2px dashed #0284c7; border-radius: 16px; padding: 20px 10px;"">
              <span style=""font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0369a1; display: inline-block;"">
                {otp}
              </span>
            </td>
          </tr>
        </table>

        <!-- Security Warning -->
        <div style=""background: #eff6ff; border-radius: 12px; padding: 12px 16px; margin: 0 0 20px 0; font-size: 12px; color: #1e40af; line-height: 1.5;"">
          ⏱️ This code is valid for <strong>10 minutes</strong>. Never share this OTP with anyone, including support staff.
        </div>

        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0 0 16px 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>No-Reply Notification:</strong> This is an automated message from DigitalLab LIMS. Please do not reply directly to this email.
        </div>
        <p style=""margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px;"">
          If you did not request this password reset, no action is needed. Your account remains safe and your password has not been changed.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style=""background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} DigitalLab LIMS • ISO Compliant Medical Diagnostic Cloud
      </td>
    </tr>
  </table>
</body>
</html>";

        return await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task<(bool Success, string Message)> SendRegistrationVerificationOtpAsync(string toEmail, string recipientName, string otp)
    {
        var subject = $"DigitalLab - Verify Your Email: {otp}";
        var greetingName = string.IsNullOrWhiteSpace(recipientName) ? "Doctor / Lab Owner" : recipientName;
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>DigitalLab Email Verification</title>
</head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <tr>
      <td style=""background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 28px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;"">DigitalLab LIMS</h1>
        <p style=""color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;"">Laboratory Account Verification</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 32px 28px;"">
        <h2 style=""margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;"">Confirm Your Email Address</h2>
        <p style=""margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          Hello <strong>{WebUtility.HtmlEncode(greetingName)}</strong>,
        </p>
        <p style=""margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          Thank you for starting your 14-day free trial on DigitalLab. To verify that this is your active email address, please enter the following verification code:
        </p>
        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 0 0 24px 0;"">
          <tr>
            <td align=""center"" style=""background: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 20px 10px;"">
              <span style=""font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #047857; display: inline-block;"">
                {otp}
              </span>
            </td>
          </tr>
        </table>
        <div style=""background: #f0fdf4; border-radius: 12px; padding: 12px 16px; margin: 0 0 14px 0; font-size: 12px; color: #166534; line-height: 1.5;"">
          ⏱️ This code is valid for <strong>10 minutes</strong>. After entering this code, your lab will be created immediately.
        </div>
        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>No-Reply Notification:</strong> This is an automated verification email. Please do not reply to this email address.
        </div>
      </td>
    </tr>
    <tr>
      <td style=""background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} DigitalLab LIMS • Secure Pathology Cloud Platform
      </td>
    </tr>
  </table>
</body>
</html>";
        return await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task<(bool Success, string Message)> SendWelcomeCredentialsEmailAsync(string toEmail, string recipientName, string labName, string defaultPassword)
    {
        var subject = $"Welcome to DigitalLab LIMS - Your Login Credentials for {labName}";
        var greetingName = string.IsNullOrWhiteSpace(recipientName) ? "Doctor / Lab Owner" : recipientName;
        var displayLab = string.IsNullOrWhiteSpace(labName) ? "Your Diagnostic Lab" : labName;
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Your DigitalLab Login Credentials</title>
</head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <tr>
      <td style=""background: linear-gradient(135deg, #0284c7 0%, #0f172a 100%); padding: 30px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;"">🎉 Welcome to DigitalLab!</h1>
        <p style=""color: #93c5fd; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;"">{WebUtility.HtmlEncode(displayLab)} is now live on Cloud</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 32px 28px;"">
        <h2 style=""margin: 0 0 10px 0; font-size: 18px; color: #0f172a; font-weight: 700;"">Your Account Has Been Created</h2>
        <p style=""margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          Hello <strong>{WebUtility.HtmlEncode(greetingName)}</strong>,<br>
          Your 14-day free trial has been successfully activated. Below are your official system login credentials:
        </p>

        <!-- Credentials Card -->
        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 0 0 24px 0; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden;"">
          <tr>
            <td style=""padding: 16px 20px; border-bottom: 1px solid #e2e8f0;"">
              <span style=""font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;"">Login Email / Username</span>
              <strong style=""font-size: 15px; color: #0f172a; font-family: monospace;"">{WebUtility.HtmlEncode(toEmail)}</strong>
            </td>
          </tr>
          <tr>
            <td style=""padding: 16px 20px; background: #f0fdf4;"">
              <span style=""font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; display: block;"">Default Password</span>
              <strong style=""font-size: 18px; color: #15803d; font-family: monospace; letter-spacing: 1px;"">{WebUtility.HtmlEncode(defaultPassword)}</strong>
            </td>
          </tr>
        </table>

        <!-- Security Action Notice -->
        <div style=""background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin: 0 0 22px 0; font-size: 13px; color: #92400e; line-height: 1.5;"">
          🔒 <strong>First-Time Login Requirement:</strong><br>
          For security purposes, when you sign in for the first time using this default password, the system will prompt you to change it to your own personal secure password.
        </div>

        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>Do Not Reply:</strong> Yeh automated system message hai. Is email ka reply monitored nahi hota hai (No-Reply). Agar aapko support chahiye to apne Lab portal me Support section se contact karein.
        </div>
      </td>
    </tr>
    <tr>
      <td style=""background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} DigitalLab LIMS • Cloud Pathology Diagnostic Software
      </td>
    </tr>
  </table>
</body>
</html>";
        return await SendEmailAsync(toEmail, subject, htmlBody);
    }


    public async Task<(bool Success, string Message)> SendPatientReportReadyEmailAsync(
        string toEmail, string patientName, string labName, string caseNumber, string uhid, List<string> testNames, string downloadUrl)
    {
        var subject = $"Diagnostic Report Ready - Case {caseNumber} | {labName}";
        var testsFormatted = testNames != null && testNames.Count > 0 
            ? string.Join(", ", testNames) 
            : "Diagnostic Pathology Panel";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><title>Your Diagnostic Report</title></head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <tr>
      <td style=""background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;"">🧪 {WebUtility.HtmlEncode(labName)}</h1>
        <p style=""color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;"">Your Medical Diagnostic Report is Ready</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 30px 26px;"">
        <p style=""margin: 0 0 16px 0; font-size: 15px; color: #334155;"">
          Dear <strong>{WebUtility.HtmlEncode(patientName)}</strong>,
        </p>
        <p style=""margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          Your diagnostic test report has been verified and approved by our clinical team. You can view and download your verified digital report securely using the link below:
        </p>

        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 0 0 24px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;"">
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Case Number:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;"">{WebUtility.HtmlEncode(caseNumber)}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">UHID / Patient ID:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;"">{WebUtility.HtmlEncode(uhid)}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; font-size: 13px; color: #64748b;"">Investigations:</td>
            <td style=""padding: 12px 18px; font-size: 13px; font-weight: 600; color: #059669; text-align: right;"">{WebUtility.HtmlEncode(testsFormatted)}</td>
          </tr>
        </table>

        <div style=""text-align: center; margin: 0 0 26px 0;"">
          <a href=""{downloadUrl}"" style=""background: #059669; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);"">
            📄 View & Download Report
          </a>
        </div>

        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>No-Reply Notification:</strong> This is an automated medical notification from {WebUtility.HtmlEncode(labName)}. Please do not reply directly to this email.
        </div>
      </td>
    </tr>
    <tr>
      <td style=""background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} {WebUtility.HtmlEncode(labName)} • Secure Pathology Cloud Platform
      </td>
    </tr>
  </table>
</body>
</html>";

        return await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task<(bool Success, string Message)> SendPatientRegistrationReceiptEmailAsync(
        string toEmail, string patientName, string labName, string caseNumber, string uhid, List<string> testNames, decimal netAmount, decimal paidAmount, decimal dueAmount, string viewUrl)
    {
        var subject = $"Lab Registration & Bill Receipt - Case {caseNumber} | {labName}";
        var testsFormatted = testNames != null && testNames.Count > 0 
            ? string.Join(", ", testNames) 
            : "Diagnostic Pathology Panel";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><title>Registration Receipt</title></head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <tr>
      <td style=""background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;"">🧾 {WebUtility.HtmlEncode(labName)}</h1>
        <p style=""color: #bae6fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;"">Booking & Billing Receipt Confirmation</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 30px 26px;"">
        <p style=""margin: 0 0 16px 0; font-size: 15px; color: #334155;"">
          Dear <strong>{WebUtility.HtmlEncode(patientName)}</strong>,
        </p>
        <p style=""margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          Thank you for choosing <strong>{WebUtility.HtmlEncode(labName)}</strong>. Your case has been registered and sample collected. Below is your billing summary:
        </p>

        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 0 0 24px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;"">
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Case Number:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;"">{WebUtility.HtmlEncode(caseNumber)}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">UHID:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;"">{WebUtility.HtmlEncode(uhid)}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Booked Tests:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0284c7; text-align: right;"">{WebUtility.HtmlEncode(testsFormatted)}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Total Net Bill:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;"">₹{netAmount:N2}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Amount Paid:</td>
            <td style=""padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #15803d; text-align: right;"">₹{paidAmount:N2}</td>
          </tr>
          <tr>
            <td style=""padding: 12px 18px; font-size: 13px; color: #64748b;"">Balance Due:</td>
            <td style=""padding: 12px 18px; font-size: 14px; font-weight: 700; color: {(dueAmount > 0 ? "#b91c1c" : "#15803d")}; text-align: right;"">₹{dueAmount:N2}</td>
          </tr>
        </table>

        <div style=""background: #f0fdf4; border-radius: 12px; padding: 12px 16px; margin: 0 0 20px 0; font-size: 12px; color: #166534; line-height: 1.5;"">
          🔬 <strong>Sample Under Processing:</strong> Your diagnostic tests are being processed by our laboratory technicians. You will receive an automated notification as soon as your report is approved.
        </div>

        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>No-Reply Notification:</strong> This is an automated billing confirmation from {WebUtility.HtmlEncode(labName)}. Please do not reply directly to this email.
        </div>
      </td>
    </tr>
    <tr>
      <td style=""background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} {WebUtility.HtmlEncode(labName)} • Diagnostic Laboratory Management
      </td>
    </tr>
  </table>
</body>
</html>";

        return await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task<(bool Success, string Message)> SendStaffCredentialsEmailAsync(
        string toEmail, string staffName, string labName, string role, string designation, string password)
    {
        var subject = $"Welcome to {labName} - Your Staff Portal Login Credentials";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><title>Staff Login Credentials</title></head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <tr>
      <td style=""background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;"">🏥 {WebUtility.HtmlEncode(labName)}</h1>
        <p style=""color: #c7d2fe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;"">Staff Portal Access Granted</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 30px 26px;"">
        <p style=""margin: 0 0 16px 0; font-size: 15px; color: #334155;"">
          Hello <strong>{WebUtility.HtmlEncode(staffName)}</strong>,
        </p>
        <p style=""margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          An account has been created for you at <strong>{WebUtility.HtmlEncode(labName)}</strong>. You have been assigned the role of <strong>{WebUtility.HtmlEncode(designation ?? role)}</strong>.
        </p>

        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 0 0 24px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;"">
          <tr>
            <td style=""padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Login Username / Email:</td>
            <td style=""padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;"">{WebUtility.HtmlEncode(toEmail)}</td>
          </tr>
          <tr>
            <td style=""padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">Role:</td>
            <td style=""padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #4f46e5; text-align: right;"">{WebUtility.HtmlEncode(role)}</td>
          </tr>
          <tr>
            <td style=""padding: 14px 18px; font-size: 13px; color: #64748b; background: #f0fdf4;"">Temporary Password:</td>
            <td style=""padding: 14px 18px; font-size: 16px; font-weight: 700; color: #15803d; text-align: right; font-family: monospace; letter-spacing: 1px; background: #f0fdf4;"">{WebUtility.HtmlEncode(password)}</td>
          </tr>
        </table>

        <div style=""background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; margin: 0 0 20px 0; font-size: 12px; color: #92400e; line-height: 1.5;"">
          🔒 <strong>Security Notice:</strong> Please sign in to the portal and change your temporary password to your personal secure password.
        </div>

        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>No-Reply Notification:</strong> This is an automated system message. Please do not reply directly to this email.
        </div>
      </td>
    </tr>
    <tr>
      <td style=""background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} {WebUtility.HtmlEncode(labName)} • Pathology Management System
      </td>
    </tr>
  </table>
</body>
</html>";

        return await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task<(bool Success, string Message)> SendTicketReplyNotificationEmailAsync(
        string toEmail, string recipientName, string ticketNumber, string subject, string senderName, string replyMessage)
    {
        var mailSubject = $"Support Update: New Reply on Ticket #{ticketNumber}";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><title>Support Ticket Reply</title></head>
<body style=""margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);"">
    <tr>
      <td style=""background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;"">🎧 DigitalLab Support Desk</h1>
        <p style=""color: #e0f2fe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;"">Update on Ticket #{WebUtility.HtmlEncode(ticketNumber)}</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 30px 26px;"">
        <p style=""margin: 0 0 16px 0; font-size: 15px; color: #334155;"">
          Hello <strong>{WebUtility.HtmlEncode(recipientName)}</strong>,
        </p>
        <p style=""margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;"">
          You have received a new response on your support inquiry regarding <strong>""{WebUtility.HtmlEncode(subject)}""</strong>:
        </p>

        <div style=""background: #f8fafc; border-left: 4px solid #0284c7; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;"">
          <span style=""font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 6px;"">Reply from {WebUtility.HtmlEncode(senderName)}:</span>
          <p style=""margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;"">{WebUtility.HtmlEncode(replyMessage)}</p>
        </div>

        <div style=""background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 0; font-size: 11px; color: #64748b; line-height: 1.5; border-left: 3px solid #94a3b8;"">
          🚫 <strong>No-Reply Notification:</strong> This is an automated support update. Please sign in to your Lab portal to post further responses.
        </div>
      </td>
    </tr>
    <tr>
      <td style=""background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;"">
        © {DateTime.UtcNow.Year} DigitalLab Support Team • 24/7 Diagnostics Cloud
      </td>
    </tr>
  </table>
</body>
</html>";

        return await SendEmailAsync(toEmail, mailSubject, htmlBody);
    }

    public async Task<(bool Success, string Message)> SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var host = _config["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
        var portStr = _config["EmailSettings:SmtpPort"] ?? "587";
        int.TryParse(portStr, out var port);
        if (port <= 0) port = 587;

        var senderEmail = _config["EmailSettings:SenderEmail"] 
            ?? Environment.GetEnvironmentVariable("SMTP_SENDER_EMAIL");
        var senderPassword = _config["EmailSettings:SenderPassword"] 
            ?? Environment.GetEnvironmentVariable("SMTP_SENDER_PASSWORD");
        var displayName = _config["EmailSettings:SenderDisplayName"] ?? "DigitalLab LIMS";
        var enableSsl = bool.TryParse(_config["EmailSettings:EnableSsl"], out var ssl) ? ssl : true;

        if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
        {
            _logger.LogWarning($"[EmailService] SMTP credentials not set (EmailSettings:SenderEmail/SenderPassword). OTP email to {toEmail} was not sent via SMTP.");
            return (false, "SMTP credentials are not configured in EmailSettings.");
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(senderEmail.Trim(), senderPassword.Replace(" ", "").Trim()),
                EnableSsl = enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Timeout = 15000
            };

            var replyToEmail = _config["EmailSettings:ReplyToEmail"];
            if (string.IsNullOrWhiteSpace(replyToEmail) || replyToEmail.EndsWith(".local", StringComparison.OrdinalIgnoreCase))
            {
                replyToEmail = senderEmail.Trim();
            }

            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail.Trim(), displayName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail.Trim());

            // High deliverability transactional headers (genuine sender, no bulk classification)
            message.Priority = MailPriority.High;
            message.ReplyToList.Clear();
            message.ReplyToList.Add(new MailAddress(replyToEmail.Trim(), displayName));

            message.Headers.Add("X-Priority", "1");
            message.Headers.Add("Importance", "High");
            message.Headers.Add("Auto-Submitted", "auto-generated");

            await client.SendMailAsync(message);
            _logger.LogInformation($"[EmailService] OTP email sent successfully to {toEmail}.");
            return (true, "Email sent successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"[EmailService] Failed to send email to {toEmail}: {ex.Message}");
            return (false, $"Failed to send email: {ex.Message}");
        }
    }
}
