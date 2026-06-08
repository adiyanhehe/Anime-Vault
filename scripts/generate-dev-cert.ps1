# PowerShell script to generate a self-signed code-signing certificate
# for the AnimeVault Windows installer.
#
# Output: C:\Anime-Vault\animevault-code-signing.pfx
# Password: Adiyan123@!
#
# IMPORTANT: Make sure to update the CSC_KEY_PASSWORD GitHub repository
# secret to match the new password ("Adiyan123@!") so CI builds can sign.

$ErrorActionPreference = "Stop"

# Password used for both the local PFX and the GitHub CSC_KEY_PASSWORD secret.
$pwdText = "Adiyan123@!"
$pwd = ConvertTo-SecureString -String $pwdText -Force -AsPlainText

Write-Host "Generating self-signed code-signing certificate..."
Write-Host "  Subject        : CN=AnimeVault"
Write-Host "  Key Length     : 2048"
Write-Host "  Output PFX     : C:\Anime-Vault\animevault-code-signing.pfx"
Write-Host "  PFX Password   : $pwdText"

$cert = New-SelfSignedCertificate `
    -Subject "CN=AnimeVault" `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyUsage DigitalSignature `
    -Type CodeSigningCert

# Export to the path the electron-build workflow uses (workspace root).
$outPath = "C:\Anime-Vault\animevault-code-signing.pfx"

Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" `
    -FilePath $outPath `
    -Password $pwd `
    -ChainOption BuildChain

# Remove the certificate from the personal store so it doesn't pollute
# the user's certificate list (the PFX file is the source of truth going
# forward). This also avoids duplicate-subject warnings on re-runs.
try {
    Remove-Item -Path "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force -ErrorAction SilentlyContinue
} catch {
    Write-Warning "Could not remove the cert from the personal store: $_"
}

Write-Host ""
Write-Host "Certificate generated successfully."
Write-Host "  Path     : $outPath"
Write-Host "  Password : $pwdText"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Commit the new PFX (if you want it in the repo) or upload it as a GitHub Actions secret."
Write-Host "  2. Update the CSC_KEY_PASSWORD repository secret on GitHub to: $pwdText"
