---
title: "배치 스크립트 Part 6: Windows Batch Script - DOS 명령어와 자동화"
excerpt: "Windows 배치 스크립트 작성법, DOS 명령어, 제어문과 자동화를 학습합니다"
categories: ['script']
typora-root-url: ../../
published: true
date: 2025-01-02
tags: [windows, batch, cmd, dos, script, 배치파일, 자동화]
---

## 개요

Windows 배치 스크립트(.bat 파일)는 Windows 환경에서 명령어를 자동화하는 강력한 도구입니다. 이 문서에서는 DOS 기본 명령어부터 배치 파일 작성, 제어문, 반복문, 함수, 그리고 취약점 진단 스크립트 작성까지 실무에서 필요한 모든 내용을 학습합니다.

**주요 특징:**
- Windows 명령어는 대소문자를 구분하지 않음
- `.bat` 또는 `.cmd` 확장자 사용
- 메모장이나 텍스트 에디터로 작성 가능

---

## 1. Windows DOS 기본 명령어

### 1.1 도움말 및 시스템 정보

| 명령어 | 설명 | 예시 |
|--------|------|------|
| **help** | Windows 명령 도움말 | `help dir` |
| **명령어 /?** | 특정 명령어 도움말 | `dir /?` |
| **systeminfo** | 시스템 정보 표시 | `systeminfo` |
| **msinfo32** | 시스템 정보 (GUI) | `msinfo32 /report system.txt` |
| **hostname** | 컴퓨터 이름 확인 | `hostname` |
| **whoami** | 현재 사용자 확인 | `whoami` |
| **ver** | Windows 버전 확인 | `ver` |

### 1.2 디렉토리 및 파일 관리

| 명령어 | 설명 | 예시 |
|--------|------|------|
| **dir** | 디렉토리 목록 보기 | `dir /s /b /a-d apple.txt` |
| | /s: 하위 디렉토리 검색 | |
| | /b: 간결한 형식으로 표시 | |
| | /a-d: 디렉토리가 아닌 파일만 표시 | |
| **cd** | 디렉토리 이동 | `cd /Windows` |
| | | `cd /System32` |
| **mkdir** | 디렉토리 생성 | `mkdir dir1` |
| | | `mkdir WabWc` (하위 폴더 생성) |
| **rmdir** | 디렉토리 삭제 | `rmdir C:Wbackup` |
| | | `rmdir /s /q C:Wbackup` |
| **copy** | 파일 복사 | `copy a.txt C:Wbackup` |
| | con으로 바로 생성 | `copy con a.txt` |
| **move** | 파일/디렉토리 이동 | `move a.txt /Users/a.txt` |
| **ren** | 파일/디렉토리 이름 변경 | `ren *.txt *.hwp` |
| | | `ren dir1 dir2` |
| **del** | 파일 삭제 | `del 파일명` |
| | | `del /s /q a.txt` |
| **erase** | 파일 삭제 | `erase a.txt` |
| | /F: 읽기 전용 파일 강제 삭제 | |
| | /S: 하위 디렉토리에서 삭제 | |
| | /Q: Quite 모드(삭제 확인 묻지 않음) | |
| **type** | 텍스트 파일 내용 표시 | `type nul > emp.txt` |

### 1.3 네트워크 명령어

| 명령어 | 설명 | 예시 |
|--------|------|------|
| **ipconfig** | IP 설정 확인 | `ipconfig /all` |
| **ping** | 네트워크 연결 테스트 | `ping 8.8.8.8` |
| **tracert** | 경로 추적 | `tracert www.google.com` |
| **netstat** | 네트워크 연결 상태 | `netstat -ano` |
| **nslookup** | DNS 조회 | `nslookup google.com` |
| **arp** | ARP 테이블 확인 | `arp -a` |

### 1.4 시스템 관리

