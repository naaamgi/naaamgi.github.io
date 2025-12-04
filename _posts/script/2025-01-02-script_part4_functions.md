---
title: "쉘 스크립트 Part 4: 함수 - 사용자 정의 함수와 라이브러리"
excerpt: "사용자 정의 함수 작성법, 매개변수 전달, 함수 라이브러리를 학습합니다"
categories: ['script']
typora-root-url: ../../
published: true
date: 2025-01-02
tags: [linux, shell, script, bash, function, 함수, library, source]
---

## 개요

함수는 코드의 재사용성을 높이고 스크립트를 모듈화하는 핵심 기능입니다. 이 문서에서는 사용자 정의 함수 작성법, 매개변수 전달, 반환값 처리, 그리고 함수 라이브러리를 만들어 여러 스크립트에서 공유하는 방법을 학습합니다.

## 1. 함수 기본 개념

### 1.1 함수란?

bash shell에서는 C언어와 비슷한 형태의 함수를 선언하여 사용할 수 있습니다.

**함수의 장점:**
- **코드 재사용**: 같은 코드를 여러 번 작성할 필요 없음
- **모듈화**: 복잡한 스크립트를 작은 단위로 분리
- **가독성 향상**: 코드의 의도를 명확하게 표현
- **유지보수 용이**: 수정 시 한 곳만 변경하면 됨

### 1.2 함수 선언 방법

```bash
# 방법 1: function 키워드 사용
function 함수명() {
    명령어
}

# 방법 2: function 생략 (권장)
함수명() {
    명령어
}
```

**중요:** `function` 키워드는 생략 가능하며, 일반적으로 생략한 형태를 많이 사용합니다.

### 1.3 함수 호출

```bash
#!/bin/bash

# 함수 정의
hello() {
    echo "Hello, World!"
}

# 함수 호출
hello
```

**주의사항:**
- 함수는 **정의된 후에** 호출해야 함
- 함수명만 적으면 호출됨 (괄호 필요 없음)

---

## 2. 함수 매개변수

### 2.1 매개변수 전달

함수 호출 시 공백으로 구분하여 인자를 전달합니다.

```bash
#!/bin/bash

greet() {
    echo "안녕하세요, $1님!"
}

# 함수 호출 시 매개변수 전달
greet "홍길동"
# 출력: 안녕하세요, 홍길동님!
```

### 2.2 매개변수 위치 변수

| 변수 | 의미 |
|------|------|
| `$0` | 스크립트 이름 (함수 내에서는 스크립트명) |
| `$1, $2, ...` | 첫 번째, 두 번째 매개변수 |
| `$#` | 매개변수 개수 |
| `$@` | 모든 매개변수 (공백으로 구분) |
| `$*` | 모든 매개변수 (하나의 문자열) |

**예제:**
```bash
#!/bin/bash

sum_two_numbers() {
    local num1=$1
    local num2=$2
    local result=$((num1 + num2))
    echo "$num1 + $num2 = $result"
}

sum_two_numbers 5 7
# 출력: 5 + 7 = 12
```

### 2.3 매개변수 개수 확인

```bash
#!/bin/bash

print_args() {
    echo "함수명: ${FUNCNAME[0]}"
    echo "매개변수 개수: $#"
    echo "모든 매개변수: $@"

    local i=1
    for arg in "$@"
    do
        echo "  인자 $i: $arg"
        i=$((i + 1))
    done
}

print_args apple banana cherry
```

---

## 3. 함수 반환값

### 3.1 return 명령어

bash 함수는 `return` 명령어로 **종료 상태 코드**(0-255)를 반환합니다.

```bash
#!/bin/bash

is_even() {
    local num=$1
    if [ $((num % 2)) -eq 0 ]; then
        return 0  # 짝수 (성공)
    else
        return 1  # 홀수 (실패)
    fi
}

# 함수 호출 후 반환값 확인
is_even 10
if [ $? -eq 0 ]; then
    echo "짝수입니다"
else
    echo "홀수입니다"
fi
```

