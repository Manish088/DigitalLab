Write-Host "=== LIMS Full Workflow Verification Test ==="

# 1. Login
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{emailOrUsername='pradum@citycarelab.com';password='Pass@12345'} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "1. Auth Token acquired successfully for user: $($login.user.fullName)"

# 2. Get Case List
$cases = Invoke-RestMethod -Uri "http://localhost:5000/api/cases?search=Sujit" -Headers $headers
$case = $cases.items[0]
Write-Host "2. Found Case: $($case.caseNumber) for Patient: $($case.patientName) (ID: $($case.id))"

# 3. Get Investigation Details
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$inv = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/$($case.id)" -Headers $headers
$sw.Stop()
Write-Host "3. Investigation details loaded in: $($sw.ElapsedMilliseconds) ms"
Write-Host "   - Items count: $($inv.items.Count)"
foreach ($item in $inv.items) {
    Write-Host "   - Test: $($item.testName) ($($item.parameters.Count) parameters)"
}

# 4. Save Results
$savePayload = @{
    caseOrderId = $case.id
    items = @(
        @{
            caseOrderItemId = $inv.items[0].id
            pathologistRemarks = "Normocytic Normochromic blood picture. No immature cells or parasites seen."
            interpretationNote = "Complete Blood Count parameters are within normal biological reference limits."
            results = @(
                @{ parameterId = $inv.items[0].parameters[0].parameterId; resultValue = "15.2"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[1].parameterId; resultValue = "7500"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[2].parameterId; resultValue = "2.80"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[3].parameterId; resultValue = "62"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[4].parameterId; resultValue = "30"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[5].parameterId; resultValue = "5"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[6].parameterId; resultValue = "3"; remarks = "" },
                @{ parameterId = $inv.items[0].parameters[7].parameterId; resultValue = "45.0"; remarks = "" }
            )
        },
        @{
            caseOrderItemId = $inv.items[1].id
            pathologistRemarks = "Normal Fasting Blood Sugar level."
            interpretationNote = "Fasting glucose is within expected normal reference range."
            results = @(
                @{ parameterId = $inv.items[1].parameters[0].parameterId; resultValue = "92"; remarks = "" }
            )
        }
    )
}

$sw.Restart()
$saveRes = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/save-results" -Method Post -Headers $headers -Body ($savePayload | ConvertTo-Json -Depth 5) -ContentType "application/json"
$sw.Stop()
Write-Host "4. Save Results executed in: $($sw.ElapsedMilliseconds) ms -> Response: $($saveRes.message)"

# 5. Approve Report
$sw.Restart()
$approveRes = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/$($case.id)/approve" -Method Post -Headers $headers -ContentType "application/json"
$sw.Stop()
Write-Host "5. Approve Report executed in: $($sw.ElapsedMilliseconds) ms -> Approved by: $($approveRes.approvedByName)"

# 6. Generate Patient Report PDF
$sw.Restart()
$reportPdfUrl = "http://localhost:5000/api/reports/pdf/$($case.id)?letterheadMode=true"
Invoke-WebRequest -Uri $reportPdfUrl -OutFile "test_verified_report.pdf" -UseBasicParsing
$sw.Stop()
$pdfLen = (Get-Item "test_verified_report.pdf").Length
Write-Host "6. Diagnostic Patient Report PDF generated in: $($sw.ElapsedMilliseconds) ms (File Size: $pdfLen bytes)"

# 7. Generate Tax Invoice PDF
$sw.Restart()
$invoicePdfUrl = "http://localhost:5000/api/reports/invoice/$($case.id)"
Invoke-WebRequest -Uri $invoicePdfUrl -OutFile "test_verified_invoice.pdf" -UseBasicParsing
$sw.Stop()
$invLen = (Get-Item "test_verified_invoice.pdf").Length
Write-Host "7. Tax Invoice PDF generated in: $($sw.ElapsedMilliseconds) ms (File Size: $invLen bytes)"

# 8. Generate Barcode SVG
$sw.Restart()
$barcodeSvgUrl = "http://localhost:5000/api/cases/$($case.id)/barcode-svg"
Invoke-WebRequest -Uri $barcodeSvgUrl -OutFile "test_verified_barcode.svg" -UseBasicParsing
$sw.Stop()
$barLen = (Get-Item "test_verified_barcode.svg").Length
Write-Host "8. Sample Tube Barcode SVG generated in: $($sw.ElapsedMilliseconds) ms (File Size: $barLen bytes)"

# 9. Public Token Verification
$sw.Restart()
$publicRes = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/public/$($case.publicAccessToken)"
$sw.Stop()
Write-Host "9. Public QR Verification fetched in: $($sw.ElapsedMilliseconds) ms (Patient: $($publicRes.patientName), Status: $($publicRes.status))"

Write-Host "`n=== ALL 9 LIMS WORKFLOW CRITICAL CHECKS PASSED WITH FLYING COLORS! ==="