| 명령어 | 설명 | 예시 |
|--------|------|------|
| **date** | 날짜 확인 및 수정 | `date /T` |
| **time** | 시간 확인 및 수정 | `time /T` |
| | | `echo %date%`, `echo %time%` |
| **where** | 명령어 실행 경로 확인 | `where python` |
| **path** | 실행 파일 경로 표시 및 설정 | `path` |
| **set** | 환경변수 확인 및 설정 | `set` |
| | | `echo %COMPUTERNAME%` |
| | | `echo %USERNAME%` |
| **timeout** | 대기 시간 설정 | `timeout 10` (10초 대기) |
| **cls** | 화면 지우기 | `cls` |

### 1.5 프로세스 관리

| 명령어 | 설명 | 예시 |
|--------|------|------|
| **tasklist** | 실행 중인 프로세스 목록 | `tasklist` |
| | | `tasklist \| more` |
| **taskkill** | 프로세스 종료 | `taskkill /IM notepad.exe` |
| | | `taskkill /F /IM "POWERPNT.EXE"` |
| | | `taskkill /PID 1230` |
| **start** | 프로그램 실행 | `start chrome` |
| | | `start chrome www.naver.com` |
| **tree** | 디렉토리 계층 구조 표시 | `tree` |
| **exit** | 명령 프롬프트 종료 | `exit` |

### 1.6 파일 검색

| 명령어 | 설명 | 예시 |
|--------|------|------|
| **find** | 파일에서 문자열 찾기 | `find "hello" c:Wtest.txt` |
| | /V: 지정한 문자열이 없는 줄 표시 | `type test.txt \| find "hello"` |
| | /C: 지정한 문자열이 있는 줄의 수 표시 | |
| | /N: 지정한 문자열이 있는 줄 번호 표시 | |
| | /I: 대소문자 구분 안 함 | |
| **findstr** | 여러 파일에서 문자열 찾기 | `findstr "hello world" test.txt` |
| | /S: 현재 디렉토리와 하위 디렉토리 검색 | `type test.txt \| findstr /I "hello"` |
| | /I: 대소문자 구분 안 함 | |

---

## 2. 배치 파일 기본

### 2.1 배치 파일 생성

```batch
@echo off
echo Hello, World!
pause
```

**저장:**
- 파일명: `hello.bat`
- 인코딩: ANSI 또는 UTF-8

**실행:**
```cmd
hello.bat
```

### 2.2 @echo off

```batch
@echo off
:: 실행 명령어를 화면에 표시하지 않음

@echo on
:: 실행 명령어를 화면에 표시

echo
:: 현재 echo 설정 상태 표시

echo.
:: 줄바꿈 (개행)
```

### 2.3 주석 (rem)

```batch
@echo off

rem 이것은 주석입니다
:: 이것도 주석입니다 (더 많이 사용됨)

echo 프로그램 시작
```

### 2.4 pause

```batch
@echo off

echo 첫 번째 작업 완료
pause
:: 사용자가 아무 키나 누를 때까지 대기

echo 두 번째 작업 시작
```

---

## 3. 변수

### 3.1 변수 선언 (SET)

```batch
@echo off

:: 변수 선언 (= 앞뒤로 띄어쓰기 하면 안됨)
SET var=1
SET name=itschool

:: 변수 사용
echo 변수 var = %var%
echo 변수 name = %name%
```

**주의사항:**
- 대소문자 구분하지 않음 (`SET var=1`과 `SET VAR=1`은 같음)
- `=` 앞뒤로 공백이 없어야 함

### 3.2 지역 변수 (setlocal ~ endlocal)

```batch
@echo off

setlocal
SET local_var=로컬변수
SET global_var=전역변수
endlocal

echo local_var: %local_var%
:: 출력 안됨 (지역 변수이므로)

echo global_var: %global_var%
:: 출력됨
```

### 3.3 변수 제거

```batch
SET age=
:: 빈 값으로 설정하면 변수 제거
```

### 3.4 사용자 입력 (SET /P)

```batch
@echo off

SET /P name=이름을 입력하세요:
echo 안녕하세요, %name%님!

SET /P age=나이를 입력하세요:
echo 당신은 %age%살입니다.

pause
```

### 3.5 산술 연산 (SET /A)

