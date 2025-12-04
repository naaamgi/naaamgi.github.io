---
title: "쉘 스크립트 Part 3: 제어문 - if, case, for, while, until"
excerpt: "쉘 스크립트의 조건문과 반복문, 흐름 제어를 학습합니다"
categories: ['script']
typora-root-url: ../../
published: true
date: 2025-01-02
tags: [linux, shell, script, bash, if, case, for, while, until, 제어문, 반복문]
---

## 개요

쉘 스크립트의 제어문은 프로그램의 흐름을 제어하는 핵심 요소입니다. 이 문서에서는 조건문(if, case)과 반복문(for, while, until), 그리고 흐름 제어(continue, break)를 학습합니다. 이를 통해 복잡한 로직을 구현하고 자동화 스크립트를 작성할 수 있습니다.

## 1. if 문

### 1.1 기본 구조

쉘 프로그램은 라인(행) 단위로 해석되므로 각각 다른 라인에 작성해야 하지만 `;`을 사용해 라인의 끝을 인식시킬 수 있습니다.

**기본 형식:**
```bash
if [ 조건 ]; then
    명령어
fi
```

**중요:** if로 시작해서 **fi로 닫아주는 것**이 중요합니다.

### 1.2 if ~ else 문

```bash
if [ 조건 ]; then
    명령어1
else
    명령어2
fi
```

### 1.3 if ~ elif ~ else 문

```bash
if [ 조건1 ]; then
    명령어1
elif [ 조건2 ]; then
    명령어2
else
    명령어3
fi
```

### 1.4 실전 예제

**예제 1: 숫자 비교**
```bash
#!/bin/bash

read -p "숫자를 입력하세요: " num

if [ $num -gt 0 ]; then
    echo "양수입니다"
elif [ $num -lt 0 ]; then
    echo "음수입니다"
else
    echo "0입니다"
fi
```

**예제 2: 파일 존재 확인**
```bash
#!/bin/bash

read -p "파일명을 입력하세요: " filename

if [ -f "$filename" ]; then
    echo "$filename 파일이 존재합니다"
    ls -lh "$filename"
else
    echo "$filename 파일이 존재하지 않습니다"
fi
```

**예제 3: 사용자 권한 확인**
```bash
#!/bin/bash

if [ "$(id -u)" -eq 0 ]; then
    echo "root 권한으로 실행 중입니다"
else
    echo "일반 사용자 권한입니다"
    echo "root 권한이 필요합니다"
    exit 1
fi
```

### 1.5 한 줄 if 문

```bash
# 형식
[ 조건 ] && 참일_때_명령어 || 거짓일_때_명령어

# 예시
[ -f /etc/passwd ] && echo "파일 존재" || echo "파일 없음"
```

---

## 2. case 문

### 2.1 기본 구조

case문은 여러 조건을 처리할 때 if문보다 가독성이 좋습니다.

```bash
case 변수 in
    패턴1)
        명령어1
        ;;
    패턴2)
        명령어2
        ;;
    *)
        기본_명령어
        ;;
esac
```

**중요 포인트:**
- `exit`는 C언어에서 `break`와 같음, **`;;`로 세미콜론 두 개**로 닫아줌
- `*`는 C언어에서 `default`와 같음
- **case로 시작하고 esac으로 닫음** (case를 거꾸로)

### 2.2 실전 예제

**예제 1: 간단한 메뉴**
```bash
#!/bin/bash

echo "=== 메뉴 선택 ==="
echo "1. 파일 목록"
echo "2. 현재 디렉토리"
echo "3. 시스템 정보"
echo "4. 종료"

read -p "선택하세요 (1-4): " choice

case $choice in
    1)
        echo "=== 파일 목록 ==="
        ls -l
        ;;
    2)
        echo "=== 현재 디렉토리 ==="
        pwd
        ;;
    3)
        echo "=== 시스템 정보 ==="
        uname -a
        ;;
    4)
        echo "프로그램을 종료합니다"
        exit 0
        ;;
    *)
        echo "잘못된 선택입니다"
        ;;
esac
```

