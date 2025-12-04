---
title: "쉘 스크립트 Part 1: 기초 - 변수, 입출력, 특수문자"
excerpt: "쉘 스크립트의 기본 개념, 변수 사용법, 입출력, 특수문자 사용법을 학습합니다"
categories: ['script']
typora-root-url: ../../
published: true
date: 2025-01-02
tags: [linux, shell, script, bash, 변수, 입출력]
---

## 개요

Shell Script는 Linux 환경에서 여러 명령어를 자동화하여 실행할 수 있는 강력한 도구입니다. 이 문서에서는 쉘 스크립트의 기본 개념, 파일 생성 방법, 변수 사용법, 입출력, 그리고 특수문자 사용법을 학습합니다.

## 쉘 스크립트의 장점

Linux 환경을 사용하므로 다음과 같은 장점이 있습니다:

1. **명령어 조합**: Linux 명령어 및 환경변수를 파이프, 리디렉션, 필터 등으로 연결하여 원하는 결과를 얻을 수 있습니다.
2. **프로그래밍 기능**: C 프로그램과 유사한 형태의 프로그래밍이 가능합니다 (사용자 정의 함수, 조건문, 반복문 등).
3. **간단한 문법**: 기존 명령어들을 이용하여 만들어지는 스크립트 파일의 문법은 다른 프로그래밍 언어보다 매우 간단하며 쉽게 응용이 가능합니다.

## 스크립트 파일 생성

### 1. 파일 작성

쉘 프로그래밍은 Text 파일로 vi 에디터를 이용해서 작성 가능합니다.

```bash
vi myscript.sh
```

### 2. 셔뱅(Shebang) 선언

스크립트의 첫 라인은 특별 형태의 주석 `#!/bin/bash` (셔뱅, 해시뱅)으로 시작합니다.

```bash
#!/bin/bash
```

