function Update-Imports ($Directory, $ExtraDepth) {
    Write-Host "Updating imports in $Directory with ExtraDepth=$ExtraDepth"
    $files = Get-ChildItem -Path $Directory -Filter "*.ts" -Recurse
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        
        $depthPrefix = "../" * $ExtraDepth
        
        # Environment
        $content = $content -replace "'\.\./\.\./environments/", "'$($depthPrefix)../../environments/"
        $content = $content -replace "'\.\./\.\./\.\./environments/", "'$($depthPrefix)../../../environments/"
        
        # Services
        $content = $content -replace "'\.\./\.\./\.\./services/", "'$($depthPrefix)../../../core/services/"
        $content = $content -replace "'\.\./\.\./services/", "'$($depthPrefix)../../core/services/"
        $content = $content -replace "'\.\./services/", "'$($depthPrefix)../core/services/"
        
        # Guards
        $content = $content -replace "'\.\./\.\./guards/", "'$($depthPrefix)../../core/guards/"
        $content = $content -replace "'\.\./guards/", "'$($depthPrefix)../core/guards/"
        
        # Models
        $content = $content -replace "'\.\./\.\./models'", "'$($depthPrefix)../../core/models'"
        $content = $content -replace "'\.\./models'", "'$($depthPrefix)../core/models'"
        
        # Utils
        $content = $content -replace "'\.\./utils/", "'$($depthPrefix)../core/utils/"
        
        if ($content -ne $originalContent) {
            Write-Host "  Fixed: $($file.FullName)"
            $content | Set-Content $file.FullName
        }
    }
}

# Pages moved deeper (1 extra level)
Update-Imports "src/app/pages" 1

# Components moved deeper
Update-Imports "src/app/components/layout" 1
Update-Imports "src/app/components/common" 1

# Core
Update-Imports "src/app/core" 0
