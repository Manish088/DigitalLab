$loginPayload = @{
    emailOrUsername = "pradum@citycarelab.com"
    password = "Pass@12345"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$token = $auth.token

$caseId = "00adab26-5c99-4d11-a42a-a5f14d6f1a66"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/$caseId" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Success! Items count:" $res.items.Count
    $res | ConvertTo-Json -Depth 4
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Details:" $reader.ReadToEnd()
    }
}
