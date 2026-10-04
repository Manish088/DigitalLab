$baseUrl = "http://localhost:5000"
$caseId = "1943e807-440a-4f2e-87cc-baa6ce54121d"
$url = "$baseUrl/api/reports/pdf/$($caseId)?letterheadMode=true"
Write-Host "Calling URL:" $url
try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing
    Write-Host "Success! StatusCode:" $res.StatusCode "Length:" $res.RawContentLength
} catch {
    Write-Host "Failed:" $_.Exception.Message
    if ($_.Exception.Response) {
        $s = $_.Exception.Response.GetResponseStream()
        $r = New-Object System.IO.StreamReader($s)
        Write-Host "Response Body:" $r.ReadToEnd()
    }
}
