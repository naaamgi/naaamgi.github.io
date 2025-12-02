---
title: "리눅스 (7) - 방화벽 설정"
excerpt: ".."

categories: linux
typora-root-url: ../../
published: true
date: 2025-11-22
last_modified_at: 2025-11-22
tags: [linux, firewall, ufw, firewalld, iptables, security, sk]
---

## 전체 흐름 요약

이 글은 리눅스 학습 시리즈의 일곱 번째 파트로, 방화벽 설정과 관리를 다룹니다. 방화벽의 기본 개념과 종류를 이해하고, 데비안/우분투의 UFW와 CentOS/RHEL의 firewalld를 모두 다룹니다. 각 시스템에 맞는 방화벽 명령어와 실무에서 자주 사용하는 설정 예시를 포함하여 즉시 활용할 수 있도록 구성했습니다.

---

## 방화벽 개념

### 방화벽이란?

**Firewall**
- 네트워크 트래픽을 모니터링하고 정해진 보안 규칙을 기반(IP, Port)으로 특정 트래픽의 허용 또는 차단을 결정하는 네트워크 보안 시스템

**방화벽 위치**
```mermaid
graph LR
    A[인터넷] -->|공격| B[방화벽]
    B -->|필터링| C[내부 네트워크]
    C --> D[서버/PC]
```

### 방화벽 주요 기능 5가지

1. **접근 통제**
   - 외부에서 내부 네트워크에 접속하는 패킷을 필터링하여 통제

2. **패킷 필터링**
   - IP 주소, 포트 번호, 프로토콜 기반으로 패킷 허용/차단

3. **사용자 인증**
   - 침입차단 시스템을 지나는 트래픽에 대한 사용자 신분 증명

4. **감사 및 로그 기능**
   - 모든 트래픽에 대한 접속 정보 및 통계 정보 기록

5. **NAT 기능**
   - 사설 IP를 공인 IP로 변환

### 방화벽 한계점

- 침입 알림 기능 없음 (IDS/IPS와 다름)
- 우회 경로 백도어 방어 불가
- 이메일 바이러스 검색 불가능
- 내부 사용자에 의한 보안 침해 방어 불가능

---

## 방화벽 종류

### 1. Packet Filtering 방화벽

**특징**
- OSI 3계층(네트워크 계층)에서 동작
- IP 주소와 Port 번호만 검사
- **가장 일반적인 방화벽**

**장점**
- 빠른 처리 속도
- 구현이 간단

**단점**
- 세션 관리 불가
- 애플리케이션 내용 참조 불가
- Incoming/Outgoing에 별도 규칙 필요

### 2. Application Gateway 방화벽 (Application Proxy)

**특징**
- OSI 7계층(응용 계층)에서 동작
- Proxy를 통한 간접 연결
- 내부 IP 주소 숨김 가능

**장점**
- 높은 보안성
- 강력한 로깅 및 감사 기능
- 사용자 인증 지원

**단점**
- 느린 성능
- 서비스별 Proxy 필요

### 3. Circuit Gateway 방화벽

**특징**
- OSI 5계층(세션)과 7계층 사이에서 동작
- 범용 Proxy 사용

**장점**
- 내부 IP 숨김 가능
- 투명한 서비스 제공

**단점**
- 클라이언트에 수정된 프로그램 설치 필요

### 4. Stateful Inspection 방화벽 ⭐

**특징**
- Packet Filtering + Application Gateway의 장점 결합
- **현재 대부분의 방화벽이 이 방식 사용**
- 프로토콜 상태 정보 테이블 유지
- 동적 규칙 생성

**장점**
- Outgoing 트래픽에 대한 별도 규칙 불필요
- 자동으로 반환 패킷 허용
- 세션 상태 추적

**단점**
- 데이터 내부의 악의적 정보 대응 어려움

---

## 리눅스 배포판별 방화벽

| 배포판 | 방화벽 도구 | 명령어 | 특징 |
|--------|-------------|--------|------|
| **Debian/Ubuntu** | UFW | `ufw` | 간단한 문법, 초보자 친화적 |
| **CentOS/RHEL** | firewalld | `firewall-cmd` | Zone 기반, 동적 관리 |
| **공통** | iptables | `iptables` | 저수준, 복잡하지만 강력 |

