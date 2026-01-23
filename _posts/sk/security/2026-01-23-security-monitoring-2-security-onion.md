---
title: "보안 모니터링 2편: Security Onion 설치 및 OSINT 기초"
excerpt: "Security Onion 설치와 Sguil 설정, OSINT 도구 및 Shodan 검색 문법"

categories: security
tags: [보안모니터링, SecurityOnion, Suricata, OSINT, Shodan, sk]

date: 2026-01-23
last_modified_at: 2026-01-23
published: true
---

> **이전 편**: [보안 모니터링 1편: 실습 환경 구축](/categories/security/security-monitoring-1-environment/)

---

## 1. Security Onion 설치

Security Onion은 Ubuntu 기반에 Suricata(IDS), Sguil, NetworkMiner 등이 포함된 보안 모니터링 배포판이다.

### 1.1 VM 컨테이너 생성

1. VMware → **File** → **New Virtual Machine**
2. **Custom (advanced)** 선택 → Next
3. **I will install the operating system later** 선택
4. Guest OS: **Linux** / **Ubuntu 64-bit**
5. VM 이름: `SecurityOnion16`
6. Processors: **4 cores** (또는 가용 CPU에 맞게)
7. Memory: **8GB** (8192MB)
8. Network: **NAT**
9. 나머지 기본값 유지
10. Disk: **100GB**, Single file로 저장
11. Finish

---

### 1.2 ISO 연결 및 부팅

1. VM Settings → CD/DVD
2. **Use ISO image file** 선택 → Security Onion ISO 경로 지정
3. **Power on this virtual machine**

---

### 1.3 Ubuntu 기본 설치

1. 부팅 후 **Enter** (기본 옵션으로 설치)
2. 언어: **English** (설치는 영어로)
3. 키보드: **Korean** → **Korea**
4. 설치 타입: 기본값 유지
5. 사용자 설정:
   - 이름: `sguil`
   - 컴퓨터 이름: `sguil`
   - 비밀번호: 실습용 비밀번호 설정
   - **Log in automatically** 체크 (편의상)
6. 설치 완료 후 재부팅

> **주의**: 프로젝트 발표 시 자동 로그인, 간단한 비밀번호는 감점 요소. 실습 환경에서만 사용할 것.

---

### 1.4 Security Onion Setup 실행

바탕화면의 **Setup** 아이콘 더블클릭

1. 비밀번호 입력
2. **Yes, Continue** 클릭
3. 네트워크 설정: **Yes, configure /etc/network/interfaces**
4. 관리 인터페이스 선택: `ens32` 또는 `ens33` (본인 환경 확인)
5. **Static** IP 설정:
   - IP: `192.168.2.240`
   - Netmask: `255.255.255.0`
   - Gateway: `192.168.2.2`
   - DNS: `8.8.8.8`
   - Domain: `sguil.com` (임의 지정)
6. 재부팅

---

### 1.5 Sguil 설치

재부팅 후 다시 **Setup** 실행

1. **Yes, Continue**
2. 네트워크 설정: **Yes, skip network configuration** (이미 완료)
3. 설치 모드: **Production Mode** (아래쪽, 사용자 정의)
4. **New** 클릭하여 사용자 생성:
   - Username: `user1`
   - Password: 설정
5. Best Practices 선택 시: **Custom** (내용 확인용)
6. 이후 계속 **OK** / **Yes** 클릭
7. IDS Engine: **Suricata** 선택 (Snort보다 성능 우수)
8. HOME_NET 설정: 기본값 유지 (RFC 1918 사설 IP 대역)

---

### 1.6 RFC 1918 사설 IP 대역 (암기 필수)

| 클래스 | 대역 | CIDR |
|--------|------|------|
| A | 10.0.0.0/8 | 8비트 |
| B | 172.16.0.0/12 | 12비트 |
| C | 192.168.0.0/16 | 16비트 |

---

### 1.7 설치 확인 - Ping 테스트

```bash
# 터미널 열기: 바탕화면 우클릭 → Open Terminal

# 게이트웨이 ping
ping 192.168.2.2

# DNS 확인 (도메인으로 ping)
ping google.com
```

