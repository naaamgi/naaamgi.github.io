---
title: "보안 모니터링 1편: 실습 환경 구축 (VMware/Windows/Ubuntu)"
excerpt: "보안 모니터링 실습을 위한 VMware 환경 구축 및 Windows 10, Ubuntu 최적화 설정"

categories: security
tags: [보안모니터링, VMware, Windows, Ubuntu, 환경구축, sk]

date: 2026-01-23
last_modified_at: 2026-01-23
published: true
---

> **수업일**: 2026년 1월 19일 ~ 20일
> **주요 도구**: VMware, Wireshark, Security Onion, Suricata, ZAP, Network Miner, VirusTotal

---

## 1. VMware에 Windows 10 설치

VMware에 Windows 10을 설치한 후, 보안 실습에 최적화된 환경을 만들기 위해 아래 설정들을 진행한다.

### 1.1 D 드라이브 추가 (50GB)

실습 파일 저장용 별도 드라이브를 생성한다.

1. `Win + R` → `diskmgmt.msc` 입력 → 확인
2. 디스크 관리 창에서 "할당되지 않음" 영역 우클릭
3. **새 단순 볼륨** 클릭
4. 볼륨 크기: 50GB (51200MB) 지정
5. 드라이브 문자: **D** 선택
6. 파일 시스템: NTFS, 빠른 포맷 체크 → 완료

---

### 1.2 Windows 업데이트 비활성화

실습 중 자동 업데이트로 인한 재부팅/성능 저하를 방지한다.

1. `Win + R` → `services.msc` 입력 → 확인
2. 서비스 목록에서 **Windows Update** 찾기 (맨 아래쪽)
3. 더블클릭하여 속성 창 열기
4. **시작 유형**: `사용 안 함` 선택
5. **서비스 상태**: `중지` 버튼 클릭
6. 적용 → 확인

---

### 1.3 메모리 최적화 (가상 메모리 설정)

VM 환경에서 메모리 효율을 높인다.

1. `Win + R` → `sysdm.cpl` 입력 → 확인
2. **고급** 탭 클릭
3. 성능 영역의 **설정** 버튼 클릭
4. 성능 옵션 창에서 **고급** 탭 클릭
5. 가상 메모리 영역의 **변경** 버튼 클릭
6. "모든 드라이브에 대한 페이징 파일 크기 자동 관리" 체크 해제
7. **사용자 지정 크기** 선택:
   - 처음 크기: 4096 MB
   - 최대 크기: 8192 MB
8. **설정** → 확인 → 재부팅

---

### 1.4 Windows 방화벽 전부 끄기

외부 도구와의 통신 테스트를 위해 방화벽을 비활성화한다.

1. `Win + R` → `firewall.cpl` 입력 → 확인
2. 왼쪽 메뉴에서 **Windows Defender 방화벽 설정 또는 해제** 클릭
3. **개인 네트워크 설정**:
   - `Windows Defender 방화벽 사용 안 함` 선택
4. **공용 네트워크 설정**:
   - `Windows Defender 방화벽 사용 안 함` 선택
5. 확인

> **주의**: 실습 환경에서만 비활성화할 것. 실제 업무 환경에서는 절대 끄지 않는다.

---

### 1.5 Windows 실시간 감시 끄기

악성코드 샘플 분석 시 자동 삭제를 방지한다.

1. 작업 표시줄 우하단 **숨겨진 아이콘 표시** (∧) 클릭
2. **Windows 보안** (방패 아이콘) 클릭
3. **바이러스 및 위협 방지** 클릭
4. "바이러스 및 위협 방지 설정"에서 **설정 관리** 클릭
5. 다음 항목들을 모두 **끔**으로 변경:
   - 실시간 보호
   - 클라우드 제공 보호
   - 자동 샘플 전송

---

### 1.6 Antimalware Service Executable 비활성화

백그라운드에서 CPU를 점유하는 Windows Defender 프로세스를 끈다.

**방법 1: 그룹 정책 편집기 (Pro 버전)**
1. `Win + R` → `gpedit.msc` 입력 → 확인
2. 컴퓨터 구성 → 관리 템플릿 → Windows 구성 요소 → Microsoft Defender 바이러스 백신
3. **Microsoft Defender 바이러스 백신 끄기** 더블클릭
4. **사용** 선택 → 확인

**방법 2: 레지스트리 (Home 버전)**
1. `Win + R` → `regedit` 입력 → 확인
2. 경로 이동: `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows Defender`
3. 우클릭 → 새로 만들기 → DWORD(32비트) 값
4. 이름: `DisableAntiSpyware`
5. 값 데이터: `1`
6. 재부팅

---

### 1.7 파일 확장자 보이게 설정

악성코드 분석 시 실제 확장자 확인을 위해 필수 설정이다.

1. 파일 탐색기 열기 (`Win + E`)
2. 상단 메뉴에서 **보기** 탭 클릭
3. **파일 확장명** 체크박스 선택
4. **숨긴 항목** 체크박스도 선택 (권장)

---

### 1.8 Chrome 기본 브라우저 설정

1. Chrome 설치 후 실행
2. 주소창에 `chrome://settings` 입력
3. 왼쪽 메뉴에서 **기본 브라우저** 클릭
4. **기본으로 설정** 버튼 클릭
5. Windows 설정 창이 뜨면 **Google Chrome** 선택

