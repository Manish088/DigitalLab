$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{emailOrUsername='pradum@citycarelab.com';password='Pass@12345'} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token

$cases = Invoke-RestMethod -Uri "http://localhost:5000/api/cases?search=LS-2026-00101" -Headers @{ Authorization = "Bearer $token" }
$case = $cases.items[0]
Write-Host "Found Case:" $case.caseNumber "ID:" $case.id "Patient:" $case.patientName

$pdfUrl = "http://localhost:5000/api/reports/pdf/$($case.id)?letterheadMode=true"
Write-Host "Fetching PDF from:" $pdfUrl
$res = Invoke-WebRequest -Uri $pdfUrl -UseBasicParsing
Write-Host "Status:" $res.StatusCode "Length:" $res.RawContentLength "bytes"
