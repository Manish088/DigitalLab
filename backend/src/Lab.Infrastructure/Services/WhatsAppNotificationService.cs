using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Lab.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Lab.Infrastructure.Services;

public class WhatsAppNotificationService : IWhatsAppNotificationService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WhatsAppNotificationService> _logger;

    public WhatsAppNotificationService(
        IConfiguration config,
        IHttpClientFactory httpClientFactory,
        ILogger<WhatsAppNotificationService> logger)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string ProviderName => _config["WhatsAppSettings:Provider"] ?? "MetaCloudApi";

    public bool IsConfigured
    {
        get
        {
            var provider = ProviderName.Trim();
            if (provider.Equals("MetaCloudApi", StringComparison.OrdinalIgnoreCase))
            {
                var token = _config["WhatsAppSettings:MetaCloudApi:AccessToken"];
                var phoneId = _config["WhatsAppSettings:MetaCloudApi:PhoneNumberId"];
                return !string.IsNullOrWhiteSpace(token) && !string.IsNullOrWhiteSpace(phoneId);
            }
            if (provider.Equals("UltraMsg", StringComparison.OrdinalIgnoreCase))
            {
                var instanceId = _config["WhatsAppSettings:UltraMsg:InstanceId"];
                var token = _config["WhatsAppSettings:UltraMsg:Token"];
                return !string.IsNullOrWhiteSpace(instanceId) && !string.IsNullOrWhiteSpace(token);
            }
            if (provider.Equals("Webhook", StringComparison.OrdinalIgnoreCase))
            {
                var url = _config["WhatsAppSettings:Webhook:Url"];
                return !string.IsNullOrWhiteSpace(url);
            }
            return false;
        }
    }

    public async Task<WhatsAppSendResult> SendReportPdfAsync(
        string recipientPhone,
        string recipientName,
        string caseNumber,
        string downloadUrl,
        byte[] pdfBytes,
        string fileName,
        string? customMessage = null)
    {
        var cleanPhone = NormalizePhoneNumber(recipientPhone);
        if (string.IsNullOrWhiteSpace(cleanPhone) || cleanPhone.Length < 10)
        {
            return new WhatsAppSendResult
            {
                Success = false,
                Message = $"Invalid recipient phone number: '{recipientPhone}'. Minimum 10 digits required.",
                RequiresClientShare = false
            };
        }

        var defaultCaption = !string.IsNullOrWhiteSpace(customMessage)
            ? customMessage
            : $"*Namaste {recipientName} Ji*,\n\nAapki Diagnostic Test Report verify ho chuki hai (Case No: *{caseNumber}*).\nPDF document attach kar di gayi hai.\n\n_Thank you for choosing DigitalLab!_";

        if (!IsConfigured)
        {
            _logger.LogInformation("[WhatsApp Service] No direct WhatsApp cloud API gateway configured. Falling back to device/browser PDF share for +{Phone}.", cleanPhone);
            return new WhatsAppSendResult
            {
                Success = false,
                RequiresClientShare = true,
                DeliveryChannel = "ClientShareNeeded",
                Message = "WhatsApp Cloud API gateway is not configured on server. Use direct device/browser PDF share."
            };
        }

        var provider = ProviderName.Trim();
        try
        {
            if (provider.Equals("MetaCloudApi", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaMetaCloudApiAsync(cleanPhone, fileName, downloadUrl, defaultCaption);
            }
            else if (provider.Equals("UltraMsg", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaUltraMsgAsync(cleanPhone, fileName, downloadUrl, defaultCaption);
            }
            else if (provider.Equals("Webhook", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaWebhookAsync(cleanPhone, recipientName, caseNumber, fileName, downloadUrl, pdfBytes, defaultCaption);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[WhatsApp Service 🛑] Failed to send PDF via {Provider} to +{Phone}: {Error}", provider, cleanPhone, ex.Message);
            return new WhatsAppSendResult
            {
                Success = false,
                RequiresClientShare = true,
                DeliveryChannel = provider,
                Message = $"Error sending WhatsApp message via {provider}: {ex.Message}. Falling back to device share."
            };
        }

        return new WhatsAppSendResult
        {
            Success = false,
            RequiresClientShare = true,
            DeliveryChannel = "ClientShareNeeded",
            Message = "No matching WhatsApp provider configured."
        };
    }

    private async Task<WhatsAppSendResult> SendViaMetaCloudApiAsync(string phone, string fileName, string downloadUrl, string caption)
    {
        var token = _config["WhatsAppSettings:MetaCloudApi:AccessToken"]?.Trim();
        var phoneId = _config["WhatsAppSettings:MetaCloudApi:PhoneNumberId"]?.Trim();

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            messaging_product = "whatsapp",
            recipient_type = "individual",
            to = phone,
            type = "document",
            document = new
            {
                link = downloadUrl,
                filename = fileName,
                caption = caption
            }
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"https://graph.facebook.com/v19.0/{phoneId}/messages", content);
        var responseString = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("[WhatsApp Service] PDF report document delivered via Meta Cloud API to +{Phone}.", phone);
            return new WhatsAppSendResult
            {
                Success = true,
                DeliveryChannel = "MetaCloudApi",
                Message = "PDF report successfully sent via WhatsApp Cloud API.",
                MessageId = responseString
            };
        }
        else
        {
            _logger.LogWarning("[WhatsApp Service] Meta Cloud API returned status {StatusCode}: {Response}", response.StatusCode, responseString);
            return new WhatsAppSendResult
            {
                Success = false,
                RequiresClientShare = true,
                DeliveryChannel = "MetaCloudApi",
                Message = $"Meta Cloud API error ({response.StatusCode}): {responseString}"
            };
        }
    }

    private async Task<WhatsAppSendResult> SendViaUltraMsgAsync(string phone, string fileName, string downloadUrl, string caption)
    {
        var instanceId = _config["WhatsAppSettings:UltraMsg:InstanceId"]?.Trim();
        var token = _config["WhatsAppSettings:UltraMsg:Token"]?.Trim();

        var client = _httpClientFactory.CreateClient();
        var formData = new Dictionary<string, string>
        {
            { "token", token ?? "" },
            { "to", phone },
            { "filename", fileName },
            { "document", downloadUrl },
            { "caption", caption }
        };

        var response = await client.PostAsync($"https://api.ultramsg.com/{instanceId}/messages/document", new FormUrlEncodedContent(formData));
        var responseString = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            return new WhatsAppSendResult
            {
                Success = true,
                DeliveryChannel = "UltraMsg",
                Message = "PDF report successfully sent via UltraMsg WhatsApp API.",
                MessageId = responseString
            };
        }

        return new WhatsAppSendResult
        {
            Success = false,
            RequiresClientShare = true,
            DeliveryChannel = "UltraMsg",
            Message = $"UltraMsg error ({response.StatusCode}): {responseString}"
        };
    }

    private async Task<WhatsAppSendResult> SendViaWebhookAsync(
        string phone, string recipientName, string caseNumber, string fileName, string downloadUrl, byte[] pdfBytes, string caption)
    {
        var url = _config["WhatsAppSettings:Webhook:Url"]?.Trim();
        var apiKey = _config["WhatsAppSettings:Webhook:ApiKey"]?.Trim();

        var client = _httpClientFactory.CreateClient();
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        }

        var payload = new
        {
            phone,
            recipientName,
            caseNumber,
            fileName,
            downloadUrl,
            pdfBase64 = Convert.ToBase64String(pdfBytes),
            caption,
            sentAt = DateTime.UtcNow
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(url, content);

        if (response.IsSuccessStatusCode)
        {
            return new WhatsAppSendResult
            {
                Success = true,
                DeliveryChannel = "Webhook",
                Message = "PDF report forwarded to WhatsApp webhook gateway successfully."
            };
        }

        return new WhatsAppSendResult
        {
            Success = false,
            RequiresClientShare = true,
            DeliveryChannel = "Webhook",
            Message = $"Webhook error: {response.StatusCode}"
        };
    }

    private static string NormalizePhoneNumber(string phone)
    {
        var digits = Regex.Replace(phone ?? "", @"\D", "");
        if (string.IsNullOrWhiteSpace(digits)) return "";
        if (digits.Length == 10) return $"91{digits}";
        if (digits.Length == 12 && digits.StartsWith("91")) return digits;
        if (digits.Length > 10 && !digits.StartsWith("91")) return $"91{digits}";
        return digits;
    }
}
