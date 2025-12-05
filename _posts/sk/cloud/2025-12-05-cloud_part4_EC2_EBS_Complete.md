---
title: "AWS EC2 기초: 서버 개념부터 인스턴스 생성 및 접속까지"
excerpt: "웹 서버와 가상화의 기초 개념을 이해하고, AWS 콘솔을 통해 EC2 인스턴스를 생성하여 Session Manager와 SSH로 접속하는 전체 과정을 실습합니다."

categories: ['cloud']
tags: [AWS, EC2, 가상화, Session-Manager, SSH, AMI, 인스턴스, 서버]

typora-root-url: ../../

date: 2025-12-05
last_modified_at: 2025-12-05
published: true
---

## 전체 흐름 요약

이번 학습에서는 AWS EC2의 기초부터 실습까지 체계적으로 다룹니다. 서버와 가상화의 기본 개념을 이해한 후, AWS 콘솔을 통해 실제 EC2 인스턴스를 생성하고 접속하는 전체 과정을 경험합니다.

**Part 1 - 서버 기초**에서는 웹 서버의 동작 원리와 운영체제의 역할을 학습합니다. Apache 웹 서버가 정적/동적 콘텐츠를 어떻게 처리하는지, 서버 OS와 클라이언트 OS의 차이는 무엇인지 이해합니다. Type 1/Type 2 하이퍼바이저를 비교하며 AWS가 사용하는 가상화 기술의 기반을 파악합니다.

**Part 2 - EC2 개념**에서는 AMI, 인스턴스 타입, Key Pair 등 EC2의 핵심 구성 요소를 학습합니다. AMI는 OS와 소프트웨어가 포함된 템플릿이며, 인스턴스 타입에 따라 CPU/메모리 성능이 결정됩니다.

**Part 3 - 콘솔 실습**에서는 IAM Role을 설정하여 Session Manager로 Key Pair 없이 브라우저에서 EC2에 접속하고, 인스턴스 메타데이터를 활용하는 방법을 익힙니다. 이어서 전통적인 SSH 방식의 접속도 실습합니다.

모든 실습은 AWS 콘솔 기반으로 진행되며, CLI 명령어는 선택사항으로 제공됩니다.

---

## Part 1: 서버 기초 지식

### 1.1. 웹 서버의 이해

#### 웹 서버 vs 애플리케이션 서버

**웹 서버:**
- 정적 콘텐츠 제공 (HTML, CSS, JavaScript, 이미지)
- 예: Apache HTTP Server, Nginx, IIS

**애플리케이션 서버:**
- 동적 콘텐츠 생성 (데이터베이스 조회, 비즈니스 로직)
- 예: Tomcat, PHP-FPM, Django, Node.js

#### 웹 서버 동작 방식 (Apache + PHP 예시)

```
1. 클라이언트 요청: http://example.com/index.php
2. Apache 웹 서버 수신
3. 파일 타입 확인:
   - .html/.css/.js → 바로 응답 (정적)
   - .php → PHP 엔진으로 전달 (동적)
4. PHP 처리: DB 쿼리, 계산 등 수행
5. HTML 생성 후 Apache로 반환
6. 클라이언트에게 HTTP 응답
```

---

### 1.2. 운영체제(OS)

#### OS의 3대 역할

**1. 시스템 자원 관리**
- CPU 스케줄링
- 메모리 할당
- 디스크 I/O

**2. 사용자 인터페이스 제공**
- CLI (bash, cmd)
- GUI (Windows, macOS)

**3. 응용 프로그램 제어**
- 오류 감지 및 처리
- 보안 및 접근 제어

#### 서버 OS

**Windows Server:**
- GUI 기반 관리
- .NET 최적화
- 라이선스 비용 높음

**Linux:**
- 무료 오픈소스
- 안정적, 보안성 높음
- CLI 중심 (학습 곡선)