**예제 2: 파일 확장자 처리**
```bash
#!/bin/bash

read -p "파일명을 입력하세요: " filename

case "$filename" in
    *.txt)
        echo "텍스트 파일입니다"
        cat "$filename"
        ;;
    *.sh)
        echo "쉘 스크립트 파일입니다"
        chmod +x "$filename"
        echo "실행 권한을 부여했습니다"
        ;;
    *.log)
        echo "로그 파일입니다"
        tail -n 20 "$filename"
        ;;
    *)
        echo "알 수 없는 파일 형식입니다"
        ;;
esac
```

**예제 3: 다중 패턴 매칭**
```bash
#!/bin/bash

read -p "명령어를 입력하세요: " cmd

case "$cmd" in
    start|START|Start)
        echo "서비스를 시작합니다"
        ;;
    stop|STOP|Stop)
        echo "서비스를 중지합니다"
        ;;
    restart|RESTART|Restart)
        echo "서비스를 재시작합니다"
        ;;
    status|STATUS|Status)
        echo "서비스 상태를 확인합니다"
        ;;
    *)
        echo "사용법: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
```

---

## 3. for 문

### 3.1 기본 구조

for문은 지정된 목록의 각 항목에 대해 명령을 반복 실행합니다.

```bash
for 변수 in 값1 값2 값3
do
    명령어
done
```

**특징:**
- 반복문은 **in 다음에 나오는 변수의 값을 순차적으로** 변수에 대입 및 반복 실행
- 변수 값의 개수만큼 루프를 돌면서 **do 다음의 실행문을 실행**하고, **done으로 마무리**

### 3.2 seq를 이용한 범위 반복

```bash
# seq 명령어를 이용한 순차적 증가
for i in $(seq 1 10)
do
    echo "숫자: $i"
done
```

**seq 옵션:**
- `seq 시작값 끝값`: 시작값부터 끝값까지
- `seq 시작값 증가값 끝값`: 시작값부터 증가값만큼 증가하여 끝값까지

```bash
# 1부터 10까지 2씩 증가
for i in $(seq 1 2 10)
do
    echo "$i"
done
# 출력: 1 3 5 7 9
```

### 3.3 C 스타일 for 문

```bash
# 형식
for (( 초기값; 조건; 증가값 ))
do
    명령어
done

# 예시
for (( i=1; i<=10; i++ ))
do
    echo "$i"
done
```

### 3.4 실전 예제

**예제 1: 파일 목록 처리**
```bash
#!/bin/bash

echo "=== 현재 디렉토리의 .txt 파일 ==="

for file in *.txt
do
    if [ -f "$file" ]; then
        echo "파일: $file"
        echo "크기: $(du -h "$file" | cut -f1)"
        echo "---"
    fi
done
```

**예제 2: 디렉토리 백업**
```bash
#!/bin/bash

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d)

for dir in /home/user1 /home/user2 /home/user3
do
    if [ -d "$dir" ]; then
        echo "백업 중: $dir"
        tar -czf "${BACKUP_DIR}/$(basename $dir)_${DATE}.tar.gz" "$dir"
        echo "완료: $dir"
    else
        echo "디렉토리 없음: $dir"
    fi
done
```

**예제 3: 구구단 출력**
```bash
#!/bin/bash

read -p "구구단 단수를 입력하세요: " dan

echo "=== ${dan}단 ==="

for (( i=1; i<=9; i++ ))
do
    result=$((dan * i))
    echo "${dan} x ${i} = ${result}"
done
```

**예제 4: 여러 서버 Ping 테스트**
```bash
#!/bin/bash

servers="8.8.8.8 1.1.1.1 192.168.1.1"

for server in $servers
do
    echo "Testing $server..."
    if ping -c 1 -W 2 $server &> /dev/null; then
        echo "✓ $server is reachable"
    else
        echo "✗ $server is unreachable"
    fi
done
```

---

## 4. while 문

