[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Service,

  [Parameter(Mandatory = $true)]
  [string]$SmokeUrlKey,

  [string]$SmokePath = '',
  [int]$ExpectedStatusMin = 200,
  [int]$ExpectedStatusMax = 399,
  [int]$MaxAttempts = 12,
  [int]$DelaySeconds = 5,
  [string[]]$CleanupServices = @(),
  [string]$ProjectName = '{{PROJECT_NAME}}-test',
  [string]$EnvFile = '.infra/env/stack.test.env'
)

$ErrorActionPreference = 'Stop'
$stackMutexName = 'Global\{{PROJECT_NAME}}LocalTestStack'
$stackMutex = $null
$stackLockAcquired = $false

function Read-StackEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath
  )

  $values = @{}

  Get-Content $FilePath | ForEach-Object {
    if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') {
      $values[$matches[1]] = $matches[2]
    }
  }

  return $values
}

function Invoke-Compose {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$ComposeArguments,

    [switch]$IgnoreFailure
  )

  $baseArgs = @(
    'compose',
    '--project-name',
    $ProjectName,
    '--env-file',
    $EnvFile,
    '-f',
    '.infra/docker/compose.base.yml',
    '-f',
    '.infra/docker/compose.test.yml'
  )

  & docker @baseArgs @ComposeArguments
  $exitCode = $LASTEXITCODE

  if (-not $IgnoreFailure -and $exitCode -ne 0) {
    throw "docker compose $($ComposeArguments -join ' ') fallo con codigo $exitCode"
  }

  return $exitCode
}

function Get-ServiceContainerState {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TargetService
  )

  $baseArgs = @(
    'compose',
    '--project-name',
    $ProjectName,
    '--env-file',
    $EnvFile,
    '-f',
    '.infra/docker/compose.base.yml',
    '-f',
    '.infra/docker/compose.test.yml'
  )

  $containerId = (& docker @baseArgs 'ps' '-q' $TargetService)

  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
    return $null
  }

  $state = (& docker 'inspect' '--format' '{{.State.Status}}' $containerId.Trim())

  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($state)) {
    return $null
  }

  return $state.Trim()
}

function Cleanup-Services {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Services
  )

  $targets = $Services | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

  if ($targets.Count -eq 0) {
    return
  }

  Write-Host "[ci] Limpiando servicios fallidos: $($targets -join ', ')"
  Invoke-Compose -ComposeArguments @('ps') -IgnoreFailure | Out-Null

  foreach ($target in $targets) {
    Write-Host "[ci] Logs finales de $target"
    Invoke-Compose -ComposeArguments @('logs', '--tail=200', $target) -IgnoreFailure | Out-Null
  }

  Invoke-Compose -ComposeArguments (@('stop') + $targets) -IgnoreFailure | Out-Null
  Invoke-Compose -ComposeArguments (@('rm', '-f') + $targets) -IgnoreFailure | Out-Null
}

$servicesToCleanup = @($Service) + $CleanupServices

try {
  Write-Host "[ci] Esperando turno para actualizar el stack test local"
  $stackMutex = [System.Threading.Mutex]::new($false, $stackMutexName)
  $stackLockAcquired = $stackMutex.WaitOne([TimeSpan]::FromMinutes(45))

  if (-not $stackLockAcquired) {
    throw "No se pudo obtener el lock $stackMutexName dentro de 45 minutos"
  }

  Write-Host "[ci] Turno obtenido para $Service"

  try {
    Write-Host "[ci] Limpiando estado previo de $Service"
    Invoke-Compose -ComposeArguments @('stop', $Service) -IgnoreFailure | Out-Null
    Invoke-Compose -ComposeArguments @('rm', '-f', $Service) -IgnoreFailure | Out-Null

    Write-Host "[ci] Actualizando servicio test: $Service"
    Invoke-Compose -ComposeArguments @('up', '-d', '--build', $Service) | Out-Null

    $stackEnv = Read-StackEnv -FilePath $EnvFile
    $baseUrl = $stackEnv[$SmokeUrlKey]

    if ([string]::IsNullOrWhiteSpace($baseUrl)) {
      throw "No se encontró la clave $SmokeUrlKey en $EnvFile"
    }

    $smokeUrl = if ([string]::IsNullOrWhiteSpace($SmokePath)) {
      $baseUrl
    } else {
      '{0}/{1}' -f $baseUrl.TrimEnd('/'), $SmokePath.TrimStart('/')
    }

    $lastError = $null

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
      try {
        Write-Host "[ci] Smoke test intento $attempt/$MaxAttempts -> $smokeUrl"
        $response = Invoke-WebRequest -Uri $smokeUrl -UseBasicParsing -TimeoutSec 15
        $statusCode = [int]$response.StatusCode

        if ($statusCode -ge $ExpectedStatusMin -and $statusCode -le $ExpectedStatusMax) {
          Write-Host "[ci] Smoke test OK ($statusCode)"
          Write-Host "[ci] Limpiando capas de imagen huerfanas"
          docker image prune -f | Out-Null

          Write-Host ""
          Write-Host "[ci] ---------------------------------------------"
          Write-Host "[ci]  $Service actualizado y disponible"
          Write-Host "[ci] ---------------------------------------------"
          Write-Host "[ci]  Public -> $($stackEnv['FRONTEND_PUBLIC_APP_URL'])"
          Write-Host "[ci]  Admin  -> $($stackEnv['FRONTEND_ADMIN_APP_URL'])"
          Write-Host "[ci]  API    -> $($stackEnv['BACKEND_PUBLIC_URL'])"
          Write-Host "[ci] ---------------------------------------------"
          Write-Host ""
          return
        }

        $lastError = "status inesperado $statusCode"
      } catch {
        $lastError = $_.Exception.Message
      }

      $containerState = Get-ServiceContainerState -TargetService $Service

      if ($null -ne $containerState -and $containerState -ne 'running') {
        $lastError = "$lastError (estado del contenedor: $containerState)"
        Write-Host "[ci] Estado actual de $Service`: $containerState"
      }

      if ($containerState -in @('exited', 'dead')) {
        break
      }

      if ($attempt -lt $MaxAttempts) {
        Start-Sleep -Seconds $DelaySeconds
      }
    }

    throw "Smoke test fallo para $Service`: $lastError"
  } catch {
    Write-Host "[ci] Fallo la actualizacion de $Service`: $($_.Exception.Message)"
    Cleanup-Services -Services $servicesToCleanup
    throw
  }
} catch {
  throw
} finally {
  if ($stackLockAcquired -and $null -ne $stackMutex) {
    $stackMutex.ReleaseMutex()
    Write-Host "[ci] Turno liberado para $Service"
  }

  if ($null -ne $stackMutex) {
    $stackMutex.Dispose()
  }
}
