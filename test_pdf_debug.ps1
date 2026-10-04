try {
    $res = Invoke-WebRequest -Uri "http://localhost:5000/api/reports/pdf/00adab26-5c99-4d11-a42a-a5f14d6f1a66?letterheadMode=true" -UseBasicParsing -ErrorAction Stop
    Write-Host "Success! Length:" $res.RawContentLength
} catch {
    Write-Host "Error Status:" $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "Error Body:" $body
}