> IP로는 되는데 도메인으로 안 되면 DNS 설정 문제. `/etc/resolv.conf` 확인.

---

### 1.8 Sguil 테스트

```bash
# 테스트 트래픽 발생
curl http://testmynids.org/uid/index.html

# pcap 파일로 테스트 (시간 오래 걸림)
sudo tcpreplay --intf1=ens32 /path/to/sample.pcap
```

---

## 2. OSINT (Open Source Intelligence)

OSINT는 공개적으로 접근 가능한 정보를 수집·분석하여 인사이트를 도출하는 기법이다.

활용 분야: 군사, 정보기관, 보안, 기업 경쟁 분석, 사이버 보안, 법 집행 등

### 2.1 주요 OSINT 도구

| 도구 | URL | 용도 |
|------|-----|------|
| Criminal IP | https://www.criminalip.io/ko | IP/도메인 위협 인텔리전스 |
| OpenPhish | https://openphish.com | 피싱 URL 데이터베이스 |
| ExploitDB | https://www.exploit-db.com | 취약점/익스플로잇 DB |
| VirusTotal | https://www.virustotal.com | 파일/URL 악성코드 검사 |
| Shodan | https://shodan.io | 인터넷 연결 장치 검색 엔진 |

**테스트용 취약한 사이트**:
- `demo.owasp-juice.shop`
- `testphp.vulnweb.com`

---

## 3. Shodan 검색 문법

Shodan은 인터넷에 연결된 장치(서버, IoT, 카메라 등)를 검색하는 엔진이다.

### 3.1 기본 검색 옵션

| 옵션 | 설명 | 예시 |
|------|------|------|
| `hostname` | 호스트명 포함 | `hostname:"google"` |
| `country` | 국가 코드 | `country:"KR"` |
| `city` | 도시명 | `city:"Seoul"` |
| `port` | 포트 번호 | `port:8080` |
| `product` | 소프트웨어/제품명 | `product:"Apache"` |
| `os` | 운영체제 | `os:"Ubuntu"` |
| `net` | IP 대역 | `net:192.168.1.0/24` |
| `org` | 기관명 | `org:"Korea Telecom"` |
| `title` | HTML 타이틀 | `title:"ipTIME"` |
| `html` | HTML 소스 내 문자열 | `html:"login"` |
| `vuln` | CVE 취약점 | `vuln:CVE-2021-44228` |
| `has_screenshot` | 스크린샷 유무 | `has_screenshot:true` |

---

### 3.2 실전 검색 예제

**MongoDB 인증 없이 노출된 서버 (한국)**
```
mongodb country:KR port:27017 -authentication
```

**익명 FTP 로그인 가능한 서버**
```
"230 Login Successful" port:21
port:21 anonymous user logged in country:"KR"
```

**스크린샷이 있는 웹캠 (한국)**
```
webcam country:"KR" has_screenshot:true
port:554 has_screenshot:true country:"KR"
```

**공유기 관리 페이지 노출**
```
title:"ipTIME" country:"KR" city:"Seoul"
title:"NETGEAR Router" country:"KR"
http.title:"Router" country:"KR"
```

**AWS S3 버킷 노출**
```
hostname:"s3-website-ap-northeast-2.amazonaws.com"
"Server: AmazonS3" "200 OK" country:"KR"
```

**SSH 기본 포트 외 사용**
```
product:openssh -port:22
```

> **추가 도구**: https://buckets.grayhatwarfare.com/ - 공개된 S3 버킷 검색

---

## 4. 부록: 주요 암기 사항

### 포트 번호

| 포트 | 서비스 |
|------|--------|
| 20, 21 | FTP |
| 22 | SSH |
| 23 | Telnet |
| 25 | SMTP |
| 53 | DNS |
| 80 | HTTP |
| 443 | HTTPS |
| 3306 | MySQL |
| 3389 | RDP |
| 8080 | HTTP Proxy |

### 해시 길이

| 알고리즘 | 16진수 자릿수 |
|----------|---------------|
| MD5 | 32자리 |
| SHA-1 | 40자리 |
| SHA-256 | 64자리 |

---

**다음 편**: [보안 모니터링 3편: Wireshark 패킷 분석](/categories/security/security-monitoring-3-wireshark/)