**중요:**
- `return`은 0-255 범위의 정수만 반환 가능
- `$?` 변수로 직전 함수의 반환값 확인
- 0은 성공, 그 외는 실패를 의미

### 3.2 echo를 이용한 값 반환

실제 값을 반환하려면 `echo`와 명령 치환을 사용합니다.

```bash
#!/bin/bash

get_sum() {
    local num1=$1
    local num2=$2
    local sum=$((num1 + num2))
    echo $sum  # 값 출력
}

# 명령 치환으로 반환값 받기
result=$(get_sum 10 20)
echo "결과: $result"
# 출력: 결과: 30
```

**예제: 파일 크기 확인 함수**
```bash
#!/bin/bash

get_file_size() {
    local file=$1
    if [ -f "$file" ]; then
        local size=$(du -h "$file" | cut -f1)
        echo "$size"
    else
        echo "0"
    fi
}

size=$(get_file_size "/etc/passwd")
echo "파일 크기: $size"
```

---

## 4. 지역 변수와 전역 변수

### 4.1 지역 변수 (local)

함수 내에서만 유효한 변수는 `local` 키워드로 선언합니다.

```bash
#!/bin/bash

test_scope() {
    local local_var="지역 변수"
    global_var="전역 변수"

    echo "함수 내부:"
    echo "  local_var: $local_var"
    echo "  global_var: $global_var"
}

test_scope

echo ""
echo "함수 외부:"
echo "  local_var: $local_var"      # 출력 안됨 (빈 값)
echo "  global_var: $global_var"    # 출력됨
```

**권장사항:**
- 함수 내 변수는 가능한 `local`로 선언
- 전역 변수 오염 방지

### 4.2 전역 변수

함수 밖에서 선언하거나 `export`로 선언한 변수는 전역 변수가 됩니다.

```bash
#!/bin/bash

# 전역 변수
BACKUP_DIR="/backup"
LOG_FILE="/var/log/script.log"

backup_files() {
    # 전역 변수 사용
    echo "백업 디렉토리: $BACKUP_DIR"
    echo "로그 파일: $LOG_FILE"
}

backup_files
```

---

## 5. 실전 함수 예제

### 5.1 에러 메시지 출력 함수

```bash
#!/bin/bash

# 에러 메시지 출력 후 종료
error_exit() {
    echo "[ERROR] $1" >&2
    exit 1
}

# 경고 메시지 출력
warn() {
    echo "[WARN] $1" >&2
}

# 정보 메시지 출력
info() {
    echo "[INFO] $1"
}

# 사용 예시
if [ ! -f "/etc/passwd" ]; then
    error_exit "/etc/passwd 파일이 없습니다"
fi

info "스크립트 시작"
warn "테스트 모드로 실행 중"
```

### 5.2 파일 존재 확인 함수

```bash
#!/bin/bash

check_file() {
    local file=$1
    if [ ! -f "$file" ]; then
        echo "오류: $file 파일이 존재하지 않습니다" >&2
        return 1
    fi
    return 0
}

# 사용 예시
if check_file "/etc/passwd"; then
    echo "파일이 존재합니다"
    cat /etc/passwd
fi
```

### 5.3 포트 스캔 함수

PDF의 포트 스캔 예제를 함수로 구현:

```bash
#!/bin/bash

# 호스트의 주어진 포트에 TCP로 연결하는 방법
# bash에서는 TCP에 연결할 때 /dev/tcp/... 형태의 특별한 파일 이름을 사용

scan_port() {
    local host=$1
    local port=$2

    # /dev/tcp를 이용한 포트 스캔
    if echo > /dev/null 2>&1 < /dev/tcp/${host}/${port}; then
        echo "포트 $port: 열림"
        return 0
    else
        return 1
    fi
}

# 포트 범위 스캔
scan_ports() {
    local host=$1
    local start_port=$2
    local end_port=$3

    echo "=== $host 포트 스캔 ==="

    for (( port=$start_port; port<=$end_port; port++ ))
    do
        scan_port $host $port
    done
}

# 사용 예시
scan_ports 192.168.10.130 20 25
```