```batch
@echo off

SET /A sum=10+5
echo 10 + 5 = %sum%

SET /A mul=10*5
echo 10 * 5 = %mul%

SET /A div=10/3
echo 10 / 3 = %div%

SET /A mod=10%%3
echo 10 %% 3 = %mod%
```

**주의:** `%`는 배치 파일에서 `%%`로 써야 함

---

## 4. 위치 매개변수

### 4.1 매개변수 사용

```batch
@echo off

:: setExam1.bat hello world

echo batch 파일 이름 = %0
echo first arg = %1
echo second arg = %2
echo third arg = %3

pause
```

**실행:**
```cmd
C:\> setExam1.bat hello world
batch 파일 이름 = setExam1.bat
first arg = hello
second arg = world
third arg =
```

### 4.2 특수 매개변수

| 변수 | 의미 | 예시 |
|------|------|------|
| **%0** | 배치 파일 이름 | `setExam1.bat` |
| **%1** | 첫 번째 인자 | `hello` |
| **%2** | 두 번째 인자 | `world` |
| **%n** | n번째 인자 | |
| **%~d0** | 배치 파일이 있는 드라이브 | `C:` |
| **%-p0** | 배치 파일이 있는 디렉토리 경로 | `C:\magic\` |
| **%~dp0** | 배치 파일이 있는 드라이브 및 디렉토리 | `C:\magic\` |

**예제:**
```batch
@echo off
setlocal

echo batch 파일 이름 = %0
echo batch 파일의 드라이브 = %~d0
echo batch 파일의 디렉토리 = %~p0

pause
```

---

## 5. 환경 변수

### 5.1 시스템 환경 변수

| 변수 이름 | 경로 |
|-----------|------|
| `%AppData%` | c:\Users\username\Roaming |
| `%ComputerName%` | Hostname |
| `%HomePath%` | c:\Users\username |
| `%LocalAppData%` | c:\Users\username\AppData\Local |
| `%ProgramData%` | c:\ProgramData |
| `%ProgramFiles%` | c:\ProgramFiles |
| `%ProgramFiles(x86)%` | c:\ProgramFiles(x86) |
| `%SystemRoot%` | c:\Windows |
| `%Temp%` | c:\Users\username\AppData\Local\Temp |
| `%UserProfile%` | c:\Users\username |
| `%Windir%` | c:\Windows |
| `%SystemDrive%` | C: |

### 5.2 환경 변수 추가 (setx)

```batch
:: 환경변수 PATH에 경로 추가
setx PATH "%PATH%;C:\새로운경로" /m

:: /m 옵션: 시스템 환경 변수를 수정 (관리자 권한 필요)
```

### 5.3 종료 코드 (%ERRORLEVEL%)

```batch
@echo off

echo %ERRORLEVEL%
:: 직전 실행 명령어의 종료 코드 확인

ping 8.8.8.8 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 네트워크 연결 성공
) else (
    echo 네트워크 연결 실패
)
```

**종료 코드 의미:**

| exit 값 | 의미 |
|---------|------|
| **0** | 명령어가 성공적으로 종료 |
| **1** | 일반 에러 |
| **2** | Syntax error (문법 에러) |
| **9009** | 명령(파일)이 존재하지 않음 |
| **-1073741510** | 인터럽트(Ctrl+c)로 중단했을 경우 |

---

## 6. 문자열 연산

### 6.1 문자열 자르기 (Slicing)

```batch
@echo off
setlocal

:: substring을 사용하여 원하는 부분의 문자열 추출
:: %변수명:~시작인덱스,길이%

SET var=Hello World!

:: 0부터 시작, 5개 문자
SET substr=%var:~0,5%
echo %substr%
:: 출력: Hello

:: 뒤에서부터 (-6은 뒤에서 6번째 문자부터)
SET substr=%var:~-6%
echo %substr%
:: 출력: World!

:: 뒤에서 6번째부터 2개 문자
SET substr=%var:~-6,2%
echo %substr%
```

### 6.2 문자열 치환 (Replace)

```batch
@echo off
setlocal

:: 입력된 값의 공백 제거
SET /P id=id를 입력하세요:
rem 입력된 ID의 값의 공백 제거
SET "id=%id: =%"
echo "id값은: %id%"