**AWS EC2 지원 OS:**
- Amazon Linux 2023 (권장)
- Ubuntu Server
- Red Hat Enterprise Linux
- Windows Server

---

### 1.3. 서버 가상화

#### 가상화란?

하나의 물리 서버에서 여러 개의 가상 서버(VM)를 독립적으로 실행하는 기술입니다.

**장점:**
- 하드웨어 활용률 증가 (10% → 70%)
- 빠른 프로비저닝 (수 분)
- 격리성 (VM 간 독립)

#### 하이퍼바이저 타입

**Type 1 (Bare Metal):**
- 하드웨어에 직접 설치
- 높은 성능
- 예: VMware ESXi, KVM, **AWS Nitro**

**Type 2 (Hosted):**
- 기존 OS 위에 설치
- 개인용/테스트용
- 예: VirtualBox, VMware Workstation

---

## Part 2: EC2 개념

### 2.1. EC2란?

**EC2 (Elastic Compute Cloud)**는 크기 조정 가능한 가상 서버를 제공하는 AWS 서비스입니다.

**특징:**
- 탄력적 확장 (수 분 내 생성/종료)
- 사용한 만큼 과금 (초 단위)
- 완전한 루트 권한

**온프레미스 vs EC2:**

| 구분 | 온프레미스 | EC2 |
|------|-----------|-----|
| 비용 | CAPEX (설비투자) | OPEX (운영비용) |
| 배포 시간 | 수 주~수 개월 | 수 분 |
| 용량 산정 | 사전 계획 필요 | 사후 조정 가능 |

---

### 2.2. AMI (Amazon Machine Image)

**AMI**는 EC2 인스턴스를 시작하는 데 필요한 템플릿입니다.

**포함 내용:**
- OS (Linux/Windows)
- 설치된 소프트웨어
- 시스템 설정
- 루트 볼륨 템플릿

**AMI 종류:**

**1. QuickStart (AWS 제공):**
- Amazon Linux 2023
- Ubuntu Server
- Windows Server

**2. Marketplace (3rd Party):**
- WordPress, LAMP Stack
- Deep Learning AMI

**3. 사용자 정의 AMI:**
- 직접 생성한 템플릿
- Golden Image로 활용

---

### 2.3. 인스턴스 타입

#### 명명 규칙

```
예: t3.xlarge

t    3      xlarge
│    │      └─ 크기 (CPU/메모리)
│    └─ 세대
└─ 패밀리 (용도)
```

#### 주요 패밀리

**T 시리즈 (범용 - 버스트):**
- 기본 성능 제공, 필요 시 버스트
- 개발/테스트, 소규모 웹

**M 시리즈 (범용 - 균형):**
- CPU:RAM = 1:4
- 웹 애플리케이션, 중소 DB

**C 시리즈 (컴퓨팅 최적화):**
- 높은 CPU 성능
- 배치 처리, 과학 계산

**R 시리즈 (메모리 최적화):**
- CPU:RAM = 1:8
- 인메모리 DB, 빅데이터

---

### 2.4. Key Pair

**Key Pair**는 Linux 인스턴스 SSH 접속용 공개키-개인키 쌍입니다.

**동작 원리:**
1. AWS가 RSA 키 쌍 생성
2. Private Key (.pem) 다운로드
3. Public Key는 인스턴스 내부 저장
4. SSH 접속 시 Private Key로 인증

**주의사항:**
- Private Key는 단 한 번만 다운로드
- 분실 시 복구 불가
- 권한: `chmod 400 my-key.pem`

---

## Part 3: EC2 콘솔 실습

### 3.1. Session Manager 접속 실습

#### Step 1: IAM Role 생성

**콘솔 경로:**
```
IAM > Roles > Create role
```

**설정:**
```
Trusted entity: AWS service > EC2
Permissions: AmazonSSMManagedInstanceCore
Role name: sk46-ec2-ssm-role
```