### 4.1 기본 구조

while문은 조건이 **참인 동안** 반복 실행합니다.

```bash
while [ 조건 ]
do
    명령어
done
```

### 4.2 실전 예제

**예제 1: 카운트다운**
```bash
#!/bin/bash

count=10

while [ $count -gt 0 ]
do
    echo "카운트다운: $count"
    sleep 1
    count=$((count - 1))
done

echo "완료!"
```

**예제 2: 파일 읽기**
```bash
#!/bin/bash

# 방법 1: while read 사용
while read line
do
    echo "라인: $line"
done < /etc/passwd

# 방법 2: 파일에서 특정 정보 추출
echo "=== 사용자 목록 ==="
while IFS=: read username password uid gid info home shell
do
    if [ $uid -ge 1000 ]; then
        echo "사용자: $username, UID: $uid, 홈: $home"
    fi
done < /etc/passwd
```

**예제 3: 무한 루프 (서비스 모니터링)**
```bash
#!/bin/bash

echo "서비스 모니터링 시작 (Ctrl+C로 종료)"

while true
do
    if systemctl is-active --quiet httpd; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Apache 서비스 정상"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Apache 서비스 중지됨! 재시작 시도..."
        systemctl start httpd
    fi
    sleep 60  # 60초 대기
done
```

**예제 4: 사용자 입력 검증**
```bash
#!/bin/bash

valid_input=0

while [ $valid_input -eq 0 ]
do
    read -p "1에서 10 사이의 숫자를 입력하세요: " num

    if [[ "$num" =~ ^[0-9]+$ ]]; then
        if [ $num -ge 1 ] && [ $num -le 10 ]; then
            echo "올바른 입력입니다: $num"
            valid_input=1
        else
            echo "범위를 벗어났습니다. 다시 시도하세요."
        fi
    else
        echo "숫자가 아닙니다. 다시 시도하세요."
    fi
done
```

---

## 5. until 문

### 5.1 기본 구조

until문은 while문과 반대로 조건이 **거짓인 동안** 반복 실행합니다. 조건이 참이 되면 종료됩니다.

```bash
until [ 조건 ]
do
    명령어
done
```

### 5.2 실전 예제

**예제 1: 파일 생성 대기**
```bash
#!/bin/bash

filename="/tmp/test.txt"

echo "파일 생성을 기다리는 중: $filename"

until [ -f "$filename" ]
do
    echo "대기 중..."
    sleep 2
done

echo "파일이 생성되었습니다!"
```

**예제 2: 서버 응답 대기**
```bash
#!/bin/bash

server="192.168.1.100"

echo "서버 응답 대기: $server"

until ping -c 1 -W 2 $server &> /dev/null
do
    echo "[$(date '+%H:%M:%S')] 서버 응답 없음, 재시도..."
    sleep 5
done

echo "서버가 응답합니다!"
```

**예제 3: 디스크 사용량 모니터링**
```bash
#!/bin/bash

threshold=80

echo "디스크 사용량 모니터링 시작 (임계값: ${threshold}%)"

until [ $(df / | tail -1 | awk '{print $5}' | sed 's/%//') -ge $threshold ]
do
    usage=$(df / | tail -1 | awk '{print $5}')
    echo "[$(date '+%H:%M:%S')] 현재 사용량: $usage"
    sleep 300  # 5분 대기
done

echo "경고! 디스크 사용량이 ${threshold}%를 초과했습니다!"
```

---

## 6. continue와 break

### 6.1 continue

**continue**는 현재 반복을 건너뛰고 다음 반복으로 이동합니다.

```bash
#!/bin/bash

for i in {1..10}
do
    # 짝수는 건너뛰기
    if [ $((i % 2)) -eq 0 ]; then
        continue
    fi
    echo "홀수: $i"
done

# 출력: 1, 3, 5, 7, 9
```

**예제: 특정 파일 제외하고 처리**
```bash
#!/bin/bash

for file in *
do
    # .git 디렉토리는 건너뛰기
    if [ "$file" = ".git" ]; then
        continue
    fi

    echo "처리 중: $file"
done
```