**참고**: UFW와 firewalld 모두 내부적으로 iptables(Netfilter)를 사용합니다.

---

## UFW (Debian/Ubuntu 방화벽)

### UFW 기본 설정

**UFW란?**
- Uncomplicated Firewall의 약자
- iptables를 쉽게 관리하기 위한 프론트엔드
- 데비안/우분투의 기본 방화벽

**UFW 설치 및 활성화**
```bash
# UFW 설치 (보통 기본 설치됨)
sudo apt update
sudo apt install ufw

# UFW 상태 확인
sudo ufw status

# UFW 활성화
sudo ufw enable

# UFW 비활성화
sudo ufw disable

# 상세 상태 확인
sudo ufw status verbose
```

### UFW 기본 정책 설정

```bash
# 기본 정책: 모든 들어오는 연결 차단
sudo ufw default deny incoming

# 기본 정책: 모든 나가는 연결 허용
sudo ufw default allow outgoing

# 기본 정책 확인
sudo ufw status verbose
```

### UFW 포트 허용/차단

**포트 허용**
```bash
# SSH 포트 허용 (22)
sudo ufw allow 22
sudo ufw allow ssh

# HTTP 포트 허용 (80)
sudo ufw allow 80
sudo ufw allow http

# HTTPS 포트 허용 (443)
sudo ufw allow 443
sudo ufw allow https

# 특정 포트 허용
sudo ufw allow 8080

# 포트 범위 허용
sudo ufw allow 6000:6007/tcp
sudo ufw allow 6000:6007/udp

# TCP만 허용
sudo ufw allow 22/tcp

# UDP만 허용
sudo ufw allow 53/udp
```

**포트 차단**
```bash
# 특정 포트 차단
sudo ufw deny 23

# Telnet 차단
sudo ufw deny telnet

# TCP 포트 차단
sudo ufw deny 3306/tcp
```

### UFW IP 기반 규칙

```bash
# 특정 IP 허용
sudo ufw allow from 192.168.1.100

# 특정 IP 차단
sudo ufw deny from 203.0.113.100

# 특정 IP에서 특정 포트로 접속 허용
sudo ufw allow from 192.168.1.100 to any port 22

# 특정 서브넷 허용
sudo ufw allow from 192.168.1.0/24

# 특정 IP에서 특정 네트워크 인터페이스로 접속 허용
sudo ufw allow in on eth0 from 192.168.1.100
```

### UFW 규칙 관리

```bash
# 규칙 목록 확인 (번호 포함)
sudo ufw status numbered

# 특정 규칙 삭제 (번호로)
sudo ufw delete 3

# 규칙 삭제 (내용으로)
sudo ufw delete allow 80

# 모든 규칙 초기화
sudo ufw reset

# 규칙 삽입 (특정 위치에)
sudo ufw insert 1 allow from 192.168.1.100
```

### UFW 실무 조합 예시

```bash
# 웹 서버 기본 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# SSH는 특정 IP에서만 허용
sudo ufw delete allow ssh
sudo ufw allow from 192.168.1.0/24 to any port 22

# MySQL은 로컬호스트에서만 접속
sudo ufw allow from 127.0.0.1 to any port 3306

# 특정 IP 차단 (공격자)
sudo ufw deny from 203.0.113.50

# 로깅 활성화
sudo ufw logging on
sudo ufw logging high

# 상태 확인
sudo ufw status numbered
```

---

## firewalld (CentOS/RHEL 방화벽)

### firewalld 기본 개념

**firewalld란?**
- iptables를 대체하기 위해 나온 동적 방화벽
- Zone 기반 관리
- 서비스 재시작 없이 규칙 변경 가능

**firewalld 구성 요소**
- firewalld 데몬
- firewall-cmd (CLI 명령어)
- firewall-config (GUI)

### firewalld 설치 및 활성화