#### Step 2: EC2 인스턴스 생성

**콘솔 경로:**
```
EC2 > Launch instances
```

**설정:**
```
Name: sk46-webserver-01
AMI: Amazon Linux 2023
Instance type: t3.micro (Free tier)
Key pair: Proceed without a key pair
VPC: default
Auto-assign public IP: Enable
Security group: 기본 또는 새로 생성 (SSH 허용)
IAM instance profile: sk46-ec2-ssm-role (필수!)
```

**Launch instance 클릭**

#### Step 3: Session Manager 접속

**콘솔 경로:**
```
EC2 > Instances > sk46-webserver-01 > Connect
```

**접속:**
```
Session Manager 탭 > Connect 버튼
→ 브라우저에서 터미널 열림
```

#### Step 4: 메타데이터 확인

```bash
# 토큰 발급
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# 인스턴스 ID
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id

# Public IP
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4

# Private IP
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4

# 가용 영역
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone
```

---

### 3.2. SSH 접속 실습

#### Step 1: Key Pair 생성

**콘솔 경로:**
```
EC2 > Key Pairs > Create key pair
```

**설정:**
```
Name: sk46-linux-keypair
Type: RSA
Format: .pem
```

**다운로드:** sk46-linux-keypair.pem

**권한 설정 (Linux/Mac):**
```bash
chmod 400 sk46-linux-keypair.pem
```

#### Step 2: EC2 생성

```
Name: sk46-linux-ec2-01
AMI: Amazon Linux 2023
Instance type: t3.micro
Key pair: sk46-linux-keypair (선택!)
Security group: SSH (22) 허용, Source: My IP 권장
```

#### Step 3: SSH 접속

**Public IP 확인:**
```
EC2 Console > Instance 선택 > Public IPv4: 54.180.123.45
```

**터미널 접속:**
```bash
ssh -i sk46-linux-keypair.pem ec2-user@54.180.123.45
```

**첫 접속:**
```
Are you sure you want to continue connecting? yes
```

**접속 성공:**
```
[ec2-user@ip-172-31-10-50 ~]$
```

#### Step 4: 기본 명령어

```bash
# OS 버전
cat /etc/os-release

# 시스템 정보
uname -a
lscpu
free -h
df -h

# 패키지 업데이트
sudo yum update -y

# 웹 서버 설치
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd
```

---

## CLI 명령어 참고 (선택)

### 인스턴스 조회

```bash
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table
```

