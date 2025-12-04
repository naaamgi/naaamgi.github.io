---
title: "쉘 스크립트 Part 5: 배열과 문자열 연산"
excerpt: "배열 선언, 요소 추가/삭제/검색, 문자열 연산을 학습합니다"
categories: ['script']
typora-root-url: ../../
published: true
date: 2025-01-02
tags: [linux, shell, script, bash, array, string, 배열, 문자열]
---

## 개요

배열과 문자열 연산은 복잡한 데이터를 효과적으로 처리하는 핵심 기능입니다. 이 문서에서는 배열 선언, 요소 추가/삭제/검색, 문자열 길이 계산, 치환, 슬라이싱 등 실무에서 자주 사용하는 고급 기법을 학습합니다.

## 1. 배열 (Arrays)

### 1.1 배열이란?

배열은 여러 값을 하나의 변수에 저장할 수 있는 자료구조입니다.

**배열의 특징:**
- 인덱스는 0부터 시작
- 크기가 고정되지 않음 (동적 확장 가능)
- 문자열과 숫자를 혼합하여 저장 가능

### 1.2 배열 선언 및 초기화

```bash
#!/bin/bash

# 방법 1: 괄호 안에 값 나열
arr=(10 20 30 "it" "itschool")

# 방법 2: 인덱스 지정
fruits[0]="apple"
fruits[1]="banana"
fruits[2]="cherry"

# 방법 3: 명령어 실행 결과를 배열로 저장
files=($(ls))

# 방법 4: 빈 배열 선언
empty_arr=()
```

### 1.3 배열 요소 접근

```bash
#!/bin/bash

arr=(10 20 30 "it" "itschool")

# 첫 번째 요소 (인덱스 지정 안하면 첫 번째만 출력)
echo ${arr}           # 10
echo ${arr[0]}        # 10

# 특정 인덱스 요소
echo ${arr[1]}        # 20
echo ${arr[3]}        # it

# 모든 요소 출력
echo ${arr[@]}        # 10 20 30 it itschool
echo ${arr[*]}        # 10 20 30 it itschool

# 배열 길이 (요소 개수)
echo ${#arr[@]}       # 5

# 특정 요소의 길이
echo ${#arr[4]}       # 8 (itschool의 길이)
```

**`${arr[@]}`와 `${arr[*]}`의 차이:**
```bash
#!/bin/bash

arr=("apple pie" "banana" "cherry")

# [@]는 각 요소를 개별 인자로
for item in "${arr[@]}"
do
    echo "- $item"
done
# 출력:
# - apple pie
# - banana
# - cherry

# [*]는 하나의 문자열로
for item in "${arr[*]}"
do
    echo "- $item"
done
# 출력:
# - apple pie banana cherry
```

### 1.4 배열 요소 추가

```bash
#!/bin/bash

# 초기 배열
arr=(10 20 30)

# 방법 1: 특정 인덱스에 할당
arr[3]=40
echo ${arr[@]}  # 10 20 30 40

# 방법 2: += 연산자로 추가
arr+=(50)
echo ${arr[@]}  # 10 20 30 40 50

# 방법 3: 여러 요소 동시 추가
arr+=(60 70 80)
echo ${arr[@]}  # 10 20 30 40 50 60 70 80
```

**변수를 배열에 추가:**
```bash
#!/bin/bash

fruits=("apple" "banana")
new_fruit="cherry"

# 하나의 요소로 추가하려면 큰따옴표로 감싸기
fruits+=("$new_fruit")
echo ${fruits[@]}  # apple banana cherry
```

### 1.5 배열 요소 삭제

```bash
#!/bin/bash

arr=(10 20 30 40 50)

# 특정 인덱스 삭제
unset 'arr[1]'
echo ${arr[@]}     # 10 30 40 50
echo ${!arr[@]}    # 0 2 3 4 (인덱스 확인)

# 전체 배열 삭제
unset arr
```

### 1.6 배열 인덱스 확인

```bash
#!/bin/bash

arr=(10 20 30)
arr[10]=100  # 중간 인덱스 건너뛰기

# 모든 인덱스 출력
echo ${!arr[@]}  # 0 1 2 10
```

### 1.7 배열 슬라이싱 (일부 추출)