### 6.2 break

**break**는 반복문을 완전히 종료합니다.

```bash
#!/bin/bash

count=1

while true
do
    echo "카운트: $count"

    if [ $count -ge 5 ]; then
        echo "5에 도달하여 종료"
        break
    fi

    count=$((count + 1))
done
```

**예제: 특정 조건 만족 시 검색 중단**
```bash
#!/bin/bash

read -p "검색할 사용자명: " search_user

found=0

while IFS=: read username rest
do
    if [ "$username" = "$search_user" ]; then
        echo "사용자를 찾았습니다: $username"
        found=1
        break
    fi
done < /etc/passwd

if [ $found -eq 0 ]; then
    echo "사용자를 찾지 못했습니다: $search_user"
fi
```

### 6.3 sleep 명령어

**sleep**은 스크립트 실행을 일시 정지합니다.

```bash
# 형식
sleep 숫자[단위]

# 단위:
# s : 초 (기본값)
# m : 분
# h : 시간
# d : 일

# 예시
sleep 1      # 1초 대기
sleep 1s     # 1초 대기
sleep 1m     # 1분 대기
sleep 0.5    # 0.5초 대기
```

---

## 7. 종합 예제

### 예제 1: 시스템 모니터링 스크립트

```bash
#!/bin/bash

echo "=== 시스템 모니터링 스크립트 ==="
echo ""

while true
do
    clear
    echo "=========================================="
    echo "시스템 모니터링 - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    echo ""

    # CPU 사용률
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "CPU 사용률: ${cpu_usage}%"

    # 메모리 사용률
    mem_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100}')
    echo "메모리 사용률: ${mem_usage}%"

    # 디스크 사용률
    disk_usage=$(df / | tail -1 | awk '{print $5}')
    echo "디스크 사용률: $disk_usage"

    echo ""
    echo "다음 갱신까지 10초... (Ctrl+C로 종료)"
    sleep 10
done
```

### 예제 2: 백업 자동화 스크립트

```bash
#!/bin/bash

BACKUP_SOURCE="/home/user/important"
BACKUP_DEST="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

echo "=== 백업 스크립트 시작 ==="

# 백업 디렉토리 확인
if [ ! -d "$BACKUP_DEST" ]; then
    echo "백업 디렉토리 생성: $BACKUP_DEST"
    mkdir -p "$BACKUP_DEST"
fi

# 백업 실행
BACKUP_FILE="${BACKUP_DEST}/backup_${DATE}.tar.gz"

echo "백업 중: $BACKUP_SOURCE -> $BACKUP_FILE"

if tar -czf "$BACKUP_FILE" "$BACKUP_SOURCE" 2>/dev/null; then
    echo "✓ 백업 성공: $BACKUP_FILE"

    # 백업 파일 크기 확인
    size=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  백업 크기: $size"
else
    echo "✗ 백업 실패"
    exit 1
fi

# 오래된 백업 파일 삭제
echo ""
echo "오래된 백업 파일 정리 (${KEEP_DAYS}일 이상)"

find "$BACKUP_DEST" -name "backup_*.tar.gz" -type f -mtime +${KEEP_DAYS} | while read old_file
do
    echo "삭제: $old_file"
    rm -f "$old_file"
done

echo ""
echo "=== 백업 완료 ==="
```

### 예제 3: 사용자 관리 메뉴 스크립트

