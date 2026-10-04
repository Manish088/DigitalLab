$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{emailOrUsername='pradum@citycarelab.com';password='Pass@12345'} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

$caseId = "00adab26-5c99-4d11-a42a-a5f14d6f1a66"
$inv = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/$caseId" -Headers $headers

Write-Host "Loaded Case: $($inv.caseNumber), Patient: $($inv.patient.fullName), Items: $($inv.items.Count)"

$savePayload = @{
    caseOrderId = $caseId
    items = @(
        @{
            caseOrderItemId = $inv.items[0].id
            pathologistRemarks = "Normocytic Normochromic blood picture. No abnormal cells seen."
            interpretationNote = "All CBC parameters within physiological limits."
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

$saveRes = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/save-results" -Method Post -Headers $headers -Body ($savePayload | ConvertTo-Json -Depth 5) -ContentType "application/json"
Write-Host "Save response: $($saveRes.message)"

$approveRes = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/$caseId/approve" -Method Post -Headers $headers -ContentType "application/json"
Write-Host "Approve response: $($approveRes.message), Approved by: $($approveRes.approvedByName)"

$checkInv = Invoke-RestMethod -Uri "http://localhost:5000/api/investigations/$caseId" -Headers $headers
foreach ($item in $checkInv.items) {
    Write-Host "`nTest: $($item.testName)"
    foreach ($p in $item.parameters) {
        Write-Host "  - $($p.parameterName): Value='$($p.resultValue)' (Range: $($p.normalRangeText), Flag: $($p.flag))"
    }
}