### 인스턴스 시작

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name sk46-linux-keypair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx
```

### 인스턴스 종료

```bash
aws ec2 terminate-instances --instance-ids i-xxxxx
```

---

## 주요 개념 요약

| 구분 | 개념 | 설명 |
|------|------|------|
| **서버** | 웹 서버 | 정적 콘텐츠 제공 (Apache, Nginx) |
| | 애플리케이션 서버 | 동적 콘텐츠 생성 (Tomcat, Django) |
| | 서버 OS | Linux, Windows Server |
| **가상화** | Type 1 하이퍼바이저 | Bare Metal (ESXi, KVM, Nitro) |
| | Type 2 하이퍼바이저 | Hosted (VirtualBox, VMware WS) |
| **EC2** | AMI | OS + 소프트웨어 템플릿 |
| | 인스턴스 타입 | T(범용), M(균형), C(CPU), R(메모리) |
| | Key Pair | SSH 인증용 공개키-개인키 |
| **접속** | Session Manager | Key Pair 불필요, 브라우저 접속 |
| | SSH | Key Pair 필요, 터미널 접속 |
| | 메타데이터 | 인스턴스 정보 동적 조회 |

---

## 마무리

**학습 완료:**
- ✅ 서버와 가상화 기초 이해
- ✅ EC2 핵심 개념 학습 (AMI, 인스턴스 타입)
- ✅ Session Manager 접속 실습
- ✅ SSH 접속 실습
- ✅ 인스턴스 메타데이터 활용

**다음 학습:**
- EBS 스토리지 관리
- EBS 볼륨 생성 및 연결
- 파일시스템 구성

**실습 정리:**
```
⚠️ 실습 완료 후 반드시 인스턴스 종료(Terminate)
⚠️ Free Tier 한도 확인 (월 750시간 t2/t3.micro)
```
---
title: "AWS EBS 스토리지: 볼륨 생성부터 EC2 연결 및 파일시스템 구성까지"
excerpt: "EBS 블록 스토리지의 개념과 볼륨 타입을 학습하고, AWS 콘솔을 통해 EBS 볼륨을 생성하여 EC2에 연결한 후 파일시스템을 구성하는 전체 과정을 실습합니다."

categories: ['Cloud', 'Storage']
tags: [AWS, EBS, 스토리지, 볼륨, 스냅샷, 파일시스템, ext4, 마운트]

typora-root-url: ../../

date: 2025-12-05
last_modified_at: 2025-12-05
published: true
---

## 전체 흐름 요약

이번 학습에서는 AWS의 블록 스토리지 서비스인 **EBS (Elastic Block Store)**를 다룹니다. EC2 인스턴스의 영구 스토리지로 사용되는 EBS의 특징과 볼륨 타입을 이해하고, 실제로 볼륨을 생성하여 인스턴스에 연결하는 전체 과정을 실습합니다.

**Part 1 - EBS 개념**에서는 EBS의 핵심 특징(영구성, 독립성, AZ 종속성)을 학습하고, Instance Store와의 차이를 비교합니다. EBS 볼륨 타입(gp3, gp2, io2, st1, sc1)별 성능과 비용을 분석하여 워크로드에 맞는 선택 기준을 파악합니다.

**Part 2 - EBS 스냅샷**에서는 증분 백업 방식으로 작동하는 스냅샷의 원리를 이해하고, 다른 AZ나 리전으로 복제하는 방법을 학습합니다. Data Lifecycle Manager를 활용한 자동 백업 정책 설정도 다룹니다.

**Part 3 - 콘솔 실습**에서는 AWS 콘솔을 통해 gp3 타입의 EBS 볼륨을 생성하고, 실행 중인 EC2 인스턴스에 연결합니다. Linux 명령어로 파일시스템을 생성하고 마운트한 후, /etc/fstab에 등록하여 재부팅 후에도 자동 마운트되도록 설정하는 전체 과정을 수행합니다.

---

## Part 1: EBS 개념

### 1.1. EBS란?

**EBS (Elastic Block Store)**는 EC2 인스턴스용 블록 수준 영구 스토리지입니다.

**핵심 특징:**

**1. 영구성 (Persistence)**
- 인스턴스 종료 후에도 데이터 유지
- 명시적 삭제하지 않는 한 영구 보존

**2. 독립성 (Independence)**
- 인스턴스와 별도 존재
- 다른 인스턴스로 재연결 가능

**3. AZ 종속 (AZ-bound)**
- 특정 가용 영역에만 존재
- 같은 AZ의 인스턴스만 연결

**4. 스냅샷 지원**
- S3에 백업 가능
- 다른 AZ/리전 복제 가능

---

### 1.2. EBS vs Instance Store

| 구분 | EBS | Instance Store |
|------|-----|---------------|
| 영속성 | 영구 (종료 후 유지) | 임시 (종료 시 삭제) |
| 성능 | gp3: 16,000 IOPS | NVMe: 수백만 IOPS |
| 용량 | 최대 64 TiB | 인스턴스 타입 고정 |
| 백업 | 스냅샷 가능 | 불가 |
| 재연결 | 가능 | 불가 |
| 용도 | OS 디스크, DB | 캐시, 임시 데이터 |

---

### 1.3. EBS 볼륨 타입

#### gp3 (범용 SSD - 권장)

**특징:**
- 가격과 성능 균형
- 기본 3,000 IOPS, 125 MB/s
- 크기와 성능 독립적

**가격:**
- $0.08/GB/월
- 추가 IOPS/처리량 별도 과금

**사용 사례:**
- 대부분의 워크로드
- 웹 애플리케이션
- 중소 DB

#### gp2 (범용 SSD - 구세대)

**특징:**
- 볼륨 크기 = IOPS (1 GB = 3 IOPS)
- 버스트 크레딧 시스템
- 최대 16,000 IOPS

**gp2 vs gp3 (100 GB):**
```
gp2: 300 IOPS, $10/월
gp3: 3,000 IOPS, $8/월
→ gp3가 10배 빠르고 저렴!
```

#### io2 (프로비저닝된 IOPS SSD)

**특징:**
- 명시적 IOPS 프로비저닝
- 최대 64,000 IOPS
- 99.999% 내구성

**가격 (100 GB, 10,000 IOPS):**
- 스토리지: $12.50/월
- IOPS: $650/월
- 합계: $662.50/월 (gp3 대비 80배!)

**사용 사례:**
- 미션 크리티컬 DB
- 레이턴시 민감 애플리케이션

#### st1 (처리량 최적화 HDD)

**특징:**
- HDD 기반
- 순차 I/O 최적화
- 최대 500 MB/s

**가격:**
- $0.045/GB/월

**사용 사례:**
- 빅데이터 (Hadoop)
- 데이터 웨어하우스
- 로그 처리

#### sc1 (콜드 HDD)

**특징:**
- 가장 저렴
- 접근 빈도 낮은 데이터
- 최대 250 MB/s

**가격:**
- $0.015/GB/월

**사용 사례:**
- 아카이브
- 백업

---

## Part 2: EBS 스냅샷

### 2.1. 스냅샷 개념

**스냅샷**은 EBS 볼륨의 특정 시점 백업입니다.

**특징:**

**1. 증분 백업**
- 첫 스냅샷: 전체 복사
- 이후: 변경 블록만 저장

**2. 리전 단위 저장**
- S3에 자동 저장
- 리전 간 복사 가능

**3. 비용**
- $0.05/GB/월

---

### 2.2. 스냅샷 생성 (콘솔)

**1. 스냅샷 생성:**
```
EC2 > Volumes > 볼륨 선택
Actions > Create snapshot
Description: "백업 설명"
Tags: Name, Environment 등
```

**2. 진행 상태:**
```
EC2 > Snapshots
Status: pending → completed
```

**3. 볼륨 복원:**
```
Snapshots > 선택
Actions > Create volume from snapshot
Volume type: gp3
Size: 증가 가능 (감소 불가)
AZ: 다른 AZ 선택 가능
```

**4. 리전 간 복사:**
```
Actions > Copy snapshot
Destination region: 선택
Encryption: 활성화 가능
```

---

### 2.3. 자동 백업 (Data Lifecycle Manager)

**정책 예시:**

```
Target tags: Key=Backup, Value=Daily
Schedule: Daily, 03:00 UTC
Retention: 7일