```bash
#!/bin/bash

while true
do
    clear
    echo "======================================"
    echo "        사용자 관리 시스템"
    echo "======================================"
    echo "1. 사용자 목록 보기"
    echo "2. 사용자 추가"
    echo "3. 사용자 삭제"
    echo "4. 사용자 정보 보기"
    echo "5. 종료"
    echo "======================================"
    read -p "선택하세요 (1-5): " choice

    case $choice in
        1)
            echo ""
            echo "=== 시스템 사용자 목록 ==="
            awk -F: '$3 >= 1000 {printf "%-15s UID: %-5s Home: %s\n", $1, $3, $6}' /etc/passwd
            ;;
        2)
            read -p "생성할 사용자명: " new_user
            if id "$new_user" &>/dev/null; then
                echo "오류: 이미 존재하는 사용자입니다"
            else
                sudo useradd -m "$new_user"
                sudo passwd "$new_user"
                echo "사용자 생성 완료: $new_user"
            fi
            ;;
        3)
            read -p "삭제할 사용자명: " del_user
            if id "$del_user" &>/dev/null; then
                read -p "정말 삭제하시겠습니까? (y/n): " confirm
                if [ "$confirm" = "y" ]; then
                    sudo userdel -r "$del_user"
                    echo "사용자 삭제 완료: $del_user"
                fi
            else
                echo "오류: 존재하지 않는 사용자입니다"
            fi
            ;;
        4)
            read -p "확인할 사용자명: " check_user
            if id "$check_user" &>/dev/null; then
                echo ""
                id "$check_user"
                echo ""
                grep "^${check_user}:" /etc/passwd
            else
                echo "오류: 존재하지 않는 사용자입니다"
            fi
            ;;
        5)
            echo "프로그램을 종료합니다"
            exit 0
            ;;
        *)
            echo "잘못된 선택입니다"
            ;;
    esac

    echo ""
    read -p "계속하려면 Enter를 누르세요..."
done
```

---

## 주요 개념 요약

| 제어문 | 용도 | 시작/종료 | 특징 |
|--------|------|----------|------|
| **if** | 조건 분기 | `if` ... `fi` | 조건이 참일 때 실행 |
| **case** | 다중 조건 분기 | `case` ... `esac` | 패턴 매칭, `;;`로 종료 |
| **for** | 목록 반복 | `for` ... `done` | 지정된 목록만큼 반복 |
| **while** | 조건 반복 (참) | `while` ... `done` | 조건이 참인 동안 반복 |
| **until** | 조건 반복 (거짓) | `until` ... `done` | 조건이 거짓인 동안 반복 |
| **continue** | 반복 건너뛰기 | - | 현재 반복을 건너뜀 |
| **break** | 반복 종료 | - | 반복문을 완전히 종료 |

## 학습 포인트

### 1. if vs case
- **if**: 복잡한 조건식, 범위 비교에 적합
- **case**: 고정된 값 매칭, 메뉴 선택에 적합

### 2. for vs while
- **for**: 반복 횟수가 정해진 경우
- **while**: 조건에 따라 반복 횟수가 가변적인 경우

### 3. while vs until
- **while**: "~하는 동안" (조건이 참일 때)
- **until**: "~할 때까지" (조건이 거짓일 때)

### 4. 실무 팁

**세미콜론(;) 활용:**
```bash
# 여러 줄을 한 줄로
if [ -f file.txt ]; then cat file.txt; fi

# 가독성을 위해 여러 줄 권장
if [ -f file.txt ]; then
    cat file.txt
fi
```

**무한 루프 작성:**
```bash
# 방법 1
while true; do
    # 작업
done

# 방법 2
while :; do
    # 작업
done

# 방법 3
for (( ; ; )); do
    # 작업
done
```

**안전한 스크립트 작성:**
```bash
#!/bin/bash

# 에러 시 즉시 종료
set -e

# 정의되지 않은 변수 사용 시 에러
set -u

# 파이프라인 에러 전파
set -o pipefail
```

---

## 마무리

쉘 스크립트의 제어문은 자동화의 핵심입니다. if와 case로 조건을 처리하고, for/while/until로 반복 작업을 수행하며, continue/break로 흐름을 제어할 수 있습니다.

실무에서는 **에러 처리**, **사용자 입력 검증**, **로그 기록**을 함께 구현하여 안정적인 스크립트를 작성해야 합니다. 다음 Part에서는 함수를 학습하여 코드 재사용성을 높이는 방법을 배웁니다.
