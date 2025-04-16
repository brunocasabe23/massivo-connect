# Script para renombrar el archivo de migración con fecha futura
# Ejecutar este script desde la raíz del proyecto

# Obtener la fecha actual en formato YYYYMMDDHHMMSS
$currentDate = Get-Date -Format "yyyyMMddHHmmss"

# Ruta del archivo de migración con fecha futura
$oldMigrationPath = "packages\backend\migrations\20250327220300-initial-schema.ts"

# Nueva ruta con la fecha actual
$newMigrationPath = "packages\backend\migrations\$currentDate-initial-schema.ts"

# Verificar si el archivo existe
if (Test-Path $oldMigrationPath) {
    # Renombrar el archivo
    Rename-Item -Path $oldMigrationPath -NewName $newMigrationPath
    Write-Host "Archivo de migración renombrado exitosamente:"
    Write-Host "  De: 20250327220300-initial-schema.ts"
    Write-Host "  A: $currentDate-initial-schema.ts"
} else {
    Write-Host "El archivo de migración no existe: $oldMigrationPath"
}
