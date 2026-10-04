$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{emailOrUsername='pradum@citycarelab.com';password='Pass@12345'} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
$caseId = "00adab26-5c99-4d11-a42a-a5f14d6f1a66"

$reportUrl = "http://localhost:5000/api/reports/pdf/$caseId?letterheadMode=true"
$invoiceUrl = "http://localhost:5000/api/reports/invoice/$caseId"
$barcodeUrl = "http://localhost:5000/api/cases/$caseId/barcode-svg"

Invoke-WebRequest -Uri $reportUrl -OutFile "test_report.pdf" -UseBasicParsing
Write-Host "Report PDF downloaded, Size:" (Get-Item "test_report.pdf").Length "bytes"

Invoke-WebRequest -Uri $invoiceUrl -OutFile "test_invoice.pdf" -UseBasicParsing
Write-Host "Invoice PDF downloaded, Size:" (Get-Item "test_invoice.pdf").Length "bytes"

Invoke-WebRequest -Uri $barcodeUrl -OutFile "test_barcode.svg" -UseBasicParsing
Write-Host "Barcode SVG downloaded, Size:" (Get-Item "test_barcode.svg").Length "bytes"
