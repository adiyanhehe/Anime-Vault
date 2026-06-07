# PowerShell script to generate a self‑signed code‑signing certificate for Windows builds
# Run this once before building the Windows installer.

$pwd = ConvertTo-SecureString -String "devpwd" -Force -AsPlainText

$cert = New-SelfSignedCertificate `
    -Subject "CN=AnimeVault Dev" `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyUsage DigitalSignature `
    -Type CodeSigningCert

Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" `
    -FilePath "C:\Anime-Vault\certs\dev.pfx" `
    -Password $pwd

Write-Host "Certificate generated at C:\Anime-Vault\certs\dev.pfx (password: devpwd)"