```bash
#!/bin/bash

arr=(10 20 30 40 50 60 70)

# 형식: ${배열[@]:시작인덱스:개수}

# 인덱스 2부터 3개 추출
echo ${arr[@]:2:3}  # 30 40 50

# 인덱스 4부터 끝까지
echo ${arr[@]:4}    # 50 60 70
```

### 1.8 배열 합치기

```bash
#!/bin/bash

arr1=(10 20 30)
arr2=(40 50)

# 두 배열 합치기
arr3=(${arr1[@]} ${arr2[@]})
echo ${arr3[@]}  # 10 20 30 40 50
```

### 1.9 배열에서 특정 값 찾기 및 숨기기

```bash
#!/bin/bash

arr=(10 20 30 20 40 20 50)

# 특정 값을 빈 문자열로 치환하여 숨기기
echo ${arr[@]/20}       # 10 30 40 50 (첫 번째 20만 제거)
echo ${arr[@]//20}      # 10 30 40 50 (모든 20 제거)

# 원본 배열은 변경되지 않음
echo ${arr[@]}          # 10 20 30 20 40 20 50
```

---

## 2. 연관 배열 (Associative Arrays)

### 2.1 연관 배열 선언

연관 배열은 **Key-Value** 쌍으로 데이터를 저장합니다.

```bash
#!/bin/bash

# 연관 배열 선언
declare -A person

# 값 할당
person[name]="홍길동"
person[age]=30
person[city]="서울"

# 값 접근
echo ${person[name]}    # 홍길동
echo ${person[age]}     # 30

# 모든 key 출력
echo ${!person[@]}      # name age city

# 모든 value 출력
echo ${person[@]}       # 홍길동 30 서울
```

### 2.2 연관 배열 활용 예제

```bash
#!/bin/bash

# 서버 정보 관리
declare -A servers

servers[web1]="192.168.1.10"
servers[web2]="192.168.1.11"
servers[db1]="192.168.1.20"

# 모든 서버 정보 출력
for server in "${!servers[@]}"
do
    echo "$server: ${servers[$server]}"
done

# 출력:
# web1: 192.168.1.10
# web2: 192.168.1.11
# db1: 192.168.1.20
```

---

## 3. 문자열 연산 (String Operations)

### 3.1 문자열 길이

```bash
#!/bin/bash

myVar="Hello World"

# 문자열 길이
echo ${#myVar}  # 11
```

### 3.2 대소문자 변환

```bash
#!/bin/bash

myVar="How are you? Fine thanks"

# 대문자로 변환
echo ${myVar^^}      # HOW ARE YOU? FINE THANKS

# 소문자로 변환
echo ${myVar,,}      # how are you? fine thanks

# 첫 글자만 대문자
echo ${myVar^}       # How are you? fine thanks

# 첫 글자만 소문자
echo ${myVar,}       # how are you? Fine thanks
```

### 3.3 문자열 치환 (Replace)

```bash
#!/bin/bash

myVar="How are you? Fine thanks"

# 첫 번째 일치하는 문자열만 치환
echo ${myVar/Fine/So}
# 출력: How are you? So thanks

# 모든 일치하는 문자열 치환
text="old/old/new"
echo ${text//old/new}
# 출력: new/new/new
```

**특정 패턴 제거:**
```bash
#!/bin/bash

path="/home/user/documents/file.txt"

# .txt 제거
echo ${path/.txt/}     # /home/user/documents/file

# /old/ 를 /new/ 로 변경
echo ${path/old/new}   # /home/user/documents/file.txt
```

### 3.4 문자열 슬라이싱 (Substring)

```bash
#!/bin/bash

myVar="How are you?"

# 형식: ${변수:시작위치:길이}

# 4번째 인덱스부터 8개 문자
echo ${myVar:4:8}      # are you?

# 4번째 인덱스부터 끝까지
echo ${myVar:4}        # are you?

# 뒤에서부터 (음수 사용)
echo ${myVar: -4}      # you?
echo ${myVar: -6:2}    # e
```

### 3.5 문자열 시작/끝 패턴 제거