```bash
# firewalld 설치
sudo yum install firewalld

# firewalld 시작
sudo systemctl start firewalld

# 부팅 시 자동 시작
sudo systemctl enable firewalld

# 상태 확인
sudo systemctl status firewalld
sudo firewall-cmd --state

# 버전 확인
sudo firewall-cmd --version
```

### firewalld Zone 개념

**Zone이란?**
- 네트워크 연결에 대한 신뢰 정도를 정의
- 신뢰도에 따라 다른 규칙 적용

**주요 Zone**

| Zone | 신뢰도 | 설명 |
|------|--------|------|
| **drop** | 최저 | 모든 연결 차단, 응답 없음 |
| **block** | 낮음 | 모든 연결 차단, 거부 응답 전송 |
| **public** | 보통 | 기본 Zone, 선택된 연결만 허용 |
| **external** | 보통 | 외부 라우터용, NAT 사용 |
| **dmz** | 보통 | DMZ 용, 제한적 접근 |
| **work** | 높음 | 회사 네트워크 |
| **home** | 높음 | 가정 네트워크 |
| **internal** | 높음 | 내부 네트워크 |
| **trusted** | 최고 | 모든 연결 허용 |

### firewalld 기본 명령어

```bash
# 현재 기본 Zone 확인
sudo firewall-cmd --get-default-zone

# 기본 Zone 변경
sudo firewall-cmd --set-default-zone=public

# 활성화된 Zone 확인
sudo firewall-cmd --get-active-zones

# 모든 Zone 목록
sudo firewall-cmd --get-zones

# 특정 Zone의 규칙 확인
sudo firewall-cmd --zone=public --list-all
```

### firewalld 포트 관리

**포트 허용/차단**
```bash
# 포트 열기 (임시)
sudo firewall-cmd --add-port=80/tcp

# 포트 열기 (영구)
sudo firewall-cmd --add-port=80/tcp --permanent

# 포트 범위 열기
sudo firewall-cmd --add-port=6000-6007/tcp --permanent

# 포트 확인
sudo firewall-cmd --list-ports

# 포트 닫기
sudo firewall-cmd --remove-port=80/tcp --permanent

# 설정 다시 로드
sudo firewall-cmd --reload
```

### firewalld 서비스 관리

```bash
# 사용 가능한 서비스 목록
sudo firewall-cmd --get-services

# 서비스 추가 (HTTP)
sudo firewall-cmd --add-service=http --permanent

# 여러 서비스 동시 추가
sudo firewall-cmd --add-service={http,https,ssh} --permanent

# 현재 허용된 서비스 확인
sudo firewall-cmd --list-services

# 서비스 제거
sudo firewall-cmd --remove-service=http --permanent

# 설정 적용
sudo firewall-cmd --reload
```

### firewalld 실무 조합 예시

```bash
# 웹 서버 설정
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# SSH 포트 변경 (9999)
sudo firewall-cmd --permanent --add-port=9999/tcp
sudo firewall-cmd --permanent --remove-service=ssh
sudo firewall-cmd --reload

# 특정 IP만 SSH 허용
sudo firewall-cmd --permanent --zone=public --add-rich-rule='rule family="ipv4" source address="192.168.1.100" port protocol="tcp" port="22" accept'

# 특정 IP 차단
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="203.0.113.50" reject'

# 포트 포워딩 (80 → 8080)
sudo firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=8080

# 모든 설정 확인
sudo firewall-cmd --list-all

# 설정 적용
sudo firewall-cmd --reload
```

---

## 배포판별 명령어 비교

### 웹 서버 방화벽 설정 비교

**Debian/Ubuntu (UFW)**
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

**CentOS/RHEL (firewalld)**
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 특정 포트 허용 비교

**Debian/Ubuntu (UFW)**
```bash
sudo ufw allow 8080/tcp
```

