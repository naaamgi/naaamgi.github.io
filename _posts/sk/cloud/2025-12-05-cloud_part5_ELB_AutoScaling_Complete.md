---
title: "AWS ELB와 Auto Scaling: 고가용성 웹 서비스 구축 실습"
excerpt: "Application Load Balancer를 활용한 트래픽 분산과 Auto Scaling을 통한 자동 확장 구성을 학습하고, 멀티 AZ 웹 서비스를 콘솔에서 직접 구축합니다."

categories: ['cloud']
tags: [AWS, ELB, ALB, NLB, Auto-Scaling, 고가용성, 웹서버, Target-Group, Health-Check]

typora-root-url: ../../

date: 2025-12-05
last_modified_at: 2025-12-05
published: true
---

## 전체 흐름 요약

이번 학습에서는 AWS의 **ELB (Elastic Load Balancing)**와 **Auto Scaling**을 활용하여 고가용성 웹 서비스를 구축합니다. 단일 서버의 한계를 극복하고 트래픽을 여러 서버에 분산하며, 부하에 따라 서버를 자동으로 증감하는 실전 아키텍처를 경험합니다.

**Part 1 - ELB 개념**에서는 로드 밸런싱의 필요성과 ELB의 핵심 기능(트래픽 분산, 헬스 체크, 고가용성)을 학습합니다. ALB(Application Load Balancer)와 NLB(Network Load Balancer)의 차이를 비교하고, 리스너, 대상 그룹, 라우팅 규칙 등 ELB의 구성 요소를 이해합니다.

**Part 2 - 웹서버 실습**에서는 User Data를 활용하여 부팅 시 자동으로 웹 서버가 설치되는 EC2 인스턴스를 생성합니다. 퍼블릭 서브넷에 배치된 웹 서버에 브라우저로 접속하고, 보안 그룹을 수정하여 특정 IP만 접근 가능하도록 제한하는 실습을 수행합니다.

**Part 3 - ALB 구성 실습**에서는 프라이빗 서브넷에 2개의 웹 서버를 배치하고, 퍼블릭 서브넷의 ALB를 통해 트래픽을 분산합니다. Target Group을 생성하여 헬스 체크를 설정하고, ALB DNS로 접속하여 요청이 서로 다른 서버로 분산되는 것을 확인합니다. 인스턴스 하나를 중지했을 때 자동으로 다른 서버로 페일오버되는 고가용성도 테스트합니다.

**Part 4 - Auto Scaling**에서는 Launch Template을 생성하고 Auto Scaling Group을 구성하여 CPU 사용률에 따라 인스턴스가 자동으로 증감하는 동적 스케일링을 설정합니다.

모든 실습은 AWS 콘솔 기반이며, 멀티 AZ 구성으로 실제 프로덕션 환경과 유사한 아키텍처를 구축합니다.

---

## Part 1: ELB 개념

### 1.1. 로드 밸런싱이란?

**로드 밸런싱**은 클라이언트 요청을 여러 서버에 분산하여 처리하는 기술입니다.

**단일 서버의 문제점:**
```
문제 1: 단일 장애점 (SPOF)
- 서버 1대 다운 → 전체 서비스 중단

문제 2: 용량 한계
- 트래픽 증가 시 성능 저하
- 수직 확장의 한계 (CPU/메모리 업그레이드)

문제 3: 유지보수 어려움
- 서버 재시작 시 서비스 중단
```

**로드 밸런서 도입 효과:**
```
✅ 고가용성: 서버 1대 다운해도 서비스 유지
✅ 확장성: 서버 추가로 용량 증가
✅ 무중단 배포: 서버를 하나씩 업데이트
✅ 헬스 체크: 장애 서버 자동 제외
```

---

### 1.2. ELB 특징

**ELB (Elastic Load Balancing)**는 AWS가 완전 관리하는 로드 밸런서입니다.

**핵심 특징:**

**1. 자동 확장**
- ELB 자체가 트래픽에 따라 자동 스케일
- 용량 계획 불필요

**2. 고가용성**
- 여러 AZ에 자동 배포
- 단일 장애점 없음

**3. 헬스 체크**
- 정상 서버로만 트래픽 전송
- 장애 서버 자동 제외 및 복구 시 재포함

**4. 보안 기능**
- Security Group 적용
- SSL/TLS 인증서 지원 (HTTPS)
- WAF 통합 가능

**5. Auto Scaling 통합**
- 인스턴스 자동 증감
- 대상 그룹에 자동 등록/제거

---

### 1.3. ELB 종류

#### ALB (Application Load Balancer)