```bash
#!/bin/bash

filename="document.tar.gz"

# 앞에서부터 제거 (#: 최소 매칭, ##: 최대 매칭)
echo ${filename#*.}     # tar.gz (첫 번째 . 부터 제거)
echo ${filename##*.}    # gz (마지막 . 부터 제거)

# 뒤에서부터 제거 (%: 최소 매칭, %%: 최대 매칭)
echo ${filename%.*}     # document.tar (마지막 . 제거)
echo ${filename%%.*}    # document (모든 . 제거)
```

**경로에서 파일명/디렉토리명 추출:**
```bash
#!/bin/bash

path="/home/user/documents/file.txt"

# 파일명만 추출 (dirname 제거)
filename=${path##*/}
echo $filename         # file.txt

# 디렉토리명만 추출 (filename 제거)
dirname=${path%/*}
echo $dirname          # /home/user/documents

# 확장자 제거
basename=${filename%.*}
echo $basename         # file

# 확장자만 추출
extension=${filename##*.}
echo $extension        # txt
```

### 3.6 문자열 비교

```bash
#!/bin/bash

str1="hello"
str2="world"

# 같은지 비교
if [ "$str1" = "$str2" ]; then
    echo "같습니다"
else
    echo "다릅니다"
fi

# 빈 문자열 확인
if [ -z "$str1" ]; then
    echo "빈 문자열"
else
    echo "값이 있음"
fi

# 문자열 길이 확인
if [ -n "$str1" ]; then
    echo "값이 있음"
else
    echo "빈 문자열"
fi
```

### 3.7 문자열 포함 여부 확인

```bash
#!/bin/bash

text="Hello World"

# 특정 문자열 포함 여부
if [[ "$text" == *"World"* ]]; then
    echo "World를 포함합니다"
fi

# 시작 문자열 확인
if [[ "$text" == "Hello"* ]]; then
    echo "Hello로 시작합니다"
fi

# 끝 문자열 확인
if [[ "$text" == *"World" ]]; then
    echo "World로 끝납니다"
fi
```

---

## 4. 실전 예제

### 예제 1: 로그 파일 분석

```bash
#!/bin/bash

# 로그 파일을 배열로 읽기
mapfile -t log_lines < /var/log/syslog

echo "총 로그 라인 수: ${#log_lines[@]}"

# 최근 10개 로그만 출력
echo "최근 10개 로그:"
for line in "${log_lines[@]: -10}"
do
    echo "$line"
done
```

### 예제 2: CSV 파일 처리

```bash
#!/bin/bash

# CSV 파일: name,age,city
# 홍길동,30,서울
# 김철수,25,부산

while IFS=',' read -r name age city
do
    echo "이름: $name, 나이: $age, 도시: $city"
done < users.csv
```

### 예제 3: 파일 확장자별 개수 세기

```bash
#!/bin/bash

declare -A extensions

# 현재 디렉토리의 모든 파일 처리
for file in *
do
    if [ -f "$file" ]; then
        # 확장자 추출
        ext="${file##*.}"

        # 확장자가 없으면 "no_ext"
        if [ "$ext" = "$file" ]; then
            ext="no_ext"
        fi

        # 개수 증가
        ((extensions[$ext]++))
    fi
done

# 결과 출력
echo "=== 파일 확장자별 개수 ==="
for ext in "${!extensions[@]}"
do
    echo "$ext: ${extensions[$ext]}개"
done
```

### 예제 4: 사용자 입력 검증

```bash
#!/bin/bash

validate_email() {
    local email=$1

    # 이메일 형식 검증 (간단한 버전)
    if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo "유효한 이메일입니다: $email"
        return 0
    else
        echo "유효하지 않은 이메일입니다: $email"
        return 1
    fi
}

read -p "이메일을 입력하세요: " email
validate_email "$email"
```

### 예제 5: 파일명 일괄 변경

```bash
#!/bin/bash

# .jpg 파일을 .jpeg로 일괄 변경

count=0

for file in *.jpg
do
    if [ -f "$file" ]; then
        # 확장자 변경
        new_name="${file%.jpg}.jpeg"

        mv "$file" "$new_name"
        echo "변경: $file -> $new_name"
        ((count++))
    fi
done

echo "총 ${count}개 파일 변경 완료"
```

### 예제 6: IP 주소 유효성 검증