SET /P pw=pw를 입력하세요:
rem 입력된 PW의 값의 공백 제거
SET "pw=%pw: =%"
echo "pw값은: %pw%"

:: %변수:대체할문자=대체될문자%
:: 대체할 문자를 공백으로 비워두면 해당 변수에서 모든 공백 제거

if /I "%id%"=="apple" (
    if /I "%pw%"=="love" (
        echo 로그인 성공!!
    ) else (
        echo 비밀번호를 다시 확인하세요!
    )
) else (
    echo id를 다시 확인하세요!
)

pause
```

---

## 7. IF 조건문

### 7.1 기본 IF 문

```batch
@echo off

SET /P num=숫자를 입력하세요:

if %num% EQU 10 (
    echo 입력값은 10입니다
)
```

### 7.2 IF ~ ELSE

```batch
@echo off

SET /P num=숫자를 입력하세요:

if %num% EQU 10 (
    echo 입력값은 10입니다
) else (
    echo 입력값은 10이 아닙니다
)
```

### 7.3 숫자 비교 연산자

| 표현방식 | 의미 |
|---------|------|
| **EQU** | 같다 (equal) |
| **NEQ** | 같지 않다 (not equal) |
| **LSS** | 보다 작다 (less) |
| **LEQ** | 작거나 같다 (less equal) |
| **GTR** | 보다 크다 (greater) |
| **GEQ** | 크거나 같다 (greater equal) |

```batch
@echo off

SET /P age=나이를 입력하세요:

if %age% GEQ 18 (
    echo 성인입니다
) else (
    echo 미성년자입니다
)
```

### 7.4 문자열 비교

```batch
@echo off

SET /P input=yes 또는 no를 입력하세요:

:: /I 옵션: 대소문자 구분 안함
if /I "%input%"=="yes" (
    echo YES를 입력하셨습니다
) else if /I "%input%"=="no" (
    echo NO를 입력하셨습니다
) else (
    echo 잘못된 입력입니다
)
```

### 7.5 파일 존재 확인

```batch
@echo off

if exist C:\backup\test.txt (
    echo 파일이 존재합니다
    del C:\backup\test.txt
) else (
    echo 파일이 존재하지 않습니다
)
```

### 7.6 NOT 연산자

```batch
@echo off

if not %1 == %2 goto process

:: %1과 %2가 같으면 종료
goto quit

:process
echo %1과 %2가 다릅니다
exit

:quit
echo 종료합니다
```

---

## 8. Label과 GOTO

### 8.1 Label 정의

```batch
@echo off

echo 프로그램 시작

:loop
echo 반복 실행
goto loop
:: 무한 루프

:end
echo 프로그램 종료
```

### 8.2 GOTO로 흐름 제어

```batch
@echo off

SET /P choice=계속하시겠습니까? (y/n):

if /I "%choice%"=="y" goto continue
if /I "%choice%"=="n" goto exit

:continue
echo 계속 진행합니다
goto end

:exit
echo 프로그램을 종료합니다
goto :eof

:end
pause
```

### 8.3 GOTO :eof

**:eof**는 배치 파일의 끝을 의미하는 특별한 label입니다.

```batch
@echo off

echo 시작

goto :eof
:: 스크립트 종료

echo 이 줄은 실행되지 않습니다
```

---

## 9. CHOICE 문

### 9.1 기본 사용법

```batch
@echo off

echo 어떤 작업을 수행하시겠습니까?
echo 1. 파일 열기
echo 2. 파일 저장
echo 3. 종료

choice /C 123 /M "선택(1,2,3)?"

:: %ERRORLEVEL%에 선택한 값이 저장됨
:: 1을 선택하면 ERRORLEVEL=1
:: 2를 선택하면 ERRORLEVEL=2
:: 3을 선택하면 ERRORLEVEL=3

if %ERRORLEVEL% EQU 1 goto Open
if %ERRORLEVEL% EQU 2 goto Save
if %ERRORLEVEL% EQU 3 goto Exit

:Open
echo 파일 열기
goto end

:Save
echo 파일 저장
goto end