**특징:**
- OSI 7계층 (애플리케이션 레이어)
- HTTP/HTTPS 전용
- 콘텐츠 기반 라우팅

**라우팅 기능:**
```
URL 경로 기반:
- /api/* → API 서버 그룹
- /images/* → 이미지 서버 그룹
- /* → 웹 서버 그룹

호스트 기반:
- api.example.com → API 서버
- www.example.com → 웹 서버

HTTP 헤더 기반:
- User-Agent: Mobile → 모바일 서버
- User-Agent: Desktop → 데스크톱 서버
```

**사용 사례:**
- 웹 애플리케이션
- 마이크로서비스
- 컨테이너 (ECS, EKS)

#### NLB (Network Load Balancer)

**특징:**
- OSI 4계층 (전송 레이어)
- TCP/UDP 프로토콜
- 초고성능 (수백만 RPS)
- 고정 IP 지원 (Elastic IP)

**성능:**
```
- 지연 시간: ~100μs (ALB 대비 10배 빠름)
- 처리량: 수백만 RPS
- 연결 수: 수백만 동시 연결
```

**사용 사례:**
- 고성능 TCP 애플리케이션
- IoT, 게임 서버
- 고정 IP 필요한 경우

#### GLB (Gateway Load Balancer)

**특징:**
- 보안 어플라이언스 통합용
- 방화벽, IDS/IPS 배포

**사용 사례:**
- 네트워크 보안 장비 분산

---

### 1.4. ELB 구성 요소

**1. 로드 밸런서 (Load Balancer)**
- 트래픽을 받는 엔드포인트
- DNS 이름 자동 할당
- 여러 AZ에 배포

**2. 리스너 (Listener)**
- 특정 포트/프로토콜에서 요청 대기
- 예: HTTP:80, HTTPS:443

**3. 대상 그룹 (Target Group)**
- 트래픽을 받을 서버 그룹
- 헬스 체크 설정
- 대상 타입: 인스턴스, IP, Lambda

**구조:**
```
클라이언트
    ↓
로드 밸런서 (ALB)
    ↓
리스너 (HTTP:80)
    ↓
대상 그룹 (web-servers)
    ↓
EC2 인스턴스 (web-01, web-02)
```

---

## Part 2: 웹서버 인스턴스 생성 실습

### 2.1. User Data를 활용한 웹 서버 자동 구성

**User Data**는 인스턴스 첫 부팅 시 실행되는 스크립트입니다.

#### Step 1: 웹 서버 EC2 생성

**콘솔 경로:**
```
EC2 > Launch instances
```

**기본 설정:**
```
Name: sk46-webserver-01
AMI: Amazon Linux 2023
Instance type: t2.micro (Free tier)
Key pair: Proceed without key pair
```

**네트워크 설정:**
```
VPC: sk46-myvpc (또는 default)
Subnet: Public Subnet 1 (us-west-2a)
Auto-assign public IP: Enable (중요!)
```

**보안 그룹 생성:**
```
Security group name: sk46-webserver-sg
Description: Allow HTTP from anywhere

Inbound rules:
- Type: HTTP, Port: 80, Source: 0.0.0.0/0
- Type: SSH, Port: 22, Source: 0.0.0.0/0 (선택)
```

**Advanced details:**
```
IAM instance profile: sk46-SSMInstanceProfile (Session Manager용)
```

**User data (스크립트 입력):**
```bash
#!/bin/bash
yum update -y
yum install -y httpd

# 인스턴스 메타데이터에서 정보 가져오기
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
AZ=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
PRIVATE_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)

# HTML 페이지 생성
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Server</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .info { background: #f0f0f0; padding: 20px; margin: 20px; border-radius: 10px; }
    </style>
</head>
<body>
    <h1>🚀 AWS Web Server</h1>
    <div class="info">
        <h2>Instance Information</h2>
        <p><strong>Instance ID:</strong> $INSTANCE_ID</p>
        <p><strong>Availability Zone:</strong> $AZ</p>
        <p><strong>Private IP:</strong> $PRIVATE_IP</p>
    </div>
</body>
</html>
EOF

# 웹 서버 시작
systemctl start httpd
systemctl enable httpd
```

**Launch instance 클릭**

#### Step 2: 웹 서비스 접속

**Public IP 확인:**
```
EC2 Console > Instances > sk46-webserver-01
Public IPv4 address: 54.180.123.45 (예시)
```

**브라우저 접속:**
```
http://54.180.123.45
```

**확인 사항:**
```
✅ 웹 페이지 표시됨
✅ Instance ID 표시
✅ AZ 정보 표시
✅ Private IP 표시
```