---

### 1.9 추가 설치 프로그램

| 프로그램 | 용도 |
|---------|------|
| Notepad++ | 로그 파일 분석, 코드 편집 |
| Python 3.13 | 스크립트 실행, 자동화 |
| Wireshark | 패킷 캡처 및 분석 |

---

### 1.10 설치 완료 후 스냅샷 필수

모든 설정 완료 후 VMware에서 스냅샷을 생성한다.

1. VMware 상단 메뉴 → **VM** → **Snapshot** → **Take Snapshot**
2. 이름: `Win10_초기설정완료` (또는 날짜 포함)
3. 설명: 방화벽OFF, 업데이트OFF, 실시간감시OFF
4. **Take Snapshot** 클릭

> 문제 발생 시 이 스냅샷으로 복원하면 초기 상태로 돌아갈 수 있다.

---

## 2. Ubuntu 20.04/24.04 설치

원본 Ubuntu VM을 만들어두고, 필요할 때마다 클론해서 사용한다.
- Splunk용: Ubuntu 20.04
- Zabbix용: Ubuntu 24.04

### 2.1 기본 설치 후 Sleep Mode 끄기

VM이 자동으로 절전 모드에 들어가는 것을 방지한다.

1. 우상단 **전원 아이콘** 클릭 → **Settings** (설정)
2. 왼쪽 메뉴에서 **Power** (전원) 클릭
3. **Screen Blank**: `Never` 선택
4. **Automatic Suspend**: `Off`

또는 터미널에서:
```bash
# 화면 보호기 비활성화
gsettings set org.gnome.desktop.session idle-delay 0

# 자동 절전 비활성화
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
```

---

### 2.2 방화벽(UFW) 비활성화

```bash
# 방화벽 상태 확인
sudo ufw status

# 방화벽 비활성화
sudo ufw disable

# 비활성화 확인
sudo ufw status
# 출력: Status: inactive
```

---

### 2.3 VMware Tools 설치

VM과 호스트 간 클립보드 공유, 드래그 앤 드롭, 해상도 자동 조절을 위해 필수다.

```bash
# VMware Tools 설치
sudo apt update
sudo apt install -y open-vm-tools open-vm-tools-desktop

# 재부팅
sudo reboot
```

> 재부팅 후 VM 창 크기를 조절하면 해상도가 자동으로 맞춰진다.

---

### 2.4 기본 패키지 설치

```bash
# 패키지 목록 업데이트
sudo apt update

# 시스템 업그레이드 (호환성 문제 시 생략 가능)
sudo apt dist-upgrade -y

# 필수 패키지 설치
sudo apt install -y nginx curl net-tools
```

| 패키지 | 용도 |
|--------|------|
| nginx | 웹 서버 (테스트용) |
| curl | HTTP 요청 테스트 |
| net-tools | ifconfig, netstat 등 네트워크 명령어 |

---

### 2.5 스냅샷 생성

모든 설정 완료 후 **전원을 끄고** 스냅샷을 생성한다.

1. VM 전원 끄기: `sudo poweroff`
2. VMware → VM → Snapshot → Take Snapshot
3. 이름: `Ubuntu_초기설정완료`

---

## 3. VMware 네트워크 설정 통일

모든 VM이 같은 IP 대역(192.168.2.x)을 사용하도록 설정한다. 분석 시 IP 혼동을 방지하기 위함이다.

### 3.1 VMware Virtual Network Editor 설정

1. VMware 상단 메뉴 → **Edit** → **Virtual Network Editor**
2. 관리자 권한 필요 시 **Change Settings** 클릭
3. **VMnet8 (NAT)** 선택
4. Subnet IP: `192.168.2.0` 으로 변경
5. **NAT Settings** 클릭:
   - Gateway IP: `192.168.2.2`
6. **DHCP Settings** 클릭:
   - Start IP: `192.168.2.200`
   - End IP: `192.168.2.250`
7. **Apply** → **OK**

---

### 3.2 Windows VM IP 확인

```cmd
# CMD 또는 PowerShell에서
ipconfig

# 결과 예시:
# IPv4 주소: 192.168.2.xxx
# 기본 게이트웨이: 192.168.2.2
```

---

### 3.3 Ubuntu/Security Onion IP 확인

```bash
# IP 확인
ip addr

# 또는
ifconfig

# 인터페이스 이름 확인 (ens33, ens32 등 - 각자 다를 수 있음)
```

---

## 4. 부록: Windows 실행 명령어 (Win + R)

| 명령어 | 기능 |
|--------|------|
| `diskmgmt.msc` | 디스크 관리 |
| `services.msc` | 서비스 관리 |
| `sysdm.cpl` | 시스템 속성 |
| `firewall.cpl` | 방화벽 설정 |
| `inetcpl.cpl` | 인터넷 옵션 |
| `ncpa.cpl` | 네트워크 연결 |
| `gpedit.msc` | 그룹 정책 편집기 |
| `regedit` | 레지스트리 편집기 |

---

**다음 편**: [보안 모니터링 2편: Security Onion 설치 및 OSINT 기초](/categories/security/security-monitoring-2-security-onion/)