**완전한 포트 스캔 스크립트:**
```bash
#!/bin/bash

scan() {
    local host=$1
    echo "=== IP: $host ==="

    for (( port=20; port<=25; port++ ))
    do
        if echo > /dev/null 2>&1 < /dev/tcp/${host}/${port}; then
            echo "열린 포트: $port"
        fi
    done
}

# 실행
scan 192.168.10.130
```

### 5.4 시스템 정보 수집 함수

```bash
#!/bin/bash

get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
}

get_memory_usage() {
    free | grep Mem | awk '{printf "%.2f", $3/$2 * 100}'
}

get_disk_usage() {
    df -h / | tail -1 | awk '{print $5}'
}

# 시스템 상태 리포트
system_report() {
    echo "=========================================="
    echo "시스템 상태 리포트 - $(date)"
    echo "=========================================="
    echo "CPU 사용률: $(get_cpu_usage)%"
    echo "메모리 사용률: $(get_memory_usage)%"
    echo "디스크 사용률: $(get_disk_usage)"
    echo "=========================================="
}

system_report
```

### 5.5 백업 함수

```bash
#!/bin/bash

backup_directory() {
    local source=$1
    local dest=$2
    local date=$(date +%Y%m%d_%H%M%S)
    local basename=$(basename "$source")
    local backup_file="${dest}/${basename}_${date}.tar.gz"

    if [ ! -d "$source" ]; then
        echo "오류: $source 디렉토리가 없습니다" >&2
        return 1
    fi

    mkdir -p "$dest"

    echo "백업 중: $source"
    if tar -czf "$backup_file" "$source" 2>/dev/null; then
        local size=$(du -h "$backup_file" | cut -f1)
        echo "✓ 백업 성공: $backup_file ($size)"
        return 0
    else
        echo "✗ 백업 실패" >&2
        return 1
    fi
}

# 사용 예시
backup_directory "/home/user/documents" "/backup"
```

---

## 6. 함수 라이브러리

### 6.1 라이브러리 만들기

자주 사용되는 함수들을 라이브러리 파일로 만들어 재사용할 수 있습니다.

**funcLibrary.sh 작성:**
```bash
#!/bin/bash
# funcLibrary.sh - 공용 함수 라이브러리

# 두 수의 합
addnum() {
    echo $(($1 + $2))
}

# 두 수의 곱
mulnum() {
    echo $(($1 * $2))
}

# 로그 메시지 출력
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

# 파일 존재 확인
check_file_exists() {
    local file=$1
    if [ -f "$file" ]; then
        return 0
    else
        log_error "파일이 존재하지 않습니다: $file"
        return 1
    fi
}

# root 권한 확인
require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "이 스크립트는 root 권한이 필요합니다"
        exit 1
    fi
}
```

### 6.2 라이브러리 사용하기

`source` 명령어를 이용해 라이브러리 파일을 불러옵니다.

**sample.sh 작성:**
```bash
#!/bin/bash

# 라이브러리 불러오기
source ./funcLibrary.sh

# 또는
# . ./funcLibrary.sh

# 함수 사용
log_info "스크립트 시작"

n1=10
n2=20

result=$(addnum $n1 $n2)
log_info "덧셈 결과: $result"

result=$(mulnum $n1 $n2)
log_info "곱셈 결과: $result"

# 파일 확인
if check_file_exists "/etc/passwd"; then
    log_info "/etc/passwd 파일이 존재합니다"
fi

log_info "스크립트 종료"
```

**실행:**
```bash
chmod +x sample.sh
./sample.sh
```

### 6.3 라이브러리 경로 설정

라이브러리를 특정 디렉토리에 모아두고 사용:

```bash
#!/bin/bash

# 라이브러리 디렉토리 설정
LIB_DIR="/usr/local/lib/shell"

# 라이브러리 불러오기
source "${LIB_DIR}/funcLibrary.sh"
source "${LIB_DIR}/network_utils.sh"
source "${LIB_DIR}/file_utils.sh"

# 함수 사용
log_info "시스템 체크 시작"
```

### 6.4 실전 라이브러리 예제

