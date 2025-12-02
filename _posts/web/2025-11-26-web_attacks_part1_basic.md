---
title: "웹 공격 - OS Command Injection, 디렉터리 인덱싱, 정보 노출"
excerpt: ".."

categories: [web]
typora-root-url: ../../

date: 2025-11-26
last_modified_at: 2025-11-26
published: true
tags: [web, security, attack, command-injection, 정보보안]
---

## 개요

이 문서에서는 웹 애플리케이션의 주요 취약점과 공격 기법을 다룹니다. OS Command Injection, 디렉터리 인덱싱, 정보 노출 취약점, 파일 다운로드 취약점, 그리고 악성코드의 종류에 대해 학습합니다.

## OS Command Injection

### 개념

웹 애플리케이션을 통해 URL의 파라미터에 운영체제(OS) 명령을 실행하는 취약점입니다.

**특징:**
- DB와 연동된 페이지에 시스템 명령어(ls, cat, ifconfig 등) 삽입
- system(), exec() 같은 시스템 명령어 실행 함수 제공
- 사용자 입력값에 대한 필터링이 제대로 이루어지지 않을 경우 발생
- 공격자가 운영체제 시스템 명령어를 호출 가능

### 유용한 명령어

| 목적 | Linux | Windows |
|------|-------|---------|
| 현재 사용자 | whoami | whoami |
| 운영체제 정보 | uname -a | ver |
| 네트워크 설정 | ifconfig | ipconfig /all |
| 네트워크 연결 | netstat -an | netstat -an |
| 실행 중인 프로세스 | ps -ef | tasklist |

### 명령어 삽입 방법

**윈도우 및 리눅스:**
- `&` : 앞의 명령어를 백그라운드로 돌리고 동시에 뒤의 명령어 실행
- `&&` : 앞의 명령어가 실패할 경우 뒤의 명령을 실행하지 않음
- `|` (파이프) : 앞의 명령어 실행결과를 뒤의 명령어 입력으로 넘김
- `||` : 순차적으로 실행하되, 명령 실행 성공 시 뒤의 명령 실행 안함

**리눅스 전용:**
- `;` : 앞의 명령어가 실패해도 다음 명령어 실행
- 줄 바꿈 (0x0a 또는 \n)

### 대응 방안

**취약한 함수 필터링:**
- PHP: require(), include(), eval(), exec(), passthru(), system()
- Perl: open(), sysopen(), glob(), system(), eval()
- Java: System.* (특히 System.Runtime)

**명령어 필터링:**
- 윈도우: dir, mkdir, move, ipconfig, netstat, tracert, format
- 리눅스: ls, mk, mv, rm, chmod, kill, ifconfig, halt, reboot

**특수문자 필터링:**
- &, &&, |, ||, ;, \n 등

## 디렉터리 인덱싱 (Directory Listing)

### 개념

서버 환경 설정 및 디렉터리 권한에 의한 파일 리스팅 취약점입니다.

**피해:**
- 백업 파일 및 디렉터리 정보 노출
- 파일 정보 노출
- 디렉터리 내의 파일 리스트가 웹 브라우저 상에 표시

### 확인 방법

구글 검색창:
```
intitle:"index of" site:jp
```

### 대응 방안

| 웹 서버 | 대응 방법 |
|---------|-----------|
| **IIS** | 디렉터리 검색 부분의 체크 해제 또는 사용 안 함 |
| **Apache** | httpd.conf 파일의 Indexes 항목 제거 |
| **Tomcat** | web.xml 파일의 listings의 param-value 값을 false로 설정 |
| **Weblogic** | weblogic.xml 파일의 `<index-directory-enable>` 속성을 false로 설정 |
| **WebtoB** | 환경파일.m 파일에 DIRINDEX 절 삽입, NODE 절에 Options 항목을 -index로 설정 |

## 정보 노출 취약점

### 관리자 페이지 노출

관리자 페이지 URL이 유추하기 쉬운 이름이나 설정 오류로 비인가자가 접근 가능한 취약점입니다.

**취약한 패턴:**

1. **추측하기 쉬운 URL:**
```
http://www.test.com/admin
http://www.test.com/manager
http://www.test.com/master
http://www.test.com/administrator
```

2. **포트 노출:**
```
http://www.test.com:7001
http://www.test.com:8080
http://www.test.com:8443
http://www.test.com:8989
```

3. **로그인 우회 - 취약한 계정:**
```
아이디: admin
비밀번호: admin
```

4. **메인 페이지 우회:**
```
About:blank -> /admin/main.asp
```

**대응 방안:**
- 관리자 페이지 주소를 유추하기 어려운 이름으로 변경 및 포트 변경
- 관리자 페이지 각각에 대해 인증 세션 관리
- 권한 설정을 통해 사용자 접근 제한
- 웹 방화벽을 이용한 특정 IP만 접근 제한

### 에러 페이지 정보 노출

웹 서비스에서 에러 발생 시 노출되는 정보:
- 데이터베이스 정보
- 웹 서버 절대 경로
- 서버의 버전 정보

**대응 방안:**

