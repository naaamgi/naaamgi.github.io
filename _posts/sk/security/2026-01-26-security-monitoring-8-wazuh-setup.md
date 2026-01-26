---
title: "보안 모니터링 8편: Wazuh 설치 및 Agent 연동"
excerpt: "Wazuh 서버 설치, Agent/Agentless 등록, Windows Sysmon 연동"

categories: security
tags: [보안모니터링, Wazuh, HIDS, Sysmon, SIEM, sk]

date: 2026-01-26
last_modified_at: 2026-01-26
published: true
---

> **이전 편**: [보안 모니터링 7편: Splunk Forwarder & Wazuh](/categories/security/security-monitoring-7-forwarder-wazuh/)

---

## 1. Wazuh 개요

### 1.1 Wazuh란?

- **OSSEC 기반의 HIDS** (Host-based Intrusion Detection System)
- **위협 헌팅(Threat Hunting)** 시 블루팀이 사용하는 보안 모니터링 도구
- 엔드포인트 보안 + 로그 관리 + 취약점/컴플라이언스 + 대시보드를 포함한 **올인원 SIEM**

### 1.2 Wazuh 구성 요소

| 구성요소 | 역할 |
|----------|------|
| **Wazuh Manager** | 에이전트 관리, 룰 처리, 알람 생성 |
| **Elasticsearch** | 로그/이벤트 저장, 검색 엔진 (DB 역할) |
| **Kibana** | 웹 대시보드 UI |
| **Filebeat** | 로그 수집 및 전달 |

### 1.3 실습 환경

| 역할 | IP | 호스트명 | 형태 |
|------|-----|----------|------|
| Wazuh Server | 192.168.2.10 | wazuh-server | 서버 |
| Agent 1 (Ubuntu) | 192.168.2.11 | wazuh-agent1 | Agent 형태 |
| Agent 2 (Ubuntu) | 192.168.2.12 | wazuh-agent2 | Agentless 형태 |
| Agent 3 (Windows) | 192.168.2.13 | (Windows) | Agent 형태 |

### 1.4 Agent vs Agentless

| 방식 | 설명 | 장단점 |
|------|------|--------|
| **Agent 형태** | 클라이언트에 프로그램 설치 | 상세 모니터링 가능, 설치 필요 |
| **Agentless 형태** | 서버에서 SSH로 원격 모니터링 | 설치 불필요, 제한적 모니터링 |

---

## 2. Wazuh 서버 설치

### 2.1 사전 준비

#### 호스트명 변경

```bash
# 서버
sudo hostnamectl set-hostname wazuh-server

# Agent 1
sudo hostnamectl set-hostname wazuh-agent1

# Agent 2
sudo hostnamectl set-hostname wazuh-agent2
```

> **중요**: 서버와 Agent의 호스트명이 같으면 충돌 발생!

#### IP 고정 (Netplan)

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens32:
      dhcp4: no
      addresses:
        - 192.168.2.10/24
      gateway4: 192.168.2.2
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

```bash
sudo netplan apply
```

### 2.2 Wazuh 설치 스크립트

```bash
sudo -i
mkdir /wazuh && cd /wazuh

# 설치 스크립트 다운로드 및 실행
curl -sO https://packages.wazuh.com/resources/4.2/open-distro/unattended-installation/unattended-installation.sh
bash unattended-installation.sh -i
```

> `-s`: Silent Mode, `-o`: Output 파일명, `-i`: Install

설치 완료 시 자동 설치되는 항목:
- Elasticsearch (로그 저장/검색)
- Kibana (웹 대시보드)
- Filebeat (로그 전달)
- Wazuh Manager

### 2.3 비밀번호 변경

```bash
# 비밀번호 변경 도구 다운로드
curl -sO https://packages.wazuh.com/resources/4.2/open-distro/tools/wazuh-passwords-tool.sh

# 이름 변경 및 실행 권한 부여
mv wazuh-passwords-tool.sh wazuh-passwords-tools.sh
chmod +x wazuh-passwords-tools.sh

# 비밀번호 변경 (wazuh / 123456)
./wazuh-passwords-tools.sh -u wazuh -p 123456
```

