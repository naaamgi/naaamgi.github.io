---
title: "보안 모니터링 3편: Wireshark 패킷 분석"
excerpt: "Wireshark 필터 문법, Display Filter, 패킷 분석 실습 및 보고서 작성"

categories: security
tags: [보안모니터링, Wireshark, 패킷분석, 필터, sk]

date: 2026-01-23
last_modified_at: 2026-01-23
published: true
---

> **이전 편**: [보안 모니터링 2편: Security Onion 설치 및 OSINT 기초](/categories/security/security-monitoring-2-security-onion/)

---

## 1. 필터 종류

Wireshark에는 두 가지 필터가 있다:

| 구분 | Capture Filter | Display Filter |
|------|----------------|----------------|
| 적용 시점 | 캡처 전 | 캡처 후 |
| 용도 | 특정 트래픽만 수집 | 수집된 패킷 중 원하는 것만 표시 |
| 문법 | BPF 문법 | Wireshark 전용 문법 |

---

## 2. Capture Filter 문법

캡처 시작 전에 설정하며, 불필요한 트래픽을 제외하고 수집한다.

| 필터 | 설명 |
|------|------|
| `host 192.168.1.1` | 특정 IP 관련 트래픽 |
| `port 80` | 특정 포트 |
| `tcp` | TCP 프로토콜만 |
| `udp` | UDP 프로토콜만 |
| `net 192.168.1.0/24` | 특정 대역 |
| `ether host 00:0C:29:E1:D8:E8` | 특정 MAC 주소 |
| `less 100` | 100바이트 이하 패킷만 |

---

## 3. Display Filter 문법

캡처 후 원하는 패킷만 화면에 표시한다.

### 3.1 IP 필터

| 필터 | 설명 |
|------|------|
| `ip.addr == 192.168.1.1` | 출발지 또는 목적지가 해당 IP |
| `ip.src == 192.168.1.1` | 출발지만 |
| `ip.dst == 192.168.1.1` | 목적지만 |
| `ip.addr != 192.168.1.1` | 해당 IP 제외 |
| `ip.src == 192.168.1.0/24` | 출발지가 해당 대역 |

### 3.2 포트/프로토콜 필터

| 필터 | 설명 |
|------|------|
| `tcp.port == 80` | TCP 80 포트 |
| `udp.port == 53` | UDP 53 포트 (DNS) |
| `!tcp.port == 80` | TCP 80 제외 |
| `tcp` | TCP 프로토콜 |
| `http` | HTTP 트래픽 |
| `dns` | DNS 트래픽 |

### 3.3 HTTP 필터

| 필터 | 설명 |
|------|------|
| `http.request.method == "GET"` | GET 요청 |
| `http.request.method == "POST"` | POST 요청 |
| `http.host == "example.com"` | 특정 호스트 |
| `http.request.uri contains "login"` | URI에 특정 문자열 |
| `http.response.code == 200` | 응답 코드 |
| `http.response.code == 404` | 404 에러 |

### 3.4 기타 유용한 필터

| 필터 | 설명 |
|------|------|
| `frame.len <= 128` | 128바이트 이하 프레임 |
| `eth.addr == 00:0C:29:E1:D8:E8` | 특정 MAC 주소 |
| `tcp &#124;&#124; http` | TCP 또는 HTTP |
| `http && !(udp.port == 1900)` | HTTP 중 SSDP 제외 |
| `http && image-gif` | GIF 이미지 포함 HTTP |

---

## 4. 조합 필터 예시

**특정 두 IP 간의 통신**
```
ip.addr == 192.168.206.152 && ip.addr == 192.168.206.154
```

**특정 서버로의 HTTP 요청**
```
http && ip.addr == 192.168.206.154
```

**특정 URI 패턴 검색**
```
http.host == "192.168.206.154" && http.request.uri contains "php-backdoor.php"
```

**POST 요청 또는 폼 데이터**
```
http.request.method == "POST" || http contains "application/x-www-form-urlencoded"
```

---

## 5. 포트 번호 범위 (암기)

| 범위 | 이름 | 설명 |
|------|------|------|
| 0 ~ 1023 | Well-known Ports | 주요 서비스 (HTTP:80, HTTPS:443, SSH:22 등) |
| 1024 ~ 49151 | Registered Ports | 등록된 애플리케이션 |
| 49152 ~ 65535 | Dynamic Ports | 클라이언트 임시 포트 |

**통신 방향 이해**:
- Client → Server: 출발지(랜덤 포트) → 목적지(Well-known 포트)
- Server → Client: 출발지(Well-known 포트) → 목적지(랜덤 포트)

---

## 6. 패킷 분석 실습 문제

### 6.1 실습 1: samplepacket1.zip

**분석 항목**:
1. 공격자의 IP 주소는?
2. 공격자 서비스에 접속하기 위해 사용한 계정 정보는?
3. 공격자가 사용한 대상 URL은?
4. 공격자가 사용한 파일 이름은?
5. 공격자가 획득한 개인 정보는?
6. 공격자가 시스템 침투 후 실행한 명령어는?

**분석 팁 - line-based text data에서 찾을 수 있는 것들**:
- SQL Injection: `union select`, `' or 1=1`
- XSS/웹쉘: `<script>`, `onerror=`, `<img src=javascript:`
- 원격 명령 실행: `cmd.exe`, `powershell`, `wget`, `curl http://`
- 봇넷 명령: `bot`, `!download`, `!scan`

---

### 6.2 실습 2: samplepacket2.zip

**분석 항목**:
1. 공격에 성공한 공격자의 IP
2. 공격자 이외 서비스에 접근한 IP
3. 공격자가 침투하기 위해 접근한 서비스 포트
4. 공격자가 이용한 취약점
5. 공격자가 리버스 공격을 위해 사용한 포트
6. 공격자가 올린 웹쉘의 이름과 MD5 해시값 (파일 복원 필요)
7. 공격자가 웹쉘 업로드 후 사용한 명령어들

**유용한 필터**:
```
# Tomcat Manager 업로드 시도
http.request.uri contains "/manager/html/upload"

# 웹쉘 접근
http.request.uri contains "/attack/shell.jsp"

# 인증 실패
http.response.code == 401

# 404 에러
http.response.code == 404
```

---

## 7. 분석 보고서 작성

**포함할 내용**:

1. **분석 개요**: 분석 환경, 운영체제, 사용 도구
2. **분석 결과**: 주요 발견 사항 요약
3. **세부 분석 과정**: 단계별 분석 내용, 스크린샷
4. (옵션) 결론 및 대응 방안

---

## 8. 부록: 해시값 길이 (암기)

악성코드 분석 시 파일 해시값 확인에 사용:

| 알고리즘 | 비트 | 16진수 자릿수 |
|----------|------|---------------|
| MD5 | 128bit | 32자리 |
| SHA-1 | 160bit | 40자리 |
| SHA-256 | 256bit | 64자리 |

---

**다음 편**: [보안 모니터링 4편: Snort/Suricata IDS 규칙 작성](/categories/security/security-monitoring-4-ids-rules/)