결과:
- 매일 오전 3시 자동 스냅샷
- 7일 후 자동 삭제
```

---

## Part 3: 콘솔 실습

### 3.1. EBS 볼륨 생성

**콘솔 경로:**
```
EC2 > Elastic Block Store > Volumes > Create volume
```

**설정:**
```
Volume type: gp3
Size: 10 GiB
IOPS: 3000 (기본값)
Throughput: 125 MB/s (기본값)
Availability Zone: us-west-2a (EC2와 동일!)
Encryption: 활성화 (선택)
Tags: Name=sk46-data-volume
```

**Create volume 클릭**

---

### 3.2. EC2에 볼륨 연결

**콘솔 경로:**
```
EC2 > Volumes > sk46-data-volume 선택
```

**연결:**
```
Actions > Attach volume
Instance: sk46-webserver-01 선택
Device name: /dev/sdf (기본값)
Attach volume 클릭
```

**확인:**
```
State: In-use
Attached instances: i-xxxxx
Device: /dev/sdf
```

---

### 3.3. 파일시스템 구성

#### Step 1: 디스크 확인

**Session Manager 또는 SSH 접속:**

```bash
lsblk

출력:
NAME    SIZE  TYPE MOUNTPOINT
xvda      8G  disk 
└─xvda1   8G  part /
xvdf     10G  disk    ← 새 볼륨
```

**파일시스템 확인:**
```bash
sudo file -s /dev/xvdf