#### Step 3: 보안 그룹 수정 (접근 제한)

**현재 상태:**
```
Source: 0.0.0.0/0 (전 세계 접근 가능)
```

**My IP로 제한:**
```
EC2 > Security Groups > sk46-webserver-sg
Inbound rules > Edit inbound rules

HTTP 규칙:
- Source: My IP (자동으로 현재 공인 IP 입력)
Save rules
```

**테스트:**
```
PC 브라우저: ✅ 접속 가능
스마트폰 (LTE): ❌ 접속 불가 (다른 IP)
```

---

## Part 3: ALB 구성 실습

### 3.1. 실습 아키텍처

```
인터넷
    ↓
ALB (퍼블릭 서브넷)
    ↓
┌─────────────┬─────────────┐
│   AZ-A      │    AZ-C     │
├─────────────┼─────────────┤
│ Private Sub │ Private Sub │
│  Web-01     │  Web-02     │
└─────────────┴─────────────┘
```

**목표:**
- 2개 AZ에 프라이빗 서브넷 배치
- 각 서브넷에 웹 서버 1대씩
- ALB로 트래픽 분산
- 서버 1대 다운 시 자동 페일오버

### 3.2. NAT Gateway 생성 (프라이빗 서브넷용)

**프라이빗 서브넷의 웹 서버가 인터넷에서 패키지를 다운로드하려면 NAT Gateway 필요**

**콘솔 경로:**
```
VPC > NAT gateways > Create NAT gateway
```

**설정:**
```
Name: sk46-myvpc-natgw
Subnet: sk46-myvpc-public-subnet1 (퍼블릭!)
Elastic IP: Allocate Elastic IP (자동 생성)
```

**Create NAT gateway 클릭**

**Private Route Table 업데이트:**
```
VPC > Route tables > sk46-myvpc-private-rt
Routes > Edit routes
Add route:
  Destination: 0.0.0.0/0
  Target: NAT Gateway > sk46-myvpc-natgw
Save changes
```

### 3.3. 웹 서버 2대 생성 (프라이빗 서브넷)

**웹 서버 1 (AZ-A):**
```
Name: sk46-webserver-private-01
AMI: Amazon Linux 2023
Instance type: t2.micro
Key pair: 없음
VPC: sk46-myvpc
Subnet: sk46-myvpc-private-subnet1 (us-west-2a)
Auto-assign public IP: Disable (프라이빗!)
Security group: sk46-private-web-sg (새로 생성)
  - HTTP (80) from ALB 보안 그룹 (나중에 수정)
IAM profile: sk46-SSMInstanceProfile
User data: 위의 웹 서버 스크립트 동일하게 입력
```

**웹 서버 2 (AZ-C):**
```
Name: sk46-webserver-private-02
설정 동일, Subnet만 변경:
  Subnet: sk46-myvpc-private-subnet2 (us-west-2c)
```

**Launch instances (2개)**

### 3.4. Target Group 생성

**콘솔 경로:**
```
EC2 > Target Groups > Create target group
```

**Basic configuration:**
```
Target type: Instances
Target group name: sk46-web-target-group
Protocol: HTTP
Port: 80
VPC: sk46-myvpc
Protocol version: HTTP1
```

**Health checks:**
```
Health check protocol: HTTP
Health check path: /
Healthy threshold: 2 (2번 성공 시 정상)
Unhealthy threshold: 2 (2번 실패 시 비정상)
Timeout: 5 seconds
Interval: 30 seconds
Success codes: 200
```

**Next 클릭**

**Register targets:**
```
Available instances:
☑ sk46-webserver-private-01
☑ sk46-webserver-private-02

"Include as pending below" 클릭
```

**Create target group 클릭**

### 3.5. Application Load Balancer 생성

**콘솔 경로:**
```
EC2 > Load Balancers > Create Load Balancer
```

**Load balancer type:**
```
Application Load Balancer > Create
```

**Basic configuration:**
```
Load balancer name: sk46-web-alb
Scheme: Internet-facing (외부 접근)
IP address type: IPv4
```

**Network mapping:**
```
VPC: sk46-myvpc

Mappings (최소 2개 AZ):
☑ us-west-2a: sk46-myvpc-public-subnet1
☑ us-west-2c: sk46-myvpc-public-subnet2
```

**Security groups:**
```
새로 생성: sk46-alb-sg
Inbound rules:
- Type: HTTP, Port: 80, Source: 0.0.0.0/0
```

**Listeners and routing:**
```
Protocol: HTTP
Port: 80
Default action: Forward to sk46-web-target-group
```

**Create load balancer 클릭**