```bash
#!/bin/bash

validate_ip() {
    local ip=$1
    local valid_ip_regex='^([0-9]{1,3}\.){3}[0-9]{1,3}$'

    if [[ $ip =~ $valid_ip_regex ]]; then
        # 각 옥텟이 0-255 범위인지 확인
        IFS='.' read -ra ADDR <<< "$ip"
        for i in "${ADDR[@]}"
        do
            if [ $i -gt 255 ]; then
                echo "유효하지 않은 IP: $ip"
                return 1
            fi
        done
        echo "유효한 IP: $ip"
        return 0
    else
        echo "유효하지 않은 IP 형식: $ip"
        return 1
    fi
}

validate_ip "192.168.1.1"
validate_ip "256.1.1.1"
validate_ip "abc.def.ghi.jkl"
```

### 예제 7: 서버 목록 관리

```bash
#!/bin/bash

# 서버 정보를 연관 배열로 관리
declare -A servers

servers=(
    [web1]="192.168.1.10:80:running"
    [web2]="192.168.1.11:80:stopped"
    [db1]="192.168.1.20:3306:running"
)

# 서버 상태 출력
echo "=== 서버 상태 ==="
for server in "${!servers[@]}"
do
    IFS=':' read -ra info <<< "${servers[$server]}"
    ip="${info[0]}"
    port="${info[1]}"
    status="${info[2]}"

    echo "[$server]"
    echo "  IP: $ip"
    echo "  Port: $port"
    echo "  Status: $status"
    echo ""
done
```

---

## 5. 고급 기법

### 5.1 배열 정렬

```bash
#!/bin/bash

arr=(50 20 80 10 40)

# 배열 정렬 (오름차순)
IFS=$'\n' sorted=($(sort -n <<<"${arr[*]}"))
unset IFS

echo "정렬 전: ${arr[@]}"
echo "정렬 후: ${sorted[@]}"
```

### 5.2 배열 중복 제거

```bash
#!/bin/bash

arr=(10 20 30 20 40 10 50)

# 중복 제거
unique=($(echo "${arr[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

echo "원본: ${arr[@]}"
echo "중복 제거: ${unique[@]}"
```

### 5.3 문자열 분할 (Split)

```bash
#!/bin/bash

# IFS(Internal Field Separator)를 이용한 문자열 분할
text="apple,banana,cherry"

IFS=',' read -ra fruits <<< "$text"

for fruit in "${fruits[@]}"
do
    echo "과일: $fruit"
done
```

### 5.4 문자열 결합 (Join)

```bash
#!/bin/bash

arr=("apple" "banana" "cherry")

# 배열을 문자열로 결합
IFS=','
joined="${arr[*]}"
unset IFS

echo "$joined"  # apple,banana,cherry
```

### 5.5 다차원 배열 시뮬레이션

```bash
#!/bin/bash

# bash는 진정한 다차원 배열을 지원하지 않지만 시뮬레이션 가능

# 2D 배열 시뮬레이션
matrix[0,0]=1
matrix[0,1]=2
matrix[1,0]=3
matrix[1,1]=4

# 접근
echo ${matrix[0,0]}  # 1
echo ${matrix[1,1]}  # 4

# 반복문으로 출력
for i in 0 1
do
    for j in 0 1
    do
        echo -n "${matrix[$i,$j]} "
    done
    echo ""
done
# 출력:
# 1 2
# 3 4
```

---

## 6. 종합 예제: 시스템 정보 수집 스크립트

```bash
#!/bin/bash

# 시스템 정보를 배열과 연관 배열로 수집

echo "=== 시스템 정보 수집 ==="

# 1. 마운트된 파일시스템 목록 (배열)
mapfile -t filesystems < <(df -h | tail -n +2 | awk '{print $1}')

echo "마운트된 파일시스템 개수: ${#filesystems[@]}"
for fs in "${filesystems[@]}"
do
    echo "  - $fs"
done

echo ""

# 2. 사용자 정보 (연관 배열)
declare -A user_info

while IFS=: read -r username _ uid _ _ home shell
do
    if [ $uid -ge 1000 ] && [ $uid -lt 60000 ]; then
        user_info["$username"]="UID:$uid,Home:$home,Shell:${shell##*/}"
    fi
done < /etc/passwd

echo "일반 사용자 개수: ${#user_info[@]}"
for user in "${!user_info[@]}"
do
    IFS=',' read -ra info <<< "${user_info[$user]}"
    echo "[$user]"
    for item in "${info[@]}"
    do
        echo "  $item"
    done
done

echo ""

# 3. 네트워크 인터페이스 정보
declare -A interfaces

while read -r line
do
    if [[ $line =~ ^[0-9]+:\ ([^:]+): ]]; then
        interface="${BASH_REMATCH[1]}"
        # lo와 docker 인터페이스 제외
        if [[ ! "$interface" =~ ^(lo|docker) ]]; then
            # IP 주소 가져오기
            ip_addr=$(ip addr show "$interface" | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
            interfaces["$interface"]="${ip_addr:-No IP}"
        fi
    fi
done < <(ip link show)

echo "네트워크 인터페이스:"
for iface in "${!interfaces[@]}"
do
    echo "  $iface: ${interfaces[$iface]}"
done
```

