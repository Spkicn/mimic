<#
.SYNOPSIS
  Install the mimic skill into a DSH, Claude Code, or project-local skills directory.

.EXAMPLE
  ./install.ps1
  Install to ~/.dsh/skills (DSH user scope, the default).

.EXAMPLE
  ./install.ps1 -Target claude
  Install to ~/.claude/skills.

.EXAMPLE
  ./install.ps1 -Target project-dsh -ProjectPath C:\code\myapp
  Install to <project>/.dsh/skills so it travels with the repository.

.EXAMPLE
  ./install.ps1 -List
  Show what would be installed without writing anything.
#>
[CmdletBinding()]
param(
    [ValidateSet('dsh', 'claude', 'project-dsh', 'project-claude')]
    [string]$Target = 'dsh',
    [string]$ProjectPath = '.',
    [switch]$Force,
    [switch]$List
)

$ErrorActionPreference = 'Stop'
$sourceRoot = Join-Path $PSScriptRoot 'skills'

if (-not (Test-Path $sourceRoot)) {
    throw "skills/ not found next to this script (looked in $sourceRoot)"
}

$destRoot = switch ($Target) {
    'dsh'             { Join-Path $HOME '.dsh/skills' }
    'claude'          { Join-Path $HOME '.claude/skills' }
    'project-dsh'     { Join-Path (Resolve-Path $ProjectPath) '.dsh/skills' }
    'project-claude'  { Join-Path (Resolve-Path $ProjectPath) '.claude/skills' }
}

$skills = Get-ChildItem -Path $sourceRoot -Directory
if (-not $skills) { throw "no skill directories found in $sourceRoot" }

if ($List) {
    Write-Host "source : $sourceRoot"
    Write-Host "target : $destRoot  ($Target)"
    foreach ($s in $skills) { Write-Host "  - $($s.Name)" }
    return
}

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

foreach ($skill in $skills) {
    $dest = Join-Path $destRoot $skill.Name
    if (Test-Path $dest) {
        if (-not $Force) {
            Write-Host "skip   $($skill.Name)  (already installed; pass -Force to overwrite)"
            continue
        }
        Remove-Item -Recurse -Force $dest
    }
    Copy-Item -Recurse -Force $skill.FullName $dest
    Write-Host "install $($skill.Name) -> $dest"
}

Write-Host ""
Write-Host "Done. Restart the agent session (or start a new one) so the skill catalog is re-read."