:Exit
echo 프로그램 종료
goto :eof

:end
pause
```

### 9.2 CHOICE 옵션

| 옵션 | 설명 |
|------|------|
| **/C 문자열** | 선택할 수 있는 목록 나열 (기본값: YN) |
| **/N** | 선택할 옵션을 표시하지 않음 |
| **/M 메시지** | 사용자에게 선택할 옵션을 설명하는 메시지 표시 |
| **/S** | 대소문자 구분 |

```batch
choice /C ABCD /N /M "다음 중에서 하나를 선택하시오 A, B, C, D"
```

---

## 10. FOR 반복문

### 10.1 기본 FOR 문

```batch
@echo off

:: 배치 파일용: %%변수
:: DOS 창용: %변수

for %%g in (dir1 dir2) do mkdir %%g
:: dir1, dir2 디렉토리 생성

for %%g in (dir1 dir2) do rmdir %%g
:: dir1, dir2 디렉토리 삭제
```

### 10.2 FOR /L (숫자 반복)

```batch
@echo off

:: FOR /L %%변수 IN (begin, step, end) DO 명령

:: 1부터 10까지 출력
for /L %%i in (1, 1, 10) do (
    echo %%i
)

:: 1부터 10까지 2씩 증가
for /L %%i in (1, 2, 10) do (
    echo %%i
)
:: 출력: 1 3 5 7 9
```

### 10.3 FOR /R (재귀 탐색)

```batch
@echo off

:: 지정된 디렉토리 및 하위 디렉토리에서 파일 반복

for /R C:\backup %%g in (*.txt) do (
    echo %%~nxg
)
:: C:\backup 및 하위 디렉토리의 모든 .txt 파일 출력
```

**%%~nxg 의미:**
- `%%g`: 전체 경로
- `~n`: 파일명만
- `~x`: 확장자만
- `~nxg`: 파일명 + 확장자

### 10.4 FOR /D (디렉토리만)

```batch
@echo off

:: 디렉토리만 반복

for /D %%g in (*) do (
    echo 디렉토리: %%g
)
```

### 10.5 FOR /F (파일 읽기)

```batch
@echo off

:: FOR /F ["옵션"] %%변수 IN (파일명) DO 명령

:: 파일 내용을 한 줄씩 읽기
for /F %%i in (test.txt) do (
    echo %%i
)

:: 여러 파일 읽기
for /F %%i in (file1.txt file2.txt) do (
    echo %%i
)
```

**FOR /F 옵션:**

| 옵션 | 설명 |
|------|------|
| **delims=xxx** | 구분자 (기본값: 공백) |
| **skip=n** | 파일 시작 부분에서 무시할 줄 수 |
| **eol=;** | 주석 문자 (기본값: ;) |
| **tokens=x,y,m-n** | 각 줄에서 읽을 항목 수 |
| **usebackq** | 따옴표 의미 변경 |

**tokens 예제:**
```batch
@echo off

:: test.txt: apple banana cherry

for /F "tokens=1-3" %%a in (test.txt) do (
    echo 첫 번째: %%a
    echo 두 번째: %%b
    echo 세 번째: %%c
)
```

**delims 예제:**
```batch
@echo off

:: test.txt: apple,banana,cherry

for /F "delims=," %%a in (test.txt) do (
    echo %%a
)
:: 출력: apple (첫 번째 항목만)

for /F "tokens=1-3 delims=," %%a in (test.txt) do (
    echo %%a %%b %%c
)
:: 출력: apple banana cherry
```

### 10.6 setlocal enableDelayedExpansion

반복문 내에서 변수 값을 실시간으로 받으려면 **!변수!** 형식을 사용합니다.

```batch
@echo off
setlocal enableDelayedExpansion

:: 구구단 예제
SET /P dan=단수를 입력하세요:

for /L %%i in (1, 1, 9) do (
    SET /A result=%dan% * %%i
    echo %dan% x %%i = !result!
)

pause
```

---

## 11. CALL 명령어 (함수)

### 11.1 내부 함수 호출

```batch
@echo off

CALL :inside_func hello
CALL :inside_func world