**logger.sh - 로깅 라이브러리:**
```bash
#!/bin/bash
# logger.sh - 로깅 유틸리티

LOG_FILE="/var/log/script.log"
LOG_LEVEL="INFO"  # DEBUG, INFO, WARN, ERROR

_log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_debug() {
    [ "$LOG_LEVEL" = "DEBUG" ] && _log "DEBUG" "$@"
}

log_info() {
    _log "INFO" "$@"
}

log_warn() {
    _log "WARN" "$@"
}

log_error() {
    _log "ERROR" "$@" >&2
}
```

**file_utils.sh - 파일 유틸리티:**
```bash
#!/bin/bash
# file_utils.sh - 파일 처리 유틸리티

# 파일 백업
backup_file() {
    local file=$1
    local backup="${file}.bak.$(date +%Y%m%d_%H%M%S)"

    if [ -f "$file" ]; then
        cp "$file" "$backup"
        echo "백업 완료: $backup"
        return 0
    else
        echo "파일이 없습니다: $file" >&2
        return 1
    fi
}

# 디렉토리 크기
get_dir_size() {
    local dir=$1
    du -sh "$dir" 2>/dev/null | cut -f1
}

# 파일 개수
count_files() {
    local dir=$1
    local pattern=${2:-*}
    find "$dir" -type f -name "$pattern" | wc -l
}
```

**사용 예시:**
```bash
#!/bin/bash

source ./logger.sh
source ./file_utils.sh

log_info "백업 스크립트 시작"

if backup_file "/etc/passwd"; then
    log_info "백업 성공"
else
    log_error "백업 실패"
    exit 1
fi

log_info "/home 디렉토리 크기: $(get_dir_size /home)"
log_info "텍스트 파일 개수: $(count_files /home '*.txt')"

log_info "스크립트 종료"
```

---

## 7. 고급 함수 기법

### 7.1 재귀 함수

```bash
#!/bin/bash

# 팩토리얼 계산
factorial() {
    local n=$1

    if [ $n -le 1 ]; then
        echo 1
    else
        local prev=$(factorial $((n - 1)))
        echo $((n * prev))
    fi
}

result=$(factorial 5)
echo "5! = $result"
# 출력: 5! = 120
```

### 7.2 함수 오버로딩 (매개변수 개수로 구분)

```bash
#!/bin/bash

greet() {
    if [ $# -eq 0 ]; then
        echo "안녕하세요!"
    elif [ $# -eq 1 ]; then
        echo "안녕하세요, $1님!"
    else
        echo "안녕하세요, $1님과 $2님!"
    fi
}

greet
greet "홍길동"
greet "홍길동" "김철수"
```

### 7.3 배열을 함수에 전달

```bash
#!/bin/bash

sum_array() {
    local arr=("$@")
    local sum=0

    for num in "${arr[@]}"
    do
        sum=$((sum + num))
    done

    echo $sum
}

numbers=(10 20 30 40 50)
result=$(sum_array "${numbers[@]}")
echo "합계: $result"
# 출력: 합계: 150
```

### 7.4 함수 존재 여부 확인

```bash
#!/bin/bash

function_exists() {
    declare -f "$1" > /dev/null
    return $?
}

my_function() {
    echo "함수 실행"
}

if function_exists "my_function"; then
    echo "my_function이 존재합니다"
    my_function
fi

if ! function_exists "non_existent"; then
    echo "non_existent 함수가 없습니다"
fi
```

---

## 8. 종합 예제

### 예제 1: 시스템 관리 라이브러리