### 2.4 서비스 확인 및 재시작

```bash
# 서비스 상태 확인
systemctl status kibana
systemctl status elasticsearch
systemctl status filebeat
systemctl status wazuh-manager

# 서비스 재시작 (설정 변경 후 필수)
systemctl restart kibana
systemctl restart elasticsearch
systemctl restart filebeat
systemctl restart wazuh-manager

# 부팅 시 자동 시작
systemctl enable kibana elasticsearch filebeat wazuh-manager
```

### 2.5 웹 접속

```
https://192.168.2.10
```

- **Username**: wazuh
- **Password**: 123456

> 인증서 경고 시: 고급 → 안전하지 않음 진행

---

## 3. Agent 등록 - Windows (agent형태)

### 3.1 Windows IP 설정

```
ncpa.cpl → 이더넷 → 속성 → IPv4
- IP: 192.168.2.13
- 서브넷: 255.255.255.0
- 게이트웨이: 192.168.2.2
- DNS: 8.8.8.8
```

### 3.2 Agent 등록 (웹 UI)

1. Wazuh 웹 → 메뉴 → **Wazuh** → **Agents**
2. **Deploy new agent** 클릭
3. **Windows** 선택
4. Server address: `192.168.2.10`
5. 그룹: Default
6. 생성된 명령어 복사

### 3.3 PowerShell에서 설치

```powershell
# 관리자 권한으로 PowerShell 실행
# 웹에서 복사한 명령어 붙여넣기
Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.x.x-1.msi ...
```

### 3.4 수동 설치 (명령어 실패 시)

1. C 드라이브에서 `wazuh-agent` 검색
2. MSI 파일 더블클릭
3. 동의 → Install

### 3.5 Agent 확인

- Wazuh 웹 → Agents → 새로고침
- Windows Agent가 등록되어 있으면 성공

---

## 4. Agent 등록 - Ubuntu (agent형태)

### 4.1 Agent 등록 명령어

Wazuh 웹 → Deploy new agent → **DEB amd64** 선택 → 명령어 복사

```bash
# wazuh-agent1 (192.168.2.11)에서 실행
mkdir /wazuh && cd /wazuh

# 복사한 명령어 붙여넣기 (예시)
curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.x.x-1_amd64.deb
dpkg -i wazuh-agent.deb

# 서비스 시작
systemctl daemon-reload
systemctl enable wazuh-agent
systemctl start wazuh-agent
systemctl status wazuh-agent
```

### 4.2 등록 확인

- Wazuh 웹 → Agents → 새로고침
- Ubuntu Agent가 "Active"로 표시되면 성공

---

## 5. Agentless 등록 - Ubuntu

### 5.1 Agentless란?

- 클라이언트에 아무것도 설치하지 않음
- **서버에서 SSH로 원격 접속**하여 모니터링
- 대표적인 Agentless 도구: Ansible, Terraform

### 5.2 SSH 설정 (Agent 2)

```bash
# wazuh-agent2 (192.168.2.12)에서 실행

# SSH 서버 설치
apt install -y openssh-server

# 사용자 생성
adduser wazuh
# 비밀번호: 123456

# sudo 권한 부여
nano /etc/sudoers
# 추가: wazuh ALL=(ALL:ALL) ALL

# SSH 설정
nano /etc/ssh/sshd_config
```

**sshd_config 수정** (샵 제거 및 수정):
```
Port 22
ListenAddress 0.0.0.0
PermitRootLogin yes
PasswordAuthentication yes
```

```bash
# SSH 재시작
systemctl restart sshd
systemctl enable sshd
systemctl status sshd
```

### 5.3 SSH 연결 테스트 (서버에서)

```bash
# wazuh-server에서 실행
ssh wazuh@192.168.2.12
# 비밀번호: 123456
# 연결 성공 시 exit으로 빠져나옴
```

> SSH 연결이 되어야만 Agentless 등록 가능!

### 5.4 Agentless 호스트 등록

```bash
# wazuh-server에서 실행
cd /var/ossec/agentless

# 호스트 등록
./register_host.sh add wazuh@192.168.2.12 123456

# 등록 확인
./register_host.sh list
```