**CentOS/RHEL (firewalld)**
```bash
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 특정 IP 허용 비교

**Debian/Ubuntu (UFW)**
```bash
sudo ufw allow from 192.168.1.100
```

**CentOS/RHEL (firewalld)**
```bash
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.100" accept'
sudo firewall-cmd --reload
```

---

## iptables (저수준 방화벽)

### iptables 기본 개념

**iptables란?**
- 리눅스 커널의 Netfilter 모듈을 제어하는 도구
- UFW와 firewalld는 모두 iptables를 래핑한 도구
- 강력하지만 복잡한 문법

**iptables 체인**
- **INPUT**: 들어오는 패킷
- **OUTPUT**: 나가는 패킷
- **FORWARD**: 포워딩되는 패킷

### iptables 기본 명령어

```bash
# 현재 규칙 확인
sudo iptables -L
sudo iptables -L -v -n

# 특정 포트 허용
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# 특정 IP 허용
sudo iptables -A INPUT -s 192.168.1.100 -j ACCEPT

# 특정 IP 차단
sudo iptables -A INPUT -s 203.0.113.50 -j DROP

# 모든 규칙 삭제
sudo iptables -F

# 규칙 저장 (Debian/Ubuntu)
sudo iptables-save > /etc/iptables/rules.v4

# 규칙 저장 (CentOS/RHEL)
sudo service iptables save
```

**참고**: 직접 iptables를 사용하는 것보다 UFW나 firewalld 사용을 권장합니다.

---

## 실무 시나리오

### 시나리오 1: 웹 서버 기본 방화벽 설정

**요구사항**
- SSH, HTTP, HTTPS만 허용
- 다른 모든 포트 차단

**Debian/Ubuntu (UFW)**
```bash
# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필요한 포트 허용
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# 방화벽 활성화
sudo ufw enable

# 확인
sudo ufw status
```

**CentOS/RHEL (firewalld)**
```bash
# 서비스 허용
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 적용
sudo firewall-cmd --reload

# 확인
sudo firewall-cmd --list-all
```

### 시나리오 2: SSH 포트 변경 및 특정 IP만 허용

**요구사항**
- SSH 포트를 9999로 변경
- 관리자 IP(192.168.1.100)에서만 SSH 접속 허용

**Debian/Ubuntu (UFW)**
```bash
# 기존 SSH 규칙 삭제
sudo ufw delete allow ssh

# 특정 IP에서 특정 포트로만 SSH 허용
sudo ufw allow from 192.168.1.100 to any port 9999 proto tcp

# 확인
sudo ufw status numbered
```

**CentOS/RHEL (firewalld)**
```bash
# 기존 SSH 서비스 제거
sudo firewall-cmd --permanent --remove-service=ssh

# 특정 IP와 포트 허용
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.100" port protocol="tcp" port="9999" accept'

# 적용
sudo firewall-cmd --reload
```

### 시나리오 3: MySQL 서버 방화벽 설정

**요구사항**
- MySQL은 내부 네트워크(192.168.1.0/24)에서만 접속
- 웹 서버는 공개

**Debian/Ubuntu (UFW)**
```bash
# 웹 서비스 허용
sudo ufw allow http
sudo ufw allow https

# MySQL은 내부 네트워크에서만
sudo ufw allow from 192.168.1.0/24 to any port 3306

sudo ufw enable
```

**CentOS/RHEL (firewalld)**
```bash
# 웹 서비스 허용
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# MySQL 내부 네트워크 허용
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" port protocol="tcp" port="3306" accept'

sudo firewall-cmd --reload
```

---

## 주요 개념 요약표

| 개념 | 설명 | 핵심 키워드 |
|------|------|-------------|
| **방화벽** | 네트워크 트래픽 필터링 | 접근 통제, 패킷 필터링 |
| **UFW** | 데비안/우분투 방화벽 | 간단한 문법, 초보자 친화적 |
| **firewalld** | CentOS/RHEL 방화벽 | Zone 기반, 동적 관리 |
| **iptables** | 저수준 방화벽 도구 | Netfilter, 복잡하지만 강력 |
| **Zone** | 신뢰도 기반 네트워크 구분 | public, dmz, trusted 등 |
| **Stateful Inspection** | 현대 방화벽 방식 | 상태 추적, 동적 규칙 |
| **--permanent** | firewalld 영구 설정 | 재부팅 후에도 유지 |
| **default deny** | 기본 차단 정책 | 화이트리스트 방식 |

---
