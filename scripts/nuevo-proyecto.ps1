<#
.SYNOPSIS
  Crea un proyecto nuevo con el pipeline DevSecOps completo, listo para trabajar.

.DESCRIPTION
  A partir del repositorio plantilla, crea un repositorio nuevo y lo deja configurado:
  secretos, etiquetas, ambientes DEV y QA, proyecto en SonarQube Cloud y ruleset con
  los quality gates obligatorios. Al final, el pipeline corre por primera vez en main.

.EXAMPLE
  .\scripts\nuevo-proyecto.ps1 -Nombre parqueadero-norte

.NOTES
  Requisitos: GitHub CLI autenticado (gh auth login) y Git.
  Los secretos se leen de variables de entorno si existen (ANTHROPIC_API_KEY, SONAR_TOKEN,
  CHAT_WEBHOOK_URL); si no, el script los pide de forma oculta. Nunca se guardan en archivos.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9][a-z0-9-]{2,60}$')]
  [string]$Nombre,

  [string]$Owner = 'JCG097',
  [string]$Plantilla = 'JCG097/ai-sdlc-quality-pipeline-demo',
  [string]$SonarOrg = 'jcg097'
)

$ErrorActionPreference = 'Stop'
$Repo = "$Owner/$Nombre"
$SonarKey = "${Owner}_$Nombre"

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "    [OK] $texto" -ForegroundColor Green }

# Ejecuta un comando de gh y detiene el script si falla.
function Gh {
  & gh @args
  if ($LASTEXITCODE -ne 0) { throw "Falló: gh $($args -join ' ')" }
}

# Lee un secreto de una variable de entorno o lo pide sin mostrarlo en pantalla.
function Get-Secreto($nombre) {
  $valor = [Environment]::GetEnvironmentVariable($nombre)
  if ($valor) { return $valor }
  $seguro = Read-Host "Ingresa $nombre" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$inicio = Get-Date

# ---------------------------------------------------------------------------
Paso "Verificando requisitos"
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw 'GitHub CLI no está autenticado. Ejecuta: gh auth login' }
Ok 'GitHub CLI autenticado'

$anthropicKey = Get-Secreto 'ANTHROPIC_API_KEY'
$sonarToken = Get-Secreto 'SONAR_TOKEN'
$chatWebhook = Get-Secreto 'CHAT_WEBHOOK_URL'
Ok 'Secretos disponibles'

# ---------------------------------------------------------------------------
Paso "Creando el repositorio $Repo desde la plantilla"
Gh repo edit $Plantilla --template *> $null
Gh repo create $Repo --public --template $Plantilla --description "Proyecto con pipeline DevSecOps e IA"

# La copia desde la plantilla es asíncrona: se espera a que exista la rama main.
$listo = $false
for ($i = 0; $i -lt 30 -and -not $listo; $i++) {
  Start-Sleep -Seconds 2
  & gh api "repos/$Repo/branches/main" --silent *> $null
  $listo = ($LASTEXITCODE -eq 0)
}
if (-not $listo) { throw 'La rama main no apareció a tiempo en el repositorio nuevo.' }
Ok "Repositorio creado: https://github.com/$Repo"

# ---------------------------------------------------------------------------
Paso 'Configurando secretos del repositorio'
Gh secret set ANTHROPIC_API_KEY --repo $Repo --body $anthropicKey
Gh secret set SONAR_TOKEN --repo $Repo --body $sonarToken
Gh secret set CHAT_WEBHOOK_URL --repo $Repo --body $chatWebhook
Ok 'ANTHROPIC_API_KEY, SONAR_TOKEN y CHAT_WEBHOOK_URL'

# ---------------------------------------------------------------------------
Paso 'Creando etiquetas y ambientes'
Gh label create claude-dev --repo $Repo --color 0E8A16 --description 'Historia lista para desarrollo con IA' --force
Gh label create needs-human --repo $Repo --color D93F0B --description 'Requiere revisión humana' --force
Ok 'Etiquetas claude-dev y needs-human'
Gh api -X PUT "repos/$Repo/environments/dev" --silent
Gh api -X PUT "repos/$Repo/environments/qa" --silent
Ok 'Ambientes dev y qa'