### 5.5 expect 패키지 설치

```bash
# 필수! 없으면 Agentless 동작 안 함
apt install -y expect
```

### 5.6 ossec.conf 설정

```bash
nano -l /var/ossec/etc/ossec.conf
```

**맨 끝에 추가** (Alt + / 로 맨 끝 이동):

```xml
<agentless>
  <type>ssh_generic_diff</type>
  <frequency>10</frequency>
  <host>wazuh@192.168.2.12</host>
  <state>periodic_diff</state>
  <arguments>ls -al /</arguments>
</agentless>
```

| 태그 | 설명 |
|------|------|
| `<type>ssh_generic_diff</type>` | SSH로 접속해서 명령 실행 후 이전 결과와 비교 |
| `<frequency>10</frequency>` | 10초마다 실행 (테스트용, 실제는 더 길게) |
| `<host>` | SSH 접속 정보 |
| `<state>periodic_diff</state>` | 변경분만 알림 |
| `<arguments>` | 원격에서 실행할 명령 |

### 5.7 Wazuh 재시작 및 확인

```bash
# 재시작
cd /var/ossec/bin
./wazuh-control restart

# 로그 확인 (PASS 확인)
tail -f /var/ossec/logs/ossec.log
```

**성공 시 출력**:
```
ossec-agentlessd: Test passed for 'ssh_generic_diff' on 'wazuh@192.168.2.12'
```

### 5.8 테스트

```bash
# wazuh-agent1에서 agent2로 접속하여 파일 생성
ssh wazuh@192.168.2.12
sudo touch /webshell.txt
exit
```

**로그 확인 (서버)**:
```bash
cat /var/ossec/logs/alerts/alerts.json | grep webshell
```

**웹 UI 확인**:
- Kibana → Discover → "webshell" 검색
- "Change detected" 메시지 확인

### 5.9 추가 모니터링 설정

```xml
<!-- /etc/passwd 변화 감지 -->
<agentless>
  <type>ssh_generic_diff</type>
  <frequency>10</frequency>
  <host>wazuh@192.168.2.12</host>
  <state>periodic_diff</state>
  <arguments>tail -n 1 /etc/passwd</arguments>
</agentless>

<!-- /etc/shadow 변화 감지 -->
<agentless>
  <type>ssh_generic_diff</type>
  <frequency>10</frequency>
  <host>wazuh@192.168.2.12</host>
  <state>periodic_diff</state>
  <arguments>tail -n 1 /etc/shadow</arguments>
</agentless>
```

---

## 6. Windows Sysmon 설치 및 연동

### 6.1 Sysmon이란?

- **Microsoft 제공** 무료 도구
- Windows 활동을 **상세하게 로깅**
- Wazuh와 연동 시 **고급 위협 탐지** 가능

**Sysmon 주요 기능**:
- 프로세스 생성/종료 로깅
- 네트워크 연결 로깅
- 파일 생성 시간 변경 로깅
- 드라이버/이미지 로딩 로깅
- **Hash값 로깅** (악성파일 탐지)
- **프로세스 부모-자식 관계** 표시

### 6.2 Sysmon 다운로드

1. Google에서 `sysmon microsoft` 검색
2. https://learn.microsoft.com/ko-kr/sysinternals/downloads/sysmon
3. **Download Sysmon** 클릭
4. 압축 해제

### 6.3 Sysmon 설치

```cmd
# CMD 관리자 권한으로 실행
cd C:\Users\[사용자]\Downloads\Sysmon

# 설치 (EULA 자동 동의)
Sysmon64.exe -accepteula -i
```

### 6.4 Sysmon Config 다운로드

GitHub에서 설정 파일 다운로드:
- https://github.com/sametsazak/sysmon
- `sysmon.xml` 다운로드 (클라이언트 측 설정)
- `sysmon_rules.xml` 다운로드 (서버 측 룰)

### 6.5 Sysmon Config 수정

`sysmon.xml`을 메모장으로 열어 다음 내용 추가 (43-44번 줄 근처):