**생성 확인:**
```
State: Provisioning → Active (2-3분 소요)
DNS name: sk46-web-alb-1234567890.us-west-2.elb.amazonaws.com
```

### 3.6. 보안 그룹 업데이트

**프라이빗 웹 서버 보안 그룹 수정:**
```
EC2 > Security Groups > sk46-private-web-sg
Inbound rules > Edit inbound rules

HTTP 규칙 수정:
- Type: HTTP
- Port: 80
- Source: Custom > sk46-alb-sg (ALB 보안 그룹 선택)

이유: 웹 서버는 ALB로부터만 트래픽 받음
```

### 3.7. ALB 접속 테스트

**브라우저 접속:**
```
http://sk46-web-alb-1234567890.us-west-2.elb.amazonaws.com
```

**확인 1: 트래픽 분산**
```
새로고침 여러 번:
- 때로는 webserver-private-01의 IP 표시
- 때로는 webserver-private-02의 IP 표시

→ 로드 밸런싱 작동 중!
```

**확인 2: 헬스 체크**
```
EC2 > Target Groups > sk46-web-target-group > Targets 탭

Status:
- webserver-private-01: healthy
- webserver-private-02: healthy
```

### 3.8. 고가용성 테스트

**인스턴스 1대 중지:**
```
EC2 > Instances > sk46-webserver-private-01 선택
Instance state > Stop instance
```

**Target Group 확인 (30초~1분 후):**
```
Target Groups > Targets 탭

Status:
- webserver-private-01: unhealthy (중지됨)
- webserver-private-02: healthy

Reason: Health checks failed
```

**브라우저 테스트:**
```
ALB DNS로 계속 새로고침:
→ webserver-private-02의 정보만 표시
→ 서비스 중단 없음!
```

**인스턴스 재시작:**
```
Instance state > Start instance
```

**헬스 체크 복구 (2-3분 후):**
```
Status:
- webserver-private-01: healthy (복구됨)
- webserver-private-02: healthy

→ 다시 2대로 트래픽 분산
```

---

## Part 4: Auto Scaling (개념)

### 4.1. Auto Scaling이란?

**Auto Scaling**은 트래픽에 따라 인스턴스 수를 자동으로 증감하는 기능입니다.

**구성 요소:**

**1. Launch Template**
- 인스턴스 생성 템플릿
- AMI, 인스턴스 타입, 보안 그룹 등 정의

**2. Auto Scaling Group (ASG)**
- 인스턴스 그룹 관리
- 최소/최대/원하는 용량 설정

**3. Scaling Policy**
- CPU 사용률 기반
- 요청 수 기반
- 사용자 정의 메트릭

**동작 방식:**
```
평소: 2대 실행
트래픽 증가 (CPU > 70%): 4대로 증가
트래픽 감소 (CPU < 30%): 2대로 감소
```

---

## CLI 명령어 참고 (선택)

### Target Group 생성

```bash
aws elbv2 create-target-group \
  --name web-target-group \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxxxx \
  --health-check-path /
```

### ALB 생성

```bash
aws elbv2 create-load-balancer \
  --name web-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx
```

### Target 등록

```bash
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-xxxxx Id=i-yyyyy
```

---

## 주요 개념 요약

| 구분 | 개념 | 설명 |
|------|------|------|
| **ELB** | ALB | L7 로드 밸런서, HTTP/HTTPS, 콘텐츠 기반 라우팅 |
| | NLB | L4 로드 밸런서, TCP/UDP, 고성능, 고정 IP |
| | 헬스 체크 | 정상 서버만 트래픽 전송 |
| **구성 요소** | 로드 밸런서 | 트래픽 수신 엔드포인트 |
| | 리스너 | 포트/프로토콜 대기 |
| | 대상 그룹 | 백엔드 서버 그룹 |
| **실습** | User Data | 부팅 시 자동 실행 스크립트 |
| | NAT Gateway | 프라이빗 서브넷 아웃바운드 |
| | 보안 그룹 체이닝 | ALB → 웹서버 접근 제어 |

---

## 마무리

**학습 완료:**
- ✅ ELB 개념 및 ALB/NLB 비교
- ✅ User Data로 웹 서버 자동 구성
- ✅ Target Group 및 헬스 체크 설정
- ✅ ALB 생성 및 트래픽 분산 확인
- ✅ 고가용성 테스트 (페일오버)

**실습 정리:**
```
⚠️ NAT Gateway 삭제 (비용 발생)
⚠️ ALB 삭제
⚠️ Target Group 삭제
⚠️ EC2 인스턴스 종료
⚠️ Elastic IP 해제
```