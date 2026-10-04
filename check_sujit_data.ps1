$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{emailOrUsername='pradum@citycarelab.com';password='Pass@12345'} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token

$inv = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/00adab26-5c99-4d11-a42a-a5f14d6f1a66" -Headers @{ Authorization = "Bearer $token" }

Write-Host "Case:" $inv.caseNumber "Status:" $inv.status
foreach ($item in $inv.items) {
    Write-Host "`nTest:" $item.testName
    foreach ($p in $item.parameters) {
        Write-Host "  - $($p.parameterName): Value='$($p.resultValue)' (Flag: $($p.flag))"
    }
}