echo 함수 모두 호출 완료
pause
goto :EOF

:inside_func
echo 매개변수: %1
exit /B
:: exit /B: 함수 종료 후 호출 지점으로 복귀
```

### 11.2 외부 배치 파일 호출

**calling.bat:**
```batch
@echo off

SET abc=Hello
echo abc = %abc%

CALL called.bat %abc%
echo abc = %abc%

pause
```

**called.bat:**
```batch
@echo off

echo "이 곳은 called.bat 파일내부!!"
SET abc=%1 World
echo.

pause
```

**실행:**
```cmd
C:\> calling.bat
abc = Hello

"이 곳은 called.bat 파일내부!!"
abc = Hello World
```

---

## 12. 입출력 리디렉션

### 12.1 출력 리디렉션

```batch
@echo off

:: 표준 출력을 파일로
echo Hello World > output.txt
:: output.txt 파일 생성 (기존 내용 삭제)

echo New Line >> output.txt
:: output.txt 파일에 추가

:: 에러 출력 리디렉션
dir nonexist 2> error.txt
:: 에러 메시지를 error.txt로

:: 표준 출력과 에러를 함께
command > output.txt 2>&1
```

### 12.2 입력 리디렉션

```batch
@echo off

:: 파일 내용을 명령어 입력으로
sort < input.txt

:: 파일 내용을 다른 파일로
sort < input.txt > sorted.txt
```

### 12.3 NUL 디바이스

```batch
@echo off

:: 출력 숨기기
ping 8.8.8.8 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 네트워크 연결 성공
)
```

---

## 13. 실전 예제

### 예제 1: 시스템 정보 수집

```batch
@echo off
echo ================================
echo 시스템 정보 수집
echo ================================

echo.
echo [시스템 정보]
systeminfo | find "OS 이름"
systeminfo | find "시스템 종류"

echo.
echo [네트워크 정보]
ipconfig | find "IPv4"

echo.
echo [디스크 정보]
wmic logicaldisk get name,size,freespace

pause
```

### 예제 2: 파일 백업 스크립트

```batch
@echo off
setlocal

SET SOURCE=C:\Documents
SET DEST=D:\Backup
SET DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%

echo 백업 시작: %SOURCE% -^> %DEST%

if not exist "%DEST%" mkdir "%DEST%"

xcopy "%SOURCE%" "%DEST%\Backup_%DATE%" /E /I /Y

if %ERRORLEVEL% EQU 0 (
    echo 백업 성공!
) else (
    echo 백업 실패!
)

pause
```

### 예제 3: Administrator 계정 점검

```batch
@echo off

echo [ 기 준 ]
echo 양호: Administrator Default 계정 이름을 변경하거나 강화된 비밀번호를 적용한 경우
echo 취약: Administrator Default 계정 이름을 변경하지 않거나 단순 비밀번호를 적용한 경우

echo.
echo [ 점 검 ]
net user Administrator > nul

echo.
echo [ 결 과 ]
net user Administrator | find /i "활성 계정" | find /i "예" > nul

if not errorlevel 1 echo 양호
if not errorlevel 1 echo 취약

pause
```

### 예제 4: 계정 잠금 임계값 점검

```batch
@echo off

echo [ 기 준 ]
echo 양호: 계정 잠금 임계값이 5 이하의 값으로 설정되어 있는 경우
echo 취약: 계정 잠금 임계값이 6 이상의 값으로 설정되어 있는 경우

echo.
echo [ 점 검 ]
net accounts | find /i "잠금 임계값"

echo.
echo [ 결 과 ]
net accounts | find /i "잠금 임계값" > threshold.txt

for /f "tokens=1-3" %%a in (threshold.txt) do set Threshold=%%c
if %Threshold% leq 5 echo 양호
if not %Threshold% leq 5 echo 취약

del threshold.txt

pause
```

### 예제 5: 관리자 그룹 최소화 점검

```batch
@echo off

echo [ 기 준 ]
echo 양호: Administrators 그룹의 구성원을 1명 이하로 유지하거나, 불필요한 관리자 계정이 존재하지 않는 경우
echo 취약: Administrators 그룹에 불필요한 관리자 계정이 존재하는 경우

