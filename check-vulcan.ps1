try {
  $r = Invoke-WebRequest -Uri 'https://uczen.eduvulcan.pl/powiatsieradzki/Logowanie' -Method GET -UseBasicParsing -TimeoutSec 15
  Write-Output ("STATUS=" + $r.StatusCode)
  Write-Output ("URL=" + $r.BaseResponse.RequestMessage.RequestUri)
  # Get the final URL after redirects
  Write-Output ("FINAL=" + $r.BaseResponse.ResponseUri)
  # Try to look for any token in the page source
  $content = $r.Content
  $matches = [regex]::Matches($content, '(?i)(token|securitytoken|resturl|firebase|certificate)["\s:=]+([A-Za-z0-9+/=_-]{8,80})')
  foreach ($m in $matches) {
    Write-Output ("MATCH: " + $m.Groups[1].Value + " = " + $m.Groups[2].Value.Substring(0, [Math]::Min(60, $m.Groups[2].Value.Length)))
  }
  Write-Output ("LENGTH=" + $content.Length)
} catch {
  Write-Output ("ERR=" + $_.Exception.Message)
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output ("BODY=" + $reader.ReadToEnd().Substring(0, 1000))
  }
}