**sysadmin.sh:**
```bash
#!/bin/bash
# sysadmin.sh - 시스템 관리 함수 모음

# 서비스 상태 확인
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        echo "✓ $service 서비스 실행 중"
        return 0
    else
        echo "✗ $service 서비스 중지됨"
        return 1
    fi
}

# 포트 사용 여부 확인
is_port_open() {
    local port=$1
    if netstat -tuln | grep -q ":${port} "; then
        echo "포트 $port 사용 중"
        return 0
    else
        echo "포트 $port 사용 가능"
        return 1
    fi
}

# 디스크 공간 경고
check_disk_space() {
    local threshold=${1:-80}
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ $usage -ge $threshold ]; then
        echo "경고! 디스크 사용률: ${usage}% (임계값: ${threshold}%)"
        return 1
    else
        echo "디스크 사용률 정상: ${usage}%"
        return 0
    fi
}

# 프로세스 존재 확인
is_process_running() {
    local process=$1
    if pgrep -x "$process" > /dev/null; then
        echo "$process 프로세스 실행 중"
        return 0
    else
        echo "$process 프로세스 없음"
        return 1
    fi
}
```

### 예제 2: 웹 서버 상태 체크 스크립트

```bash
#!/bin/bash

source ./sysadmin.sh
source ./logger.sh

health_check() {
    log_info "=== 웹 서버 헬스 체크 시작 ==="

    # Apache 서비스 확인
    if check_service httpd; then
        log_info "Apache 서비스 정상"
    else
        log_error "Apache 서비스 중지됨"
        systemctl start httpd
        log_info "Apache 서비스 시작 시도"
    fi

    # 80번 포트 확인
    if is_port_open 80; then
        log_info "웹 서버 포트 정상"
    else
        log_warn "80번 포트가 닫혀있습니다"
    fi

    # 디스크 공간 확인
    if check_disk_space 90; then
        log_info "디스크 공간 충분"
    else
        log_error "디스크 공간 부족"
    fi

    log_info "=== 헬스 체크 완료 ==="
}

# 메인 실행
health_check
```

---

## 주요 개념 요약

| 항목 | 설명 | 예시 |
|------|------|------|
| **함수 정의** | `함수명() { 명령어; }` | `hello() { echo "Hi"; }` |
| **함수 호출** | 함수명만 적기 | `hello` |
| **매개변수** | `$1, $2, ...` | `greet() { echo "$1"; }` |
| **반환값** | `return 0-255` | `return 0` (성공) |
| **값 반환** | `echo` 사용 | `echo $result` |
| **지역 변수** | `local 변수명` | `local count=0` |
| **라이브러리** | `source 파일명` | `source ./lib.sh` |

## 학습 포인트

### 1. 함수 vs 스크립트
- **함수**: 같은 파일 내에서 재사용
- **스크립트**: 별도 파일로 독립 실행

### 2. return vs echo
- **return**: 종료 상태 코드 (0-255)
- **echo**: 실제 데이터 반환

### 3. 라이브러리 관리
- 공통 함수는 라이브러리로 분리
- `source` 또는 `.`로 불러오기
- 라이브러리 경로는 변수로 관리

### 4. 실무 팁

**함수 네이밍:**
```bash
# 동사로 시작 (권장)
get_user_info()
check_file()
create_backup()

# 명사형 (피하기)
user_info()
file()
```

**에러 처리:**
```bash
safe_function() {
    # 파라미터 검증
    if [ $# -lt 1 ]; then
        echo "사용법: safe_function <param>" >&2
        return 1
    fi

    # 작업 수행
    # ...

    return 0
}
```

**문서화:**
```bash
# 함수 설명을 주석으로 추가
# 함수명: backup_directory
# 설명: 디렉토리를 tar.gz로 백업
# 인자:
#   $1 - 백업할 디렉토리
#   $2 - 백업 저장 위치
# 반환값:
#   0 - 성공
#   1 - 실패
backup_directory() {
    # 구현
}
```

---

## 마무리

함수는 쉘 스크립트를 전문적으로 작성하는 핵심 기술입니다. 함수를 활용하면 코드의 재사용성, 가독성, 유지보수성이 크게 향상됩니다.

특히 **함수 라이브러리**를 구축하면 여러 프로젝트에서 검증된 코드를 재사용할 수 있어 개발 생산성이 높아집니다. 실무에서는 로깅, 에러 처리, 파일 관리, 네트워크 체크 등의 공통 함수를 라이브러리로 만들어 사용합니다.

다음 Part에서는 배열과 문자열 연산을 학습하여 더 복잡한 데이터 처리 방법을 배웁니다.