echo.
echo [ 점 검 ]
echo "net localgroup administrators 명령 실행으로 관리자 계정 확인"
net localgroup administrators

echo.
echo [ 결 과 ]
echo 담당자와 인터뷰를 통해 불필요한 관리자 계정 존재 확인 필요!

pause
```

---

## 14. 고급 기법

### 14.1 배열 시뮬레이션

```batch
@echo off
setlocal

:: 배열처럼 사용하기
SET arr[0]=apple
SET arr[1]=banana
SET arr[2]=cherry

:: 접근
echo %arr[0]%
echo %arr[1]%
echo %arr[2]%

:: 반복문으로 출력
for /L %%i in (0,1,2) do (
    call echo %%arr[%%i]%%
)
```

### 14.2 날짜/시간 포맷

```batch
@echo off

:: 날짜: YYYYMMDD
SET TODAY=%date:~0,4%%date:~5,2%%date:~8,2%
echo %TODAY%

:: 시간: HHMMSS
SET NOW=%time:~0,2%%time:~3,2%%time:~6,2%
echo %NOW%

:: 조합
SET DATETIME=%TODAY%_%NOW%
echo %DATETIME%
```

### 14.3 색상 출력 (ANSI Escape Code)

```batch
@echo off

:: ANSI Escape Code 활성화 (Windows 10+)
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1

:: 색상 코드
:: [31m: 빨간색
:: [32m: 녹색
:: [33m: 노란색
:: [0m: 리셋

echo [31m빨간색 텍스트[0m
echo [32m녹색 텍스트[0m
echo [33m노란색 텍스트[0m
```

---

## 주요 개념 요약

| 항목 | Linux Shell | Windows Batch |
|------|-------------|---------------|
| **확장자** | `.sh` | `.bat`, `.cmd` |
| **셔뱅** | `#!/bin/bash` | 없음 |
| **주석** | `#` | `rem`, `::` |
| **변수 선언** | `var=value` | `SET var=value` |
| **변수 사용** | `$var`, `${var}` | `%var%` |
| **사용자 입력** | `read` | `SET /P` |
| **산술 연산** | `$(( ))` | `SET /A` |
| **조건문** | `if [ ]; then fi` | `if ( ) else ( )` |
| **반복문** | `for; do done` | `for ( ) do ( )` |
| **함수** | `func() { }` | `:label`, `CALL :label` |
| **배열** | `arr=(1 2 3)` | 시뮬레이션 필요 |

## 학습 포인트

### 1. Windows vs Linux
- **대소문자**: Windows는 구분 안 함, Linux는 구분
- **경로 구분자**: Windows는 `\`, Linux는 `/`
- **환경 변수**: Windows는 `%VAR%`, Linux는 `$VAR`

### 2. 배치 파일 실무 팁

**에러 처리:**
```batch
@echo off

command
if %ERRORLEVEL% NEQ 0 (
    echo 명령 실행 실패
    exit /B 1
)
```

**안전한 파일 삭제:**
```batch
if exist "file.txt" (
    del "file.txt"
)
```

**관리자 권한 확인:**
```batch
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 관리자 권한이 필요합니다
    pause
    exit /B 1
)
```

### 3. 디버깅

```batch
@echo off

:: 디버깅 모드
@echo on

:: 또는 각 단계마다 pause
command1
pause

command2
pause
```

---

## 마무리

Windows 배치 스크립트는 Windows 시스템 관리 및 자동화에 필수적인 도구입니다. Linux 쉘 스크립트에 비해 문법은 다소 제한적이지만, Windows 환경에서는 강력한 자동화 수단입니다.

실무에서는 **시스템 점검**, **백업 자동화**, **로그 분석**, **취약점 진단** 등에 활용되며, PowerShell과 함께 사용하면 더욱 강력한 스크립트를 작성할 수 있습니다.

리눅스 쉘 스크립트와 윈도우 배치 스크립트를 모두 학습함으로써, 크로스 플랫폼 자동화 역량을 갖추게 되었습니다.
