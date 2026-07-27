# fzf/fh/ff Setup Guide

Windows PowerShell과 Kali WSL에서 `fzf`, `fd`, `bat`를 조합해 히스토리 검색과 파일 미리보기를 빠르게 쓰기 위한 설정 가이드입니다.

## 구성

- `fh`: 명령 히스토리를 fuzzy 검색하고 선택한 명령을 입력줄에 삽입
- `ff`: 현재 디렉터리 기준 파일 검색, hidden 제외
- `ffh`: 현재 디렉터리 기준 파일 검색, hidden 포함
- `fpreview`: `ff` alias

`ff`와 `ffh`는 전체 디스크가 아니라 현재 위치 기준으로 찾습니다. 경로를 인자로 주면 해당 경로 기준으로 찾습니다.

```powershell
ff
ff C:\Pentest
ffh
ffh C:\Users\USER
```

## Windows 설치

```powershell
winget install --id junegunn.fzf -e --accept-package-agreements --accept-source-agreements
winget install --id sharkdp.bat -e --accept-package-agreements --accept-source-agreements
winget install --id sharkdp.fd -e --accept-package-agreements --accept-source-agreements

fzf --version
bat --version
fd --version
```

## Windows PowerShell 프로필

PowerShell 5.1:

```powershell
$PROFILE
# C:\Users\USER\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
```

PowerShell 7:

```powershell
$PROFILE
# C:\Users\USER\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
```

프로필 생성/열기:

```powershell
if (-not (Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
notepad $PROFILE
```

Windows preview helper 생성:

```powershell
$scriptDir = Join-Path $HOME 'Documents\PowerShell\Scripts'
New-Item -ItemType Directory -Path $scriptDir -Force | Out-Null
$cmdPath = Join-Path $scriptDir 'ff-preview.cmd'

$cmd = @(
    '@echo off',
    'where bat >nul 2>nul',
    'if %errorlevel%==0 (',
    '  bat --style=numbers --color=always -- "%~1"',
    ') else (',
    '  type "%~1"',
    ')'
)
Set-Content -LiteralPath $cmdPath -Value $cmd -Encoding ASCII
```

프로필 마지막에 추가:

```powershell
function fh {
    param([string]$Query = "")

    $historyPath = (Get-PSReadLineOption).HistorySavePath
    if (-not (Test-Path -LiteralPath $historyPath)) { return }

    $target = Get-Content -LiteralPath $historyPath |
        Select-Object -Unique |
        fzf --height 40% --layout=reverse --border --tac --query="$Query"

    if ($target) {
        [Microsoft.PowerShell.PSConsoleReadLine]::DeleteLine()
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert($target.Trim())
    }
}

function Invoke-FuzzyFilePreview {
    param(
        [string]$Path = ".",
        [switch]$Hidden
    )

    $fdArgs = @(
        '--type', 'f',
        '--color', 'never',
        '--path-separator', '/',
        '--exclude', '.git',
        '--exclude', 'node_modules',
        '--exclude', '.venv',
        '--exclude', '__pycache__',
        '--exclude', 'dist',
        '--exclude', 'build'
    )

    if ($Hidden) {
        $fdArgs += '--hidden'
        $fdArgs += '--exclude'
        $fdArgs += 'AppData'
        $fdArgs += '--exclude'
        $fdArgs += '.cache'
        $fdArgs += '--exclude'
        $fdArgs += '.antigravity-ide'
    }

    $fdArgs += '.'
    $fdArgs += $Path

    fd @fdArgs | fzf --height 80% --layout=reverse --border --preview "C:\Users\USER\Documents\PowerShell\Scripts\ff-preview.cmd {}" --preview-window=right:60%
}

function ff {
    param([string]$Path = ".")
    Invoke-FuzzyFilePreview -Path $Path
}

function ffh {
    param([string]$Path = ".")
    Invoke-FuzzyFilePreview -Path $Path -Hidden
}

Set-Alias fpreview ff
```

적용:

```powershell
. $PROFILE
```

## Kali WSL 설치

```bash
sudo apt-get update
sudo apt-get install -y fzf bat fd-find
sudo ln -sf /usr/bin/batcat /usr/local/bin/bat
sudo ln -sf /usr/bin/fdfind /usr/local/bin/fd
```

`~/.zshrc` 마지막에 추가:

```zsh
fh() {
  emulate -L zsh
  local selected

  selected=$(fc -lnr 1 | sed "s/^[[:space:]]*//" | fzf --height 40% --layout=reverse --border --query="$*") || return

  if [[ -n "$selected" ]]; then
    print -z -- "$selected"
  fi
}

_ff_run() {
  emulate -L zsh
  local include_hidden="$1"
  local base="${2:-.}"
  local -a fd_args

  fd_args=(
    --type f
    --color never
    --exclude .git
    --exclude node_modules
    --exclude .venv
    --exclude __pycache__
    --exclude dist
    --exclude build
  )

  if [[ "$include_hidden" == "1" ]]; then
    fd_args+=(--hidden --exclude .cache --exclude .antigravity-ide)
  fi

  fd "${fd_args[@]}" . "$base" | fzf --height 80% --layout=reverse --border --preview 'sh -c '"'"'if command -v bat >/dev/null 2>&1; then bat --style=numbers --color=always -- "$1"; else cat -- "$1"; fi'"'"' sh {}' --preview-window=right:60%
}

ff() {
  _ff_run 0 "${1:-.}"
}

ffh() {
  _ff_run 1 "${1:-.}"
}

alias fp=ff
alias fpreview=ff
```

적용:

```bash
source ~/.zshrc
```

## 사용법

```bash
fh rustscan
fh '/usr/share

ff
ffh
ff /usr/share/wordlists
ffh ~/.config
```

`fzf` 검색 문법:

```text
'문자열     정확히 포함
^문자열     해당 문자열로 시작
문자열$     해당 문자열로 끝
!문자열     해당 문자열 제외
```

## 검증

Windows:

```powershell
. $PROFILE
Get-Command fh,ff,ffh,fpreview
Get-Command fzf,bat,fd
```

Kali:

```bash
command -v fzf fd bat
zsh -n ~/.zshrc
zsh -ic 'whence -w fh; whence -w ff; whence -w ffh; whence -w fp; whence -w fpreview'
```

## 참고

- Kali/Debian의 `bat` 실행 파일명은 보통 `batcat`입니다.
- Kali/Debian의 `fd` 실행 파일명은 보통 `fdfind`입니다.
- `fd --strip-cwd-prefix`는 `[path]` 인자와 함께 사용할 수 없어 이 설정에서는 사용하지 않습니다.

