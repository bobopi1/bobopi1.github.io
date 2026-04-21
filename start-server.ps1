param(
    [int]$Port = 8080
)

$root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$rootPrefix = if ($root.EndsWith("\")) { $root } else { "$root\" }
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()

Write-Host ""
Write-Host "BudgetFlow Web is running." -ForegroundColor Green
Write-Host "Local URL: http://localhost:$Port"
Write-Host "Network URL: http://<your-pc-ip>:$Port"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

$contentTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".webmanifest" = "application/manifest+json; charset=utf-8"
    ".svg" = "image/svg+xml"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".ico" = "image/x-icon"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $writer = [System.IO.BinaryWriter]::new($stream)

        $requestLine = $reader.ReadLine()
        if ([string]::IsNullOrWhiteSpace($requestLine)) {
            Close-Connection -Writer $writer -Reader $reader -Stream $stream -Client $client
            continue
        }

        while (($line = $reader.ReadLine()) -ne "") {
            if ($null -eq $line) {
                break
            }
        }

        $parts = $requestLine.Split(" ")
        if ($parts.Length -lt 2) {
            Write-Response -Writer $writer -StatusCode 400 -StatusText "Bad Request" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Bad request"))
            Close-Connection -Writer $writer -Reader $reader -Stream $stream -Client $client
            continue
        }

        $requestTarget = $parts[1].Split("?")[0]
        $requestPath = [System.Uri]::UnescapeDataString($requestTarget.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($requestPath)) {
            $requestPath = "index.html"
        }

        $safeRelativePath = $requestPath -replace "/", "\"
        $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $safeRelativePath))

        if (-not ($fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase))) {
            Write-Response -Writer $writer -StatusCode 403 -StatusText "Forbidden" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Forbidden"))
            Close-Connection -Writer $writer -Reader $reader -Stream $stream -Client $client
            continue
        }

        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            Write-Response -Writer $writer -StatusCode 404 -StatusText "Not Found" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
            Close-Connection -Writer $writer -Reader $reader -Stream $stream -Client $client
            continue
        }

        $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $contentType = $contentTypes[$extension]
        if (-not $contentType) {
            $contentType = "application/octet-stream"
        }

        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        Write-Response -Writer $writer -StatusCode 200 -StatusText "OK" -BodyBytes $bytes -ContentType $contentType
        Close-Connection -Writer $writer -Reader $reader -Stream $stream -Client $client
    }
}
finally {
    $listener.Stop()
}

function Write-Response {
    param(
        [Parameter(Mandatory = $true)]$Writer,
        [Parameter(Mandatory = $true)][int]$StatusCode,
        [Parameter(Mandatory = $true)][string]$StatusText,
        [Parameter(Mandatory = $true)][byte[]]$BodyBytes,
        [string]$ContentType = "text/plain; charset=utf-8"
    )

    $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($BodyBytes.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $Writer.Write($headerBytes)
    $Writer.Write($BodyBytes)
    $Writer.Flush()
}

function Close-Connection {
    param(
        [Parameter(Mandatory = $true)]$Writer,
        [Parameter(Mandatory = $true)]$Reader,
        [Parameter(Mandatory = $true)]$Stream,
        [Parameter(Mandatory = $true)]$Client
    )

    $Writer.Close()
    $Reader.Close()
    $Stream.Close()
    $Client.Close()
}