**셔뱅의 의미:**
- 어원: 유닉스 계열에서는 sharp(#) + bang(!) 합성어로 **sha-bang**이라 합니다
- `#!`은 2Byte의 매직넘버(magic number)로 이 스크립트를 실행시켜줄 프로그램의 경로를 지정하는 역할입니다

### 3. 실행 권한 부여

쉘 프로그래밍으로 만든 스크립트 파일은 기본적으로 664 퍼미션을 가집니다. 실행하기 위해서는 실행권한을 줘야 합니다.

```bash
chmod +x myscript.sh
```

### 4. 스크립트 실행 방법

**방법 1: sh 명령어 이용**
```bash
sh myscript.sh
```

**방법 2: 실행 퍼미션 부여 후 ./ 로 파일 실행**
```bash
chmod +x myscript.sh
./myscript.sh
```

## Shell 기본 개념

### Shell이란?

Shell은 **커널과 사용자를 연결해주는 인터페이스이자 간단한 프로그래밍 언어**입니다.

**유용한 명령어:**
```bash
# 사용중인 Shell 확인
echo $0

# Shell 변경
chsh username

# 환경변수 확인
env

# 설정된 변수 전체 보기
set

# 변수 제거
unset 변수명
```

### Shell 환경변수

| 변수 | 의미 | 변수 | 의미 |
|------|------|------|------|
| **BASH** | 사용하고 있는 bash 쉘의 경로 | **HOME** | 사용자의 홈 디렉터리 |
| **BASH_VERSION** | 사용하고 있는 bash 쉘의 버전 | **HOSTNAME** | 시스템의 호스명 |
| **COLUMNS** | 터미널의 행수로 기본 값은 80 | **HOSTTYPE** | 시스템의 타입 값 |
| **DISPLAY** | 현재 X-Window Display의 위치 | **LINES** | 터미널의 라인 수 |
| **HISTFILE** | 히스토리 파일의 이름 | **LOGNAME** | 로그인 사용자 명 |
| **HISTFILESIZE** | 히스토리 파일 사이즈 | **LS_COLORS** | ls 명령어 사용 시 파일 종류별 색상 지정 |
| **HISTSIZE** | 히스토리 개수 | **MAIL** | 메일 저장 위치 |
| **PATH** | 명령어를 찾을 검색 경로 | **MAILCHECK** | 메일 점검 시각, 기본 값은 60초 |
| **USER** | 홈디렉터리의 경로, cd명령 실행 시 적용 | **SHELL** | 로그인 shell의 이름 |
| **PS1** | 주 프롬프트 문자열의 설정 값 | **MANPATH** | man 페이지의 경로 |
| **UID** | 현재 사용자의 UID 값 | **OSTYPE** | 운영체제 타입 |

### Shell 환경변수 설정

**환경변수 설정 (전역변수 만들기):**
```bash
# 환경변수 설정
export HISTSIZE=1200
export newName=ygchoi

# 환경변수 확인
echo $HISTSIZE
echo $newName
```

**환경변수 각 확인 (env 명령):**
```bash
# 특정 환경변수 확인
echo $변수명

# 예시
echo $HISTSIZE
echo $newName
```

## 주석

**한 줄 주석:**
```bash
# 이것은 주석입니다
```

**여러 줄 주석:**
```bash
<<comm
이것은
여러 줄
주석입니다
comm
```

## 유용한 명령어

### 1. basename - 파일명 추출

파일경로에서 파일명만 찾습니다. 확장자 제거할 때 많이 사용합니다.

```bash
# 기본 사용
basename /usr/local/bin/script.sh
# 출력: script.sh

# 확장자 제거
basename /usr/local/bin/script.sh .sh
# 출력: script
```

### 2. dirname - 디렉터리 경로 추출

파일경로에서 directory 명만 찾습니다.

```bash
dirname /usr/local/bin/script.sh
# 출력: /usr/local/bin
```

### 3. $RANDOM - 난수 생성

0~32767 사이의 random 정수를 생성합니다.

```bash
echo $RANDOM
# 출력 예: 15432

# 1~100 사이의 난수 생성
echo $(($RANDOM % 100 + 1))
```

## Shell에서 사용되는 특수문자

| 문자 | 의미 | 의미 | 의미 |
|------|------|------|------|
| **~** | 홈 디렉터리 | **\*** | 널 문자를 포함한 모든 문자열 |
| **' '** | 모든 특수문자의 의미 제거(단순 문자들로 인식) | **?** | 모든 단일 문자, 한 문자 wildcard |
| **" "** | 특수문자들의 의미 보호 | **[...]** | 대괄호 안의 어떤한 문자와 일치하는 파일 자료 대표 문자 |
| **\` \`** | 명령어 대체, \` \` 로 묶인 문자열은 명령어로 인식 | **;** | 명령어 순서에 사용, shell 명령 분리자 |
| **( )** | 부속 shell (subshell) | **\$** | escape문자, 다음에 나오는 문자의 특별한 의미의 제거 |
| **[ ]** | 문자 집합 wildcard | **&&** | 백그라운드 모든 실행 |
| **{ }** | 명령 집합, (추가1..추가5) : 추가1부터 추가5까지 (예) touch .a{1..5} | **&&** | 조건부 실행으로 앞의 명령 성공 시 뒤 명령 실행 |
| **/** | 경로명 디렉터리 분리자 | **#** | 주석 처리 |
| **!** | 명령문 history | **$** | 변수의 접근 |

## exit 문 - 종료 코드

모든 명령어는 종료될 때 종료 코드를 발생시킵니다.

**종료 코드 확인:**
```bash
echo $?
```

**변수 $?의 의미:**
- 직전 실행 명령어의 종료 코드 값을 저장합니다
- 0: 정상 종료
- 그 외: 비정상 종료

### exit 종료 값의 의미

| exit 숫자 | 종료 값 의미 |
|----------|------------|
| **0** | 명령어가 성공적으로 종료 |
| **1 - 255** | 명령어가 실패로 종료 |
| **1** | 일반 에러 |
| **2** | Syntax error (문법 에러) |
| **126** | 명령을 실행할 수 없음 |
| **127** | 명령(파일)이 존재하지 않음 |
| **128+N** | 종료 시그널 + N<br/>(예: kill -9 PID 로 종료: 128+9=137) |

**예시:**
```bash
#!/bin/bash

ls /nonexistent_directory
echo "종료 코드: $?"  # 2 (에러)

ls /tmp
echo "종료 코드: $?"  # 0 (성공)

exit 0  # 스크립트를 성공 종료 코드로 종료
```

## echo 문 - 화면 출력

echo는 화면에 원하는 문자열을 출력하는 명령어입니다.

### 기본 사용법

```bash
# 기본 출력
echo "Hello World"
# 출력: Hello World

# 공백이 있는 문자열은 "" 로 묶어줌
echo "Hello   World"
# 출력: Hello   World
```

### echo 옵션

**-n 옵션: 자동 줄 바꿈 하지 않기**
```bash
echo -n "Input Directory:"
read _dir
# 같은 줄에 입력 프롬프트 표시
```

### 인용 부호의 차이

**" " (더블 쿼터): 특수문자들의 의미 보호**
```bash
name="Alice"
echo "Hello, $name"
# 출력: Hello, Alice
```

**' ' (싱글 쿼터): 모든 특수문자의 의미 제거**
```bash
name="Alice"
echo 'Hello, $name'
# 출력: Hello, $name
```

**\` \` (빽틱): 명령어 대체**
```bash
echo "Today is `date`"
# 출력: Today is Tue Dec  2 15:30:45 KST 2025

# 또는 $(명령어) 형식도 가능
echo "Today is $(date)"
```

### 예시 스크립트

```bash
#!/bin/bash

echo "===================="
echo "Running Program"
echo "===================="
echo -n "Input Directory:"
read _dir
echo -n "Input File:"
read _file

# 변수와 파일 사용하기 위해 실행권한 부여
chmod o+x $_dir/$_file

date
echo "Running"
```

## read 문 - 사용자 입력

read문은 사용자의 표준 입력을 받아들여 변수로 정의할 때 사용합니다.

### 기본 사용법

```bash
#!/bin/bash

read name
echo "입력한 이름: $name"
```

### read -p 옵션

-p 옵션을 사용하면 echo 문을 추가로 안 써도 됩니다.

```bash
#!/bin/bash

read -p "이름을 입력하세요: " name
echo "안녕하세요, $name님!"

read -p "나이를 입력하세요: " age
echo "당신은 $age살입니다."
```

### 주의사항

read 명령은 변수 이름 앞에 $를 사용할 수 없습니다.

```bash
# 잘못된 표현
read $name

# 올바른 표현
read name
```

## 변수 (Variables)

### 변수 선언

변수의 선언은 `변수명=값` 으로 표현합니다.

```bash
score=80
name="John"
```

**중요한 규칙:**
- **= 의 좌우에는 공백이 없이 사용되어야 합니다**
- 변수의 이름 시작은 문자 또는 _(언더바)로 시작해야 합니다
- Shell에서는 숫자형 변수와 문자형 변수 구분이 없습니다

### 변수 사용

변수를 사용할 때는 `$변수명` 또는 `${변수명}` 형식을 사용합니다.

```bash
#!/bin/bash

name="itschool"
echo "학교 이름: $name"
echo "학교 이름: ${name}"
```

**팁:**
- `${ }` 는 변수 접근할때 사용
- `$( )` 는 명령어를 넣을때 사용

### 환경변수 (전역변수)

변수를 지정한 후 export 명령어를 이용해서 global 변수, 즉 전역 변수로 사용 가능합니다.

```bash
#!/bin/bash

# 지역 변수
local_var="로컬"

# 전역 변수로 변환
export global_var="글로벌"

# 다른 스크립트에서도 global_var 사용 가능
```

### 변수 제거

```bash
# 변수 제거
unset 변수명

# 예시
name="Alice"
echo $name  # Alice
unset name
echo $name  # (빈 값)
```

### 상수 변수 (readonly)

변수가 한번 선언되면 스크립트가 끝날 때까지 바꾸지 못하는 값입니다.

```bash
#!/bin/bash

readonly var_name="itschool"
echo $var_name

# 변경 시도 시 에러 발생
var_name="newvalue"  # 에러: 읽기 전용 변수
```

C언어에서 const 붙인거랑 같습니다.

## 중첩 명령 (Nesting Commands)

명령어 안에 또 다른 명령어를 실행하는 것입니다.

### 형식

```bash
$(명령어)
# 또는
`명령어`
```

### 예시

```bash
#!/bin/bash

# date 명령이 실행된 후 echo 명령 실행
echo "Today is $(date)"
echo "Today is `date`"

# 파일 개수 세기
file_count=$(ls | wc -l)
echo "현재 디렉터리에 $file_count 개의 파일이 있습니다"

# 현재 사용자
current_user=$(whoami)
echo "현재 사용자: $current_user"
```

### date 서식 문자

```bash
# 연도
date +%Y

# 월
date +%m

# 일
date +%d

# 시간
date +%H:%M:%S

# 조합
echo "오늘은 $(date +%Y년\ %m월\ %d일) 입니다"
```

## 위치 매개변수 (Positional Parameters)

입력하는 argument들은 `$0`, `$1`, `$2`, ... `${10}`, `${11}` 등과 같은 변수에 저장되어 script에 전달됩니다.

### argument별 위치 매개변수

| 구분 | 변수 |
|------|------|
| **shell 스크립트 이름** | $0 |
| **첫 번째 argument** | $1 |
| **두 번째 argument** | $2 |
| **argument 개수** | $# |
| **parameter 리스트** | $@ , $* |

### 특수 shell 변수

| 구분 | 변수 | 예 |
|------|------|----|
| **로그인 shell의 PID** | $$ | # echo $$ |
| **직전 명령어 종료 코드 확인** | $? | # echo $? |
| **현재 작업 디렉터리** | $PWD | # echo $PWD |
| **부모 프로세스 ID** | $PPID | # echo $PPID |

### 예시 스크립트

```bash
#!/bin/bash

echo "스크립트 이름: $0"
echo "첫 번째 인자: $1"
echo "두 번째 인자: $2"
echo "전체 인자 개수: $#"
echo "모든 인자: $@"
echo "현재 PID: $$"

# 실행: ./script.sh hello world
# 출력:
# 스크립트 이름: ./script.sh
# 첫 번째 인자: hello
# 두 번째 인자: world
# 전체 인자 개수: 2
# 모든 인자: hello world
# 현재 PID: 12345
```

## 마무리

쉘 스크립트의 기초는 변수 사용, 입출력 처리, 그리고 특수문자의 이해에서 시작됩니다. 셔뱅 선언으로 스크립트를 시작하고, echo와 read로 사용자와 상호작용하며, 환경변수와 위치 매개변수를 활용하여 유연한 스크립트를 작성할 수 있습니다. 다음 Part에서는 조건문과 반복문을 학습하여 더 복잡한 로직을 구현하는 방법을 배웁니다.