1. HTML 소스 코멘트 관리:
- 중요 정보를 코멘트 처리하지 않음
- 사용자가 소스보기 기능으로 볼 수 있음

2. 에러 페이지 리다이렉트:
- 400, 500 에러코드에 대해 별도 에러 페이지로 리다이렉트
- 통합 에러 페이지 작성

**Apache 설정 (httpd.conf):**
```apache
ErrorDocument 500 "error message"
ErrorDocument 404 "/your web root/error.html"
ErrorDocument 402 http://test.com/error.html
```

## 파일 다운로드 취약점 (Directory Traversal)

### 개념

보안 코드가 없고 대상 파일이 위치한 디렉터리를 벗어나 다른 경로의 파일에 접근 가능한 취약점입니다.

**특징:**
- 공격자가 응용 프로그램을 실행하는 서버에서 임의의 파일을 읽을 수 있음
- 디렉터리 통과(파일경로 통과) 공격

### 공격 기법

**1. Escape 사용한 경로 우회:**
```
http://server.com/scripts/..%5c../Windows/System32/cmd.exe?/c+dir+c:\
http://server.com/scripts/..%..Windows/System32/cmd.exe?/c+dir+c:\
```

**2. 중첩된 탐색 시퀀스:**
```
..//또는 ....\\/ 내부 시퀀스가 제거 될 경우 간단한 탐색
```

**3. 다양한 표준이 아닌 인코딩:**
```
..%c0%afFF는 ..%252f를 이용하여 입력 필터 바이패스!!
```

**4. 응용 프로그램에서 사용자 제공 파일 이름이 예상되는 /var/www/images/ 경로:**
```
filename=/var/www/images/../../../etc/passwd
```

**5. null바이트를 사용하여 확장명 전에 파일 경로를 효과적으로 사용:**
```
filename=../../../etc/passwd%00.png
-> %00 = null
```

**6. HTTP 요청 시 쿠키 값 이용:**
```
GET /vulnerable.php HTTP/1.0
Cookie: TEMPLATE=../../../../../../../etc/passwd
```

### URL 인코딩

**Encoding and double encoding:**
- %2e%2e%2f represents ../
- %2e%2e/ represents ../
- ..%2f represents ../
- %2e%2e%5c represents ..\
- %2e%2e\ represents ..\
- ..%5c represents ..\
- %252e%252e%255c represents ..\
- ..%255c represents ..\

**Percent encoding (URL 인코딩):**
- ..%c0%af represents ../
- ..%c1%9c represents ..\

## 악성코드 (Malware)

### 종류별 특징

| 종류 | 특징 |
|------|------|
| **바이러스** | PC 내 스스로 복제, 파일 변조, 시스템 피해<br/>감염 대상이 있음 |
| **웜** | 메일, 네트워크로 전파<br/>시스템 장애 및 자료 파괴<br/>감염 대상 없음 |
| **트로이목마** | 메일, P2P 등을 통해 전파<br/>위장하여 정보 유출<br/>복제 능력 없음<br/>불법적인 접근 허용 |
| **스파이/애드웨어** | 광고기능<br/>사용자 정보 수집<br/>허위제품<br/>수익모델 |

### 악성코드 명명 진단명

```
Trojan/Win32.RL_Jorik.C4172791
    ↓           ↓
악성코드종류/운영체제종류/악성코드명/악성코드 크기
```

### 악성코드 종류

| 분류 | 내용 |
|------|------|
| **Exploit** (익스플로잇) | 운영체제나 특정 프로그램의 취약점을 이용하여 공격하는 악성코드 |
| **Adware** (애드웨어) | 악의적인 팝업 및 사이트 고정 등 일반적인 악성코드 |
| **Spyware** (스파이웨어) | 워딩요소와 함께 사용자의 정보수집의 기능을 가진 파일 |
| **W32/Win32** (바이러스) | MS 32bit기반 운영체제에서 동작하는 파일 감염 바이러스 |
| **Worm** (웜) | 네트워크 또는 이메일 등을 통하여 자체적으로 전파되는 악성코드<br/>예: e-mail 웜은 W32/Delf234@mm 어린식으로 명명 (mm이 붙임 없이마고함) |
| **Keylogger** (키로거) | 사용자의 키 입력을 입력 받아 자정해두는 역할 및 정보 유출을 가능성을 가진 파일 |
| **Joke** (조크) | 악의적인 기능은 없으나 사용자를 놀라게 하거나 장난으로 만들어진 파일 |
| **Constructor** (컨스트럭터) | 악의적인 기능의 프로그램을 쉽게 만들기 위해 제작된 프로그램 |
| **PP7M, XF, X97M, W97M** | 매크로 바이러스(ppt, hwrd, 엑셀 등등) |

## 마무리

웹 애플리케이션의 취약점은 사용자 입력 검증의 부재에서 시작됩니다. OS Command Injection은 시스템 명령어 실행을 허용하고, 디렉터리 인덱싱은 파일 구조를 노출하며, 정보 노출은 2차 공격의 발판이 됩니다. 철저한 입력 검증과 서버 설정의 안전성 확보가 필수적입니다.
