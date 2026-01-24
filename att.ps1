# --- CONFIGURATION ---
$ClientId = "784uaoczc4v7vz"
# This is the secret you provided. PowerShell will handle the special characters automatically.
$ClientSecret = "WPL_AP1.YdiDNuUiBUgCwxgS.Z/U6nw==" 
$RedirectUri = "https://bryon-overdetailed-lashonda.ngrok-free.dev/callback"

# PASTE YOUR NEW FRESH CODE HERE vvv
$AuthCode = "AQQbtRVfiZtcg8uBp1wikd5caGq3PsrDnfr4Nhi7Y5_Y4S_zncmvZB7VyCtN79mai7L-u0uobfTF8N8HdkaaSgfkzFH86g3N9bJ2VViPyj1mgaD7n_m00KYbFGSpB7N0vA7zyhLxaFebYqsDis7yHsJvs0kSyvS9nsq3V_spOTTkuOsmicku2dFBNz4QFG8r14-80jxWEgClBCu2wMA" 

# 1. Exchange Code for Access Token
Write-Host "Exchanging code for token..." -Fg Cyan
$tokenBody = @{
    grant_type = "authorization_code"
    code = $AuthCode
    redirect_uri = $RedirectUri
    client_id = $ClientId
    client_secret = $ClientSecret
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "https://www.linkedin.com/oauth/v2/accessToken" -Method Post -Body $tokenBody
    $AccessToken = $tokenResponse.access_token
    Write-Host "`n✅ NEW ACCESS TOKEN:" -Fg Green
    Write-Host $AccessToken -Fg Yellow
    
    # 2. Immediately Get Person URN
    Write-Host "`nFetching Person URN..." -Fg Cyan
    $urnHeaders = @{ Authorization = "Bearer $AccessToken" }
    $userResponse = Invoke-RestMethod -Uri "https://api.linkedin.com/v2/userinfo" -Headers $urnHeaders
    
    $PersonURN = "urn:li:person:" + $userResponse.sub
    Write-Host "✅ PERSON URN:" -Fg Green
    Write-Host $PersonURN -Fg Yellow
} catch {
    Write-Error "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.EqtResponseStream())
        Write-Host "Server Response: $($reader.ReadToEnd())" -Fg Red
    }
}