```xml
<ProcessCreate onmatch="include">
  ...
  <CommandLine condition="contains">cmd.exe /c dir</CommandLine>
  <CommandLine condition="contains">cmd.exe /c ping</CommandLine>
  ...
</ProcessCreate>
```

> 누가 dir, ping 명령을 실행하면 로깅됨

### 6.6 Sysmon Config 적용

```cmd
# 수정한 config 적용
Sysmon64.exe -c sysmon.xml
```

### 6.7 이벤트 뷰어 확인

1. 검색 → **이벤트 뷰어**
2. 응용 프로그램 및 서비스 로그 → Microsoft → Windows → **Sysmon** → Operational
3. 로그 발생 확인

### 6.8 Wazuh Agent 설정 (Windows)

`C:\Program Files (x86)\ossec-agent\ossec.conf` 편집:

```xml
<localfile>
  <location>Microsoft-Windows-Sysmon/Operational</location>
  <log_format>eventchannel</log_format>
</localfile>
```

> Sysmon 로그를 Wazuh로 전송하도록 설정

### 6.9 Wazuh Agent 재시작

```cmd
# CMD 관리자 권한
"C:\Program Files (x86)\ossec-agent\win32ui.exe"
# Manage → Restart
```

또는:
```cmd
net stop WazuhSvc
net start WazuhSvc
```

---

## 7. 부록: 명령어 및 설정 파일

### 7.1 Wazuh 서버 명령어

```bash
# 명령어 위치
/var/ossec/bin/

# 서비스 재시작
/var/ossec/bin/wazuh-control restart

# 서비스 상태
/var/ossec/bin/wazuh-control status

# 등록된 Agent 관리
/var/ossec/bin/manage_agents
# l: 리스트, a: 추가, r: 제거

# Agentless 호스트 관리
/var/ossec/agentless/register_host.sh add [user@host] [password]
/var/ossec/agentless/register_host.sh list
```

### 7.2 주요 설정 파일

| 파일 | 위치 | 용도 |
|------|------|------|
| ossec.conf | `/var/ossec/etc/ossec.conf` | 메인 설정 파일 |
| local_rules.xml | `/var/ossec/etc/rules/local_rules.xml` | 커스텀 룰 |
| 로그 | `/var/ossec/logs/ossec.log` | 서비스 로그 |
| 알람 | `/var/ossec/logs/alerts/alerts.json` | 알람 로그 |

### 7.3 포트

| 포트 | 용도 |
|------|------|
| 443 | Kibana 웹 UI (HTTPS) |
| 1514 | Wazuh Agent 통신 |
| 1515 | Agent 등록 |
| 9200 | Elasticsearch |
| 5601 | Kibana 내부 |

### 7.4 문제 해결

**Agent 등록 안 될 때**:
1. 방화벽 확인: `ufw status`
2. 포트 확인: `netstat -tlnp | grep 1514`
3. 서비스 상태: `systemctl status wazuh-manager`

**Agentless 동작 안 할 때**:
1. SSH 연결 테스트: `ssh wazuh@192.168.2.12`
2. expect 설치 확인: `apt install -y expect`
3. 로그 확인: `tail -f /var/ossec/logs/ossec.log`

**Sysmon 로그 안 올라올 때**:
1. 이벤트 뷰어에서 Sysmon 로그 확인
2. ossec.conf에 localfile 설정 확인
3. Wazuh Agent 재시작

### 7.5 자주 쓰는 검색 (Kibana)

```
# 특정 Agent 로그
agent.name: "wazuh-agent1"

# 특정 룰 ID
rule.id: 100001

# 특정 키워드
full_log: *webshell*

# 레벨 기준
rule.level: >= 7
```

---

## 핵심 포인트 요약

1. **Wazuh = OSSEC 기반 HIDS + ELK 스택**
2. **호스트명 충돌 주의** - 서버와 Agent 이름 다르게!
3. **Agent 형태**: 클라이언트에 프로그램 설치
4. **Agentless 형태**: SSH로 원격 모니터링 (expect 필수!)
5. **Sysmon**: Windows 상세 로깅, Wazuh와 연동 시 고급 위협 탐지
6. **설정 변경 후**: 반드시 `wazuh-control restart`

---
