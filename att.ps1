# --- CONFIGURATION ---
$ClientId = "784uaoczc4v7vz"
# This is the secret you provided. PowerShell will handle the special characters automatically.
$ClientSecret = "YOUR_CLIENT_SECRET" 
$RedirectUri = "https://your-ngrok-url.ngrok-free.dev/callback"

# PASTE YOUR NEW FRESH CODE HERE vvv
$AuthCode = "YOUR_AUTH_CODE" 

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