# ---------------------------------------------------------------------------
Paso "Creando el proyecto $SonarKey en SonarQube Cloud"
$sonarHeaders = @{ Authorization = "Bearer $sonarToken" }
try {
  Invoke-RestMethod -Method Post -Uri 'https://sonarcloud.io/api/projects/create' -Headers $sonarHeaders -Body @{
    organization = $SonarOrg; project = $SonarKey; name = $Nombre; visibility = 'public'
  } | Out-Null
  Ok 'Proyecto creado'
} catch {
  throw "No se pudo crear el proyecto en SonarQube Cloud: $($_.Exception.Message)"
}
try {
  # Los proyectos nuevos nacen con la rama principal llamada "master"; se alinea con "main".
  Invoke-RestMethod -Method Post -Uri 'https://sonarcloud.io/api/project_branches/rename' -Headers $sonarHeaders -Body @{
    project = $SonarKey; name = 'main'
  } | Out-Null
  Ok 'Rama principal configurada como main'
} catch {
  Write-Host '    [AVISO] No se pudo renombrar la rama principal; revísalo en SonarQube Cloud.' -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
Paso 'Configurando sonar-project.properties para el proyecto nuevo'
$dir = Join-Path $env:TEMP "nuevo-proyecto-$Nombre"
if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
Gh repo clone $Repo $dir -- --quiet
$archivo = Join-Path $dir 'sonar-project.properties'
$contenido = [IO.File]::ReadAllText($archivo)
$contenido = $contenido -replace '(?m)^sonar\.organization=.*$', "sonar.organization=$SonarOrg"
$contenido = $contenido -replace '(?m)^sonar\.projectKey=.*$', "sonar.projectKey=$SonarKey"
$contenido = $contenido -replace '(?m)^sonar\.projectName=.*$', "sonar.projectName=$Nombre"
[IO.File]::WriteAllText($archivo, $contenido, (New-Object Text.UTF8Encoding $false))
git -C $dir add sonar-project.properties
git -C $dir commit -m "Configurar SonarQube para $Nombre" --quiet
git -C $dir push --quiet
if ($LASTEXITCODE -ne 0) { throw 'No se pudo subir la configuración de SonarQube.' }
Remove-Item $dir -Recurse -Force
Ok 'Configuración subida a main (esto dispara el primer pipeline)'

# ---------------------------------------------------------------------------
Paso 'Protegiendo main con los quality gates obligatorios'
$checks = @(
  'TDD verificado',
  'Integridad de pruebas de aceptación',
  'Secretos en el código (Gitleaks)',
  'Análisis estático (ESLint)',
  'Pruebas unitarias y cobertura (Jest)',
  'Seguridad de dependencias (OSV-Scanner) / osv-scan',
  'Calidad de código (SonarQube Cloud)',
  'Build, escaneo y registro de imagen',
  'DEV - Despliegue y smoke',
  'QA - Despliegue y pruebas E2E'
)
$ruleset = @{
  name        = 'Proteger main'
  target      = 'branch'
  enforcement = 'active'
  conditions  = @{ ref_name = @{ include = @('~DEFAULT_BRANCH'); exclude = @() } }
  rules       = @(
    @{ type = 'deletion' },
    @{ type = 'non_fast_forward' },
    @{ type = 'pull_request'; parameters = @{
        required_approving_review_count   = 0
        dismiss_stale_reviews_on_push     = $false
        require_code_owner_review         = $false
        require_last_push_approval        = $false
        required_review_thread_resolution = $false
      } },
    @{ type = 'required_status_checks'; parameters = @{
        strict_required_status_checks_policy = $false
        required_status_checks = @($checks | ForEach-Object { @{ context = $_ } })
      } }
  )
}
$rulesetFile = Join-Path $env:TEMP "ruleset-$Nombre.json"
[IO.File]::WriteAllText($rulesetFile, ($ruleset | ConvertTo-Json -Depth 10), (New-Object Text.UTF8Encoding $false))
Gh api -X POST "repos/$Repo/rulesets" --input $rulesetFile --silent
Remove-Item $rulesetFile -Force
Ok "Ruleset activo con $($checks.Count) quality gates obligatorios"

# ---------------------------------------------------------------------------
$duracion = [int]((Get-Date) - $inicio).TotalSeconds
Write-Host "`nProyecto listo en $duracion segundos." -ForegroundColor Green
Write-Host "  Repositorio:  https://github.com/$Repo"
Write-Host "  Pipeline:     https://github.com/$Repo/actions"
Write-Host "  SonarQube:    https://sonarcloud.io/project/overview?id=$SonarKey"
Write-Host "`nPara empezar: crea un Issue con una historia de usuario y agrégale la etiqueta claude-dev."