출력:
/dev/xvdf: data   ← 파일시스템 없음
```

#### Step 2: 파일시스템 생성

**ext4 생성:**
```bash
sudo mkfs -t ext4 /dev/xvdf

출력:
Creating filesystem with 2621440 4k blocks
...
Writing inode tables: done
```

#### Step 3: 마운트

**마운트 디렉토리 생성:**
```bash
sudo mkdir -p /mnt/data
```

**임시 마운트:**
```bash
sudo mount /dev/xvdf /mnt/data
```

**확인:**
```bash
df -h | grep /mnt/data

출력:
/dev/xvdf  9.8G  24K  9.3G  1% /mnt/data
```

**쓰기 테스트:**
```bash
sudo touch /mnt/data/test.txt
echo "Hello EBS" | sudo tee /mnt/data/test.txt
cat /mnt/data/test.txt
```

#### Step 4: 자동 마운트 설정

**UUID 확인:**
```bash
sudo blkid

출력:
/dev/xvdf: UUID="abc-123..." TYPE="ext4"
```

**fstab 편집:**
```bash
sudo cp /etc/fstab /etc/fstab.backup
sudo vi /etc/fstab
```

**추가:**
```
UUID=abc-123...  /mnt/data  ext4  defaults,nofail  0  2
```

**검증:**
```bash
sudo mount -a
# 오류 없으면 성공
```

**재부팅 테스트:**
```bash
sudo reboot

# 재접속 후
df -h | grep /mnt/data
```

---

## CLI 명령어 참고 (선택)

### 볼륨 생성

```bash
aws ec2 create-volume \
  --volume-type gp3 \
  --size 10 \
  --availability-zone us-west-2a \
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=data-volume}]'
```

### 볼륨 연결

```bash
aws ec2 attach-volume \
  --volume-id vol-xxxxx \
  --instance-id i-xxxxx \
  --device /dev/sdf
```

### 스냅샷 생성

```bash
aws ec2 create-snapshot \
  --volume-id vol-xxxxx \
  --description "Backup 2025-12-05"
```

---

## 주요 개념 요약

| 구분 | 개념 | 설명 |
|------|------|------|
| **EBS** | 영구성 | 인스턴스 종료 후에도 유지 |
| | 독립성 | 다른 인스턴스로 재연결 가능 |
| | AZ 종속 | 같은 AZ에서만 연결 |
| **볼륨 타입** | gp3 | 범용, 3000 IOPS, $0.08/GB |
| | io2 | 고성능 DB, 64000 IOPS |
| | st1 | HDD, 빅데이터, $0.045/GB |
| | sc1 | 콜드 HDD, $0.015/GB |
| **스냅샷** | 증분 백업 | 변경 블록만 저장 |
| | 리전 간 복사 | DR 구성 가능 |
| **파일시스템** | ext4 | Linux 기본 FS |
| | 마운트 | /mnt/data 등 |
| | fstab | 자동 마운트 설정 |

---

## 마무리

**학습 완료:**
- ✅ EBS 개념 및 볼륨 타입 이해
- ✅ 스냅샷 백업 방법 학습
- ✅ 콘솔에서 볼륨 생성 및 연결
- ✅ 파일시스템 구성 및 마운트
- ✅ 자동 마운트 설정