---

## 주요 개념 요약

### 배열 관련

| 항목 | 문법 | 예시 |
|------|------|------|
| **배열 선언** | `arr=(값1 값2 ...)` | `arr=(10 20 30)` |
| **요소 접근** | `${arr[인덱스]}` | `${arr[0]}` |
| **전체 요소** | `${arr[@]}` | `${arr[@]}` |
| **배열 길이** | `${#arr[@]}` | `${#arr[@]}` |
| **요소 추가** | `arr+=(값)` | `arr+=(40)` |
| **요소 삭제** | `unset 'arr[인덱스]'` | `unset 'arr[1]'` |
| **인덱스 확인** | `${!arr[@]}` | `${!arr[@]}` |
| **슬라이싱** | `${arr[@]:시작:개수}` | `${arr[@]:2:3}` |

### 문자열 관련

| 항목 | 문법 | 예시 |
|------|------|------|
| **길이** | `${#변수}` | `${#myVar}` |
| **대문자** | `${변수^^}` | `${myVar^^}` |
| **소문자** | `${변수,,}` | `${myVar,,}` |
| **치환** | `${변수/old/new}` | `${myVar/Fine/So}` |
| **슬라이싱** | `${변수:시작:길이}` | `${myVar:4:8}` |
| **앞에서 제거** | `${변수#패턴}` | `${file#*.}` |
| **뒤에서 제거** | `${변수%패턴}` | `${file%.*}` |

## 학습 포인트

### 1. 배열 사용 시기
- 여러 관련 데이터를 하나로 그룹화
- 반복 처리가 필요한 데이터
- 동적으로 크기가 변하는 데이터

### 2. 연관 배열 활용
- Key-Value 쌍으로 데이터 관리
- 설정 정보, 서버 목록 등에 유용

### 3. 문자열 처리 최적화
- 외부 명령어(sed, awk) 대신 내장 기능 사용
- 성능과 가독성 향상

### 4. 실무 팁

**배열 안전하게 순회하기:**
```bash
# 좋은 예 (공백이 포함된 요소 처리)
for item in "${arr[@]}"
do
    echo "$item"
done

# 나쁜 예 (공백이 포함된 요소 분리됨)
for item in ${arr[@]}
do
    echo "$item"
done
```

**빈 배열 확인:**
```bash
if [ ${#arr[@]} -eq 0 ]; then
    echo "배열이 비어있습니다"
fi
```

**파일을 배열로 읽기:**
```bash
# 방법 1: mapfile (Bash 4.0+)
mapfile -t lines < file.txt

# 방법 2: 전통적인 방법
while IFS= read -r line
do
    lines+=("$line")
done < file.txt
```

---

## 마무리

배열과 문자열 연산은 쉘 스크립트의 데이터 처리 능력을 크게 향상시킵니다. 배열을 사용하면 여러 값을 효율적으로 관리할 수 있고, 문자열 연산을 마스터하면 외부 명령어 없이도 대부분의 텍스트 처리를 수행할 수 있습니다.

특히 연관 배열은 복잡한 설정 정보나 서버 관리에 매우 유용하며, 문자열 슬라이싱과 치환은 경로 처리, 파일명 변경 등 실무에서 자주 사용됩니다.

다음 Part에서는 Windows 배치 스크립트를 학습하여 Windows 환경에서의 자동화 방법을 배웁니다.
