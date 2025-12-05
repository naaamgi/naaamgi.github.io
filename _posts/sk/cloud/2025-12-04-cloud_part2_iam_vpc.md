---
title: "AWS IAM과 VPC - 보안 권한 관리 + 네트워크 구축"
excerpt: "IAM의 핵심 개념(사용자·그룹·역할·정책)과 보안 모범사례를 학습하고, VPC 기반 멀티 AZ 네트워크를 처음부터 끝까지 직접 구축하는 실습 가이드입니다."

categories: cloud
tags: [AWS, IAM, VPC, Security, Network, AssumeRole, STS, Subnet, IGW, NAT]

typora-root-url: ../../

date: 2025-12-04
last_modified_at: 2025-12-04
published: true
---

## 전체 흐름 요약

이번 학습 자료는 AWS의 핵심 보안 서비스인 IAM(Identity and Access Management)과 네트워크 서비스인 VPC(Virtual Private Cloud)를 체계적으로 다룹니다.

**Part 1 - IAM 이론**에서는 AWS 계정 보안의 기초가 되는 루트 사용자 관리, IAM 사용자·그룹·역할의 개념과 차이점, 정책(Policy)의 구조와 평가 우선순위를 학습합니다. 특히 역할(Role)을 활용한 임시 자격증명 방식과 STS(Security Token Service)의 동작 원리를 이해하여, 안전하고 확장 가능한 권한 관리 방법을 익힐 수 있습니다.

**Part 2 - VPC 실습**에서는 실제 프로덕션 환경에서 사용되는 멀티 AZ(Multi Availability Zone) 구성의 VPC를 처음부터 끝까지 구축합니다. 10.0.0.0/16 CIDR 블록을 가진 VPC를 생성하고, us-west-2a와 us-west-2c 두 개의 가용 영역에 퍼블릭·프라이빗 서브넷을 각각 배치합니다. 인터넷 게이트웨이(IGW)와 NAT 게이트웨이를 설정하여 외부 통신 경로를 구성하고, 라우팅 테이블과 보안 그룹을 통해 트래픽을 제어하는 방법을 실습합니다.

모든 단계는 AWS 콘솔과 CLI 명령어를 병행하여 설명하며, 각 명령어의 옵션과 예상 출력, 트러블슈팅 방법을 상세히 제공하여 **문서만으로 완전히 재현 가능**하도록 작성되었습니다.

---

## Part 1: IAM 이론 및 보안 권고

### 1.1. 루트 사용자와 보안 모범사례

#### 루트 사용자의 정의와 특징

AWS 계정을 처음 생성할 때 만들어지는 **루트 사용자(Root User)**는 해당 계정의 모든 AWS 서비스와 리소스에 대해 완전한 관리 권한을 가집니다. 루트 사용자는 이메일 주소를 기반으로 식별되며, 다른 IAM 사용자와 달리 권한 제한이 불가능합니다.

**루트 사용자만 수행 가능한 작업:**
- AWS 계정 폐쇄
- 결제 및 비용 관리 설정 변경
- AWS 지원 플랜 변경
- 루트 사용자 이메일 및 비밀번호 변경
- IAM 사용자 권한 정책 변경(특정 경우)

#### 보안 권고사항

루트 사용자의 강력한 권한 때문에 보안 사고 발생 시 전체 계정이 위험에 노출될 수 있습니다. 따라서 다음 조치를 **즉시** 실행해야 합니다:

**1) 루트 액세스 키 삭제**

루트 사용자의 액세스 키(Access Key ID / Secret Access Key)가 존재하면 프로그래밍 방식으로 계정에 접근할 수 있어 보안 위험이 증가합니다.

```bash
# 루트 액세스 키 존재 여부 확인 (IAM 콘솔에서 확인)
# 콘솔 경로: IAM > 대시보드 > 보안 권장사항
```

액세스 키가 존재하는 경우 IAM 콘솔에서 즉시 삭제하십시오.

**2) 루트 MFA 설정**

MFA(Multi-Factor Authentication)는 비밀번호 외에 추가 인증 수단을 요구하여 계정 보안을 강화합니다.

```bash
# MFA 설정 절차 (콘솔)
# 1. IAM > 대시보드 > 보안 권장사항 > "MFA 활성화" 클릭
# 2. MFA 디바이스 유형 선택 (가상 MFA 디바이스 권장)
# 3. 모바일 앱(Google Authenticator, Authy 등)으로 QR 코드 스캔
# 4. 연속된 두 개의 MFA 코드 입력하여 설정 완료
```

**3) 강력한 비밀번호 정책 적용**

```bash
# 비밀번호 정책 설정 (콘솔)
# IAM > 계정 설정 > 비밀번호 정책
# - 최소 길이: 14자 이상
# - 대소문자, 숫자, 특수문자 조합 필수
# - 비밀번호 만료 기간: 90일
# - 이전 비밀번호 재사용 금지: 5개
```

**4) 루트 사용자 사용 최소화**

일상적인 작업에는 **절대** 루트 사용자를 사용하지 않습니다. 관리자 권한이 필요한 경우에도 IAM 사용자에게 필요한 권한만 부여하여 사용합니다.

```
권장 사용 시나리오:
✅ 계정 폐쇄
✅ 결제 정보 변경
✅ 지원 플랜 변경

비권장 사용 시나리오:
❌ EC2 인스턴스 생성
❌ S3 버킷 관리
❌ 일상적인 리소스 관리
```

---

### 1.2. IAM 아이덴티티: 사용자, 그룹, 역할

#### IAM 사용자 (IAM User)

**정의:** AWS 리소스에 접근할 수 있는 개별 사용자 또는 애플리케이션을 나타내는 엔티티입니다.

**특징:**
- 장기 자격증명을 가집니다 (콘솔 비밀번호, 액세스 키).
- 생성 시점에는 어떠한 권한도 가지지 않습니다 (명시적 권한 부여 필요).
- 계정당 최대 5,000개의 IAM 사용자 생성 가능합니다.

**사용 사례:**
- 개인 개발자 계정
- 특정 애플리케이션 전용 자격증명
- 장기 실행되는 서비스의 인증

#### IAM 그룹 (IAM Group)

**정의:** 여러 IAM 사용자를 묶어서 권한을 일괄 관리하는 논리적 집합입니다.

**특징:**
- 그룹에 연결된 정책은 모든 구성원에게 자동으로 적용됩니다.
- 하나의 사용자는 최대 10개의 그룹에 속할 수 있습니다.
- 그룹은 다른 그룹을 포함할 수 없습니다 (중첩 불가).

**사용 사례:**
```
그룹명: Developers
├─ 연결 정책: AmazonEC2ReadOnlyAccess
├─ 구성원: user-alice, user-bob, user-charlie
└─ 효과: 모든 구성원이 EC2 읽기 권한 획득

그룹명: Admins
├─ 연결 정책: AdministratorAccess
├─ 구성원: user-admin1, user-admin2
└─ 효과: 관리자 권한 일괄 관리
```

#### IAM 역할 (IAM Role)

**정의:** 자격증명 없이 권한을 임시로 위임받을 수 있는 IAM 아이덴티티입니다.

**특징:**
- 비밀번호나 액세스 키를 가지지 않습니다.
- 임시 보안 자격증명(Security Token)을 통해 권한을 행사합니다.
- 신뢰 정책(Trust Policy)으로 누가 역할을 수임할 수 있는지 정의합니다.

**IAM 사용자와 역할의 차이:**

| 구분 | IAM 사용자 | IAM 역할 |
|------|----------|----------|
| 자격증명 | 장기 자격증명 (비밀번호, 액세스 키) | 임시 자격증명 (세션 토큰) |
| 대상 | 특정 개인 또는 애플리케이션 | 누구나 수임 가능 (조건 충족 시) |
| 만료 | 없음 (명시적 삭제 전까지) | 있음 (기본 1시간, 최대 12시간) |
| 사용 사례 | 개인 개발자, 장기 실행 서비스 | EC2 인스턴스, Lambda, 교차 계정 접근 |

**역할 사용 시나리오:**

1. **AWS 서비스가 다른 서비스에 접근할 때**
```
EC2 인스턴스 → (역할 수임) → S3 버킷 읽기
Lambda 함수 → (역할 수임) → DynamoDB 쓰기
```

2. **교차 계정 접근**
```
계정 A의 사용자 → (역할 수임) → 계정 B의 리소스 관리
```

3. **임시 권한 부여**
```
개발자 → (평소에는 읽기 권한) → (긴급 상황 시 역할 수임) → (쓰기 권한 획득)
```

---

### 1.3. 인증 수단의 종류와 관리

#### 콘솔 접근 (Console Access)

**인증 방식:** 사용자명 + 콘솔 비밀번호 + (선택) MFA

**URL 구조:**
```
https://<계정ID 또는 별칭>.signin.aws.amazon.com/console
```

**사용자 생성 시 설정 항목:**
- 콘솔 액세스 활성화 여부
- 초기 비밀번호 (자동 생성 또는 사용자 지정)
- 비밀번호 재설정 강제 여부

#### 프로그래밍 방식 접근 (Programmatic Access)

**인증 방식:** Access Key ID + Secret Access Key (+ Session Token)

**액세스 키 구조:**
```
Access Key ID: AKIAIOSFODNN7EXAMPLE          (20자)
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  (40자)
```

**액세스 키 관리 규칙:**

1. **최대 개수 제한**
```bash
# 한 IAM 사용자당 최대 2개의 액세스 키 보유 가능
# 이유: 키 교체 시 무중단 전환을 위함
```

2. **키 교체 절차 (무중단 방식)**
```bash
# 1단계: 새 키 생성 (key2)
aws iam create-access-key --user-name myuser

# 2단계: 애플리케이션에 key2 적용 및 테스트
export AWS_ACCESS_KEY_ID=<key2_id>
export AWS_SECRET_ACCESS_KEY=<key2_secret>

# 3단계: key2 정상 작동 확인 후 기존 키(key1) 비활성화
aws iam update-access-key --user-name myuser --access-key-id <key1_id> --status Inactive

# 4단계: 일정 기간 후 key1 삭제
aws iam delete-access-key --user-name myuser --access-key-id <key1_id>
```

3. **노출 시 즉시 조치**
```bash
# 액세스 키가 GitHub 등에 노출된 경우
# 1) 즉시 비활성화
aws iam update-access-key --user-name myuser --access-key-id <exposed_key_id> --status Inactive

# 2) 의심스러운 활동 확인 (CloudTrail 로그)
aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<exposed_key_id>

# 3) 키 삭제 및 신규 키 발급
aws iam delete-access-key --user-name myuser --access-key-id <exposed_key_id>
aws iam create-access-key --user-name myuser
```

**액세스 키 보안 모범사례:**

```
✅ DO (해야 할 것)
- 환경변수 또는 AWS CLI 프로파일에 저장
- 주기적 교체 (90일 권장)
- 최소 권한 원칙 적용
- CloudTrail로 사용 이력 모니터링

❌ DON'T (하지 말아야 할 것)
- 소스 코드에 하드코딩
- GitHub 등 공개 저장소에 커밋
- 이메일, 메신저로 전송
- 여러 사용자 간 공유
```

---

### 1.4. IAM 정책(Policy) 구조 및 유형

#### 정책의 기본 구조

IAM 정책은 JSON 형식으로 작성되며, 다음 요소로 구성됩니다:

**필수 요소:**
- **Version**: 정책 언어 버전 (항상 "2012-10-17" 사용)
- **Statement**: 권한 규칙의 배열

**Statement 내부 요소:**
- **Effect**: "Allow" 또는 "Deny"
- **Action**: 허용/거부할 API 작업
- **Resource**: 대상 리소스의 ARN
- **Principal**: (리소스 기반 정책만) 권한을 받을 주체

#### 자격증명 기반 정책 (Identity-based Policy)

**정의:** IAM 사용자, 그룹, 역할에 연결되는 정책입니다.

**예제 1: S3 버킷 읽기 권한**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ]
    }
  ]
}
```

**각 필드 설명:**
- `Version`: 정책 언어 버전 (변경하지 마십시오)
- `Effect: "Allow"`: 이 규칙은 권한을 허용합니다
- `Action`: 허용할 S3 API 작업 목록
  - `s3:GetObject`: 객체 다운로드
  - `s3:ListBucket`: 버킷 내용 조회
- `Resource`: 대상 리소스 ARN
  - `arn:aws:s3:::my-bucket`: 버킷 자체
  - `arn:aws:s3:::my-bucket/*`: 버킷 내 모든 객체

**예제 2: EC2 제한적 관리 권한**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:StartInstances",
        "ec2:StopInstances"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": "Development"
        }
      }
    }
  ]
}
```

**각 필드 설명:**
- `Action`: EC2 인스턴스 조회, 시작, 중지 권한
- `Resource: "*"`: 모든 EC2 리소스 (Condition으로 필터링)
- `Condition`: 추가 조건
  - `Environment=Development` 태그가 있는 인스턴스만 제어 가능

#### 리소스 기반 정책 (Resource-based Policy)

**정의:** 리소스 자체에 연결되는 정책입니다 (S3 버킷 정책, SQS 큐 정책 등).

**예제: S3 버킷 정책 (다른 계정 접근 허용)**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/Alice"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-shared-bucket/*"
    }
  ]
}
```

**각 필드 설명:**
- `Principal`: 권한을 받을 주체 (리소스 기반 정책만 존재)
  - `AWS: "arn:aws:iam::123456789012:user/Alice"`: 특정 IAM 사용자 지정
- `Action: "s3:GetObject"`: 객체 다운로드 허용
- `Resource`: 이 버킷의 모든 객체

**자격증명 기반 vs 리소스 기반 정책 비교:**

| 구분 | 자격증명 기반 정책 | 리소스 기반 정책 |
|------|----------------|----------------|
| 연결 대상 | IAM 사용자, 그룹, 역할 | 리소스 (S3, SQS, Lambda 등) |
| Principal | 불필요 (연결 대상이 곧 주체) | 필수 (누가 접근할 수 있는지 명시) |
| 교차 계정 | 역할 필요 | 직접 허용 가능 |
| 사용 예시 | 개발자에게 EC2 권한 부여 | S3 버킷을 다른 계정과 공유 |

#### 관리형 정책 vs 인라인 정책

**관리형 정책 (Managed Policy):**
- 독립적으로 존재하며 여러 사용자/그룹/역할에 연결 가능
- AWS 관리형: AWS가 제공 (예: `AdministratorAccess`)
- 고객 관리형: 사용자가 직접 생성

```bash
# 관리형 정책 연결
aws iam attach-user-policy \
  --user-name alice \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

**인라인 정책 (Inline Policy):**
- 특정 사용자/그룹/역할에 직접 내장
- 해당 아이덴티티 삭제 시 함께 삭제됨
- 1:1 관계만 성립

```bash
# 인라인 정책 생성
aws iam put-user-policy \
  --user-name bob \
  --policy-name S3SpecificAccess \
  --policy-document file://policy.json
```

**권장 사용 방법:**
```
관리형 정책 사용 권장:
✅ 여러 사용자에게 동일한 권한 부여
✅ 권한 변경 시 일괄 적용 필요
✅ 버전 관리 필요

인라인 정책 사용 권장:
✅ 특정 사용자만의 고유 권한
✅ 사용자 삭제 시 권한도 함께 제거되어야 함
```

---

### 1.5. 정책 평가 우선순위

AWS는 여러 정책이 중첩되어 있을 때 다음 순서로 최종 권한을 결정합니다:

#### 평가 순서

```mermaid
graph TD
    A[권한 요청 발생] --> B{명시적 거부 Deny 있음?}
    B -->|Yes| C[액세스 거부]
    B -->|No| D{명시적 허용 Allow 있음?}
    D -->|Yes| E[액세스 허용]
    D -->|No| F[액세스 거부<br/>묵시적 거부]
    
    style C fill:#ffcccc
    style E fill:#ccffcc
    style F fill:#ffcccc
```

**우선순위:**
1. **명시적 거부 (Explicit Deny)** - 최우선
2. **명시적 허용 (Explicit Allow)** - 2순위
3. **묵시적 거부 (Implicit Deny)** - 기본값

#### 실제 예제

**시나리오:** IAM 사용자 Alice는 다음 정책들을 가지고 있습니다.

**정책 A (그룹을 통해 상속):**
```json
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}
```

**정책 B (직접 연결):**
```json
{
  "Effect": "Deny",
  "Action": "s3:DeleteBucket",
  "Resource": "*"
}
```

**결과:**
- Alice는 모든 S3 작업을 수행할 수 있습니다 (정책 A).
- **단,** S3 버킷 삭제는 불가능합니다 (정책 B의 명시적 거부가 우선).

#### 권한 경계와의 상호작용

**권한 경계 (Permission Boundary):** 사용자 또는 역할이 가질 수 있는 최대 권한을 제한합니다.

```mermaid
graph LR
    A[자격증명 정책] --> C[교집합]
    B[권한 경계] --> C
    C --> D[최종 권한]
    
    style C fill:#ffffcc
    style D fill:#ccffcc
```

**예제:**

**자격증명 정책:**
```json
{
  "Effect": "Allow",
  "Action": ["s3:*", "ec2:*", "lambda:*"],
  "Resource": "*"
}
```

**권한 경계:**
```json
{
  "Effect": "Allow",
  "Action": ["s3:*", "ec2:*"],
  "Resource": "*"
}
```

**최종 권한:** S3와 EC2만 사용 가능 (Lambda는 권한 경계에 없으므로 제외)

---

### 1.6. 콘솔 실습: IAM 사용자 생성 및 S3 접근

#### 실습 목표

IAM 사용자를 생성하고, S3 읽기 권한을 부여한 후, 해당 사용자로 로그인하여 S3 버킷에 접근하는 전체 흐름을 실습합니다.

#### 사전 준비

- AWS 계정 (루트 또는 관리자 권한)
- 테스트용 S3 버킷 (이미 존재하거나 실습 중 생성)
- 브라우저 시크릿 창 (세션 충돌 방지)

#### 1단계: IAM 사용자 생성

**AWS 콘솔 경로:**
```
IAM > Users > Create user
```

**설정 항목:**

1. **User name**: `demo-user-s3reader` (네이밍 규칙 준수)

2. **Provide user access to the AWS Management Console**: 체크
   - Access type: AWS Management Console access
   - Console password: Custom password 선택 후 임시 비밀번호 입력
   - Require password reset: 체크 (초기 로그인 시 비밀번호 변경 강제)

3. **Set permissions**:
   - 옵션 1: Add user to group (권장)
     ```
     그룹명: S3ReadOnlyUsers
     연결 정책: AmazonS3ReadOnlyAccess (AWS 관리형)
     ```
   - 옵션 2: Attach policies directly
     ```
     정책 검색: "S3ReadOnly"
     선택: AmazonS3ReadOnlyAccess
     ```

4. **Review and create**: 설정 확인 후 생성

**결과 화면:**
```
Success!
User demo-user-s3reader created successfully.

Console sign-in URL: https://123456789012.signin.aws.amazon.com/console
Username: demo-user-s3reader
Password: [초기 비밀번호 - 한 번만 표시됨]
```

**중요: credential CSV 다운로드**
- 이 정보는 **생성 시점에만** 확인 가능합니다.
- CSV 파일을 안전한 곳에 보관하십시오.

#### 2단계: 테스트용 S3 버킷 생성 (관리자 계정)

```bash
# S3 버킷 생성
aws s3 mb s3://demo-bucket-20251204-test \
  --region us-west-2

# 테스트 파일 업로드
echo "Hello from S3!" > test.txt
aws s3 cp test.txt s3://demo-bucket-20251204-test/
```

**예상 출력:**
```
make_bucket: demo-bucket-20251204-test
upload: ./test.txt to s3://demo-bucket-20251204-test/test.txt
```

#### 3단계: 새 사용자로 로그인 (시크릿 창 사용)

**로그인 절차:**
1. 브라우저 시크릿(Incognito) 창 열기
2. Console sign-in URL 접속
3. 사용자명 및 초기 비밀번호 입력
4. 비밀번호 변경 프롬프트에서 새 비밀번호 설정

**로그인 성공 확인:**
```
우측 상단에 "demo-user-s3reader @ 123456789012" 표시
```

#### 4단계: S3 접근 테스트

**콘솔 경로:**
```
Services > S3
```

**테스트 시나리오:**

1. **버킷 목록 조회 (성공 예상)**
   - 생성한 `demo-bucket-20251204-test` 버킷이 보여야 합니다.

2. **객체 다운로드 (성공 예상)**
   - 버킷 클릭 → `test.txt` 선택 → Download
   - 파일 내용 확인: "Hello from S3!"

3. **객체 업로드 시도 (실패 예상)**
   - Upload 버튼 클릭 → 파일 선택 → Upload
   - **예상 오류:**
     ```
     Access Denied
     You don't have permissions to upload objects to this bucket.
     ```

**오류 발생 이유:**
`AmazonS3ReadOnlyAccess` 정책은 읽기 권한만 부여하며, 쓰기 권한(`s3:PutObject`)은 포함하지 않습니다.

#### 5단계: CLI로 접근 테스트 (선택 사항)

**액세스 키 생성 (관리자 계정에서):**
```bash
aws iam create-access-key --user-name demo-user-s3reader
```

**예상 출력:**
```json
{
    "AccessKey": {
        "UserName": "demo-user-s3reader",
        "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "Status": "Active",
        "CreateDate": "2025-12-04T10:30:00Z"
    }
}
```

**AWS CLI 프로파일 설정:**
```bash
aws configure --profile demo-user
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region name: us-west-2
# Default output format: json
```

**CLI 테스트:**
```bash
# 버킷 목록 조회 (성공)
aws s3 ls --profile demo-user

# 객체 다운로드 (성공)
aws s3 cp s3://demo-bucket-20251204-test/test.txt . --profile demo-user

# 객체 업로드 시도 (실패)
aws s3 cp test-new.txt s3://demo-bucket-20251204-test/ --profile demo-user
```

**예상 오류:**
```
upload failed: ./test-new.txt to s3://demo-bucket-20251204-test/test-new.txt
An error occurred (AccessDenied) when calling the PutObject operation:
Access Denied
```

#### 트러블슈팅

**문제 1: 로그인 후 "You are not authorized to perform this action" 오류**

**원인:** 권한이 제대로 연결되지 않았습니다.

**해결:**
```bash
# 사용자의 연결된 정책 확인
aws iam list-attached-user-policies --user-name demo-user-s3reader

# 정책이 없으면 연결
aws iam attach-user-policy \
  --user-name demo-user-s3reader \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

**문제 2: 버킷 목록이 비어 있음**

**원인:** S3 버킷이 다른 리전에 생성되었거나, 버킷 자체가 없습니다.

**해결:**
```bash
# 모든 리전의 버킷 확인 (관리자 계정)
aws s3 ls

# 리전 확인
aws s3api get-bucket-location --bucket demo-bucket-20251204-test
```

**문제 3: 브라우저 세션 충돌**

**증상:** 루트 계정과 IAM 사용자 세션이 충돌하여 로그아웃됨

**해결:** 항상 시크릿 창을 사용하여 여러 계정을 동시에 테스트하십시오.

---

### 1.7. 역할(Role)과 STS를 활용한 임시 자격증명

#### 역할(Role)의 구성 요소

IAM 역할은 두 가지 정책으로 구성됩니다:

**1. 신뢰 정책 (Trust Policy)**
- 누가 이 역할을 수임(AssumeRole)할 수 있는지 정의
- 역할 생성 시 필수 설정

**2. 권한 정책 (Permissions Policy)**
- 역할을 수임한 주체가 무엇을 할 수 있는지 정의
- 일반적인 IAM 정책과 동일한 구조

#### 신뢰 정책 예제

**예제 1: IAM 사용자가 수임 가능**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/alice"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**설명:**
- `Principal`: 역할을 수임할 수 있는 주체
  - 특정 IAM 사용자 `alice` 지정
- `Action: "sts:AssumeRole"`: AssumeRole API 호출 허용

**예제 2: EC2 서비스가 수임 가능**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**설명:**
- `Principal.Service`: AWS 서비스 지정
- EC2 인스턴스가 이 역할을 자동으로 수임 가능

**예제 3: 교차 계정 접근**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::987654321098:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "unique-external-id-12345"
        }
      }
    }
  ]
}
```

**설명:**
- 다른 계정(987654321098)의 주체가 역할 수임 가능
- `ExternalId`: 보안 강화를 위한 추가 인증 토큰

#### STS(Security Token Service) 동작 원리

```mermaid
sequenceDiagram
    participant U as IAM 사용자
    participant STS as STS 서비스
    participant S3 as S3 서비스

    U->>STS: AssumeRole 요청<br/>(역할 ARN 포함)
    STS->>STS: 신뢰 정책 검증<br/>(사용자가 수임 가능한가?)
    STS-->>U: 임시 자격증명 발급<br/>(AccessKeyId, SecretAccessKey,<br/>SessionToken, 만료시간)
    U->>S3: API 요청<br/>(임시 자격증명 사용)
    S3->>S3: 권한 정책 검증
    S3-->>U: 응답
```

#### AssumeRole 명령어 상세 분석

##### 📟 `aws sts assume-role` 명령어

**목적:** 지정한 역할을 임시로 수임하여 해당 역할의 권한으로 작업할 수 있는 임시 보안 자격증명을 발급받습니다.

**기본 문법:**
```bash
aws sts assume-role \
  --role-arn <ROLE_ARN> \
  --role-session-name <SESSION_NAME> \
  [--duration-seconds <SECONDS>] \
  [--external-id <EXTERNAL_ID>]
```

**주요 옵션:**

| 옵션 | 필수 여부 | 설명 | 예시 |
|------|----------|------|------|
| --role-arn | 필수 | 수임할 역할의 ARN | arn:aws:iam::123456789012:role/S3AdminRole |
| --role-session-name | 필수 | 세션을 식별하는 이름 (로그 추적용) | mySession |
| --duration-seconds | 선택 | 세션 유효 시간 (초)<br/>기본값: 3600 (1시간)<br/>최대값: 역할 설정에 따라 다름 (최대 12시간) | 7200 |
| --external-id | 선택 | 교차 계정 접근 시 외부 ID 검증 | unique-id-12345 |
| --policy | 선택 | 세션 권한을 더 제한하는 JSON 정책 | file://policy.json |

**실행 예제:**
```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/TempRole \
  --role-session-name temp-session-20251204 \
  --duration-seconds 3600
```

**예상 출력:**
```json
{
    "Credentials": {
        "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "SessionToken": "AQoDYXdzEJr...매우긴토큰...EXAMPLEtoken",
        "Expiration": "2025-12-04T11:30:00Z"
    },
    "AssumedRoleUser": {
        "AssumedRoleId": "AROAI...EXAMPLE:temp-session-20251204",
        "Arn": "arn:aws:sts::123456789012:assumed-role/TempRole/temp-session-20251204"
    }
}
```

**출력 해석:**
- `Credentials.AccessKeyId`: 임시 액세스 키 ID
- `Credentials.SecretAccessKey`: 임시 시크릿 액세스 키
- `Credentials.SessionToken`: 세션 토큰 (필수)
- `Credentials.Expiration`: 자격증명 만료 시간 (이 시간 이후 사용 불가)
- `AssumedRoleUser.Arn`: 수임한 역할의 ARN (로그에 기록됨)

**임시 자격증명 활용:**

```bash
# 방법 1: 환경변수 설정
export AWS_ACCESS_KEY_ID="ASIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_SESSION_TOKEN="AQoDYXdzEJr...EXAMPLEtoken"

# 이후 모든 AWS CLI 명령은 역할 권한으로 실행됨
aws s3 ls

# 방법 2: jq를 사용한 자동화 (Linux/macOS)
CREDENTIALS=$(aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/TempRole \
  --role-session-name auto-session \
  --output json)

export AWS_ACCESS_KEY_ID=$(echo $CREDENTIALS | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDENTIALS | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDENTIALS | jq -r '.Credentials.SessionToken')
```

**실무 팁:**

1. **세션 이름 규칙**
```bash
# 추적 가능한 세션 이름 사용 권장
--role-session-name "${USER}-$(date +%Y%m%d%H%M%S)"
# 예: alice-20251204103000
```

2. **만료 시간 관리**
```bash
# 짧은 작업: 기본값(1시간) 사용
--duration-seconds 3600

# 긴 작업: 최대 허용 시간 사용 (역할 설정에 따라 다름)
--duration-seconds 43200  # 12시간
```

3. **자격증명 검증**
```bash
# 현재 자격증명 확인
aws sts get-caller-identity

# 예상 출력 (역할 수임 상태)
{
    "UserId": "AROAI...EXAMPLE:temp-session",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/TempRole/temp-session"
}
```

#### CLI 프로파일을 통한 자동 AssumeRole

AWS CLI는 프로파일 설정을 통해 자동으로 역할을 수임할 수 있습니다.

**설정 전 (`~/.aws/credentials`):**
```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**설정 후 (`~/.aws/config`):**
```ini
[profile production-admin]
role_arn = arn:aws:iam::123456789012:role/ProductionAdminRole
source_profile = default
region = us-west-2
output = json
duration_seconds = 3600

[profile dev-readonly]
role_arn = arn:aws:iam::123456789012:role/DevReadOnlyRole
source_profile = default
region = us-west-2
```

**변경 사항:**
- `role_arn`: 수임할 역할의 ARN 추가
- `source_profile`: 역할을 수임할 때 사용할 자격증명 (default 프로파일)
- `duration_seconds`: 세션 유효 시간

**사용 방법:**
```bash
# 프로파일 지정만으로 자동 AssumeRole 실행
aws s3 ls --profile production-admin

# CLI가 내부적으로 다음을 자동 수행:
# 1) default 프로파일의 자격증명으로 AssumeRole 호출
# 2) 임시 자격증명 획득 및 캐싱
# 3) 임시 자격증명으로 실제 API 호출
```

**장점:**
- 매번 AssumeRole 명령을 실행할 필요 없음
- 임시 자격증명이 자동으로 캐싱되어 재사용됨
- 만료 시 자동으로 재발급

### 1.8. 권한 경계(Permission Boundary)와 SCP(Service Control Policy)

#### 권한 경계 (Permission Boundary)

**정의:** IAM 사용자 또는 역할이 가질 수 있는 **최대 권한**을 제한하는 고급 기능입니다.

**핵심 원리:**
```mermaid
graph LR
    A[자격증명 정책<br/>허용: S3, EC2, Lambda] --> C[교집합 연산]
    B[권한 경계<br/>허용: S3, EC2만] --> C
    C --> D[최종 권한<br/>S3, EC2만 가능]
    
    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#ffffcc
    style D fill:#ccffcc
```

**사용 시나리오:**

1. **위임된 관리자 제한**
```
상황: 팀 리더에게 팀원의 IAM 사용자를 생성할 권한을 주되,
     팀 리더가 자신에게 관리자 권한을 부여하지 못하게 해야 함.

해결: 팀 리더에게 권한 경계를 설정하여 최대 권한을 제한.
```

2. **개발 환경 격리**
```
상황: 개발자가 개발 환경에서는 자유롭게 작업하되,
     프로덕션 리소스는 절대 건드릴 수 없게 해야 함.

해결: 개발자에게 권한 경계로 개발 리전/태그만 허용.
```

**실습 예제: 권한 경계 설정**

**1단계: 권한 경계 정책 생성**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "ec2:Describe*",
        "ec2:StartInstances",
        "ec2:StopInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

위 정책을 `DeveloperBoundary`라는 이름으로 저장합니다.

**2단계: IAM 사용자에게 권한 경계 연결**

```bash
# 권한 경계 설정
aws iam put-user-permissions-boundary \
  --user-name developer-bob \
  --permissions-boundary arn:aws:iam::123456789012:policy/DeveloperBoundary
```

**3단계: 자격증명 정책 연결**

```bash
# 광범위한 권한 부여 (관리자 권한)
aws iam attach-user-policy \
  --user-name developer-bob \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**결과:**
- Bob은 `AdministratorAccess` 정책을 가지고 있지만,
- 권한 경계(`DeveloperBoundary`)로 인해 S3, EC2 일부만 실제로 사용 가능.
- Lambda, RDS, CloudFormation 등은 권한 경계에 없으므로 사용 불가.

**검증:**

```bash
# Bob의 자격증명으로 테스트
export AWS_PROFILE=developer-bob

# S3 작업 (성공)
aws s3 ls

# EC2 조회 (성공)
aws ec2 describe-instances

# Lambda 목록 조회 (실패 - 권한 경계에 없음)
aws lambda list-functions
# 예상 오류: An error occurred (AccessDenied)
```

#### SCP (Service Control Policy)

**정의:** AWS Organizations에서 조직 단위(OU) 또는 멤버 계정에 적용하는 **최대 권한 제한** 정책입니다.

**권한 경계와 SCP 비교:**

| 구분 | 권한 경계 | SCP |
|------|----------|-----|
| 적용 대상 | 개별 IAM 사용자, 역할 | 조직 단위(OU), 계정 전체 |
| 범위 | 단일 계정 내 | 다중 계정 (Organizations) |
| 영향 범위 | 특정 사용자만 | 해당 계정의 모든 주체 (루트 제외 가능) |
| 사용 사례 | 개인별 권한 제한 | 부서별, 환경별 권한 제한 |

**SCP 구조 예제:**

**예제 1: 특정 리전만 허용**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "us-east-1",
            "us-west-2"
          ]
        }
      }
    }
  ]
}
```

**효과:** 조직 내 모든 계정은 us-east-1과 us-west-2 리전에서만 리소스 생성 가능.

**예제 2: 루트 사용자 제한**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:PrincipalArn": "arn:aws:iam::*:root"
        }
      }
    }
  ]
}
```

**효과:** 멤버 계정의 루트 사용자도 SCP에 의해 제한됨 (보안 강화).

**예제 3: 비용 최적화 - 특정 인스턴스 타입 금지**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "ec2:RunInstances",
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringNotEquals": {
          "ec2:InstanceType": [
            "t3.micro",
            "t3.small",
            "t3.medium"
          ]
        }
      }
    }
  ]
}
```

**효과:** 개발 환경 OU에서는 t3 시리즈 소형 인스턴스만 생성 가능.

#### AWS Organizations 개요

**정의:** 여러 AWS 계정을 중앙에서 관리하고 통합 결제를 제공하는 서비스입니다.

**조직 구조 예시:**

```
Root (루트 조직)
├── OU: Production (프로덕션)
│   ├── 계정: prod-web-123456
│   └── 계정: prod-db-234567
├── OU: Development (개발)
│   ├── 계정: dev-team1-345678
│   └── 계정: dev-team2-456789
└── OU: Security (보안)
    └── 계정: security-audit-567890
```

**주요 기능:**

1. **통합 결제 (Consolidated Billing)**
   - 모든 멤버 계정의 비용을 마스터 계정으로 통합
   - 사용량 기반 볼륨 할인 자동 적용

2. **계층적 권한 관리**
   - OU에 SCP 적용 시 하위 OU와 계정에 자동 상속
   - 세분화된 권한 제어 가능

3. **서비스 제어**
   - 특정 OU에서 특정 AWS 서비스 비활성화 가능
   - 예: 개발 OU에서는 CloudHSM 사용 금지

**SCP 적용 흐름:**

```mermaid
graph TD
    A[Root OU<br/>SCP: 모든 리전 허용] --> B[Production OU<br/>SCP: S3 암호화 필수]
    A --> C[Development OU<br/>SCP: t3 인스턴스만]
    B --> D[계정: prod-web<br/>최종 권한 = Root ∩ Production]
    C --> E[계정: dev-team1<br/>최종 권한 = Root ∩ Development]
    
    style A fill:#e1f5ff
    style B fill:#ffe1cc
    style C fill:#ccffe1
    style D fill:#ffffcc
    style E fill:#ffffcc
```

**실무 권장 구조:**

```bash
# 조직 생성
aws organizations create-organization --feature-set ALL

# OU 생성
aws organizations create-organizational-unit \
  --parent-id r-xxxx \
  --name Production

# SCP 적용
aws organizations attach-policy \
  --policy-id p-xxxx \
  --target-id ou-xxxx-xxxxxxxx
```

---

### 1.9. 계정 보안 관리 종합 체크리스트

#### 루트 사용자 보안

```
☑ 루트 액세스 키 삭제 완료
☑ 루트 MFA 활성화 (가상 또는 하드웨어)
☑ 루트 비밀번호 복잡도 충족 (14자 이상)
☑ 루트 로그인 정보 오프라인 안전 보관
☑ 루트 사용 CloudTrail 알림 설정
```

#### IAM 사용자 보안

```
☑ 최소 권한 원칙 적용
☑ 비밀번호 정책 강화 (복잡도, 만료, 재사용 금지)
☑ MFA 활성화 권장 또는 강제
☑ 불필요한 사용자 정기 검토 및 삭제
☑ 액세스 키 주기적 교체 (90일 권장)
☑ 사용하지 않는 액세스 키 비활성화
```

#### 권한 관리

```
☑ 그룹 기반 권한 관리 (개인별 직접 연결 최소화)
☑ 관리형 정책 우선 사용 (재사용성)
☑ 정책 변경 시 영향 범위 검토
☑ 권한 경계로 위임 관리자 제한
☑ SCP로 조직 수준 통제 (Organizations 사용 시)
```

#### 모니터링 및 감사

```
☑ CloudTrail 활성화 (모든 리전)
☑ 의심스러운 활동 알림 설정
☑ IAM Access Analyzer 활성화
☑ 정기적인 IAM 크레덴셜 리포트 검토
☑ 미사용 자격증명 자동 비활성화 (90일)
```

---

## Part 2: VPC (Virtual Private Cloud) 기초

### 2.1. VPC 개념 및 구성 요소

#### VPC란?

**VPC (Virtual Private Cloud)**는 AWS 클라우드 내에서 논리적으로 격리된 프라이빗 네트워크 공간입니다. 사용자는 IP 주소 범위, 서브넷, 라우팅 테이블, 게이트웨이 등을 완전히 제어할 수 있습니다.

**주요 특징:**

1. **리전 수준 리소스**
   - VPC는 단일 AWS 리전에 생성됩니다.
   - 해당 리전 내 모든 가용 영역(AZ)을 사용할 수 있습니다.

2. **사설 IP 주소 범위 (CIDR 블록)**
   - VPC 생성 시 RFC 1918 기준 사설 IP 범위를 지정해야 합니다.
   ```
   허용 범위:
   - 10.0.0.0/8       (10.0.0.0 ~ 10.255.255.255)
   - 172.16.0.0/12    (172.16.0.0 ~ 172.31.255.255)
   - 192.168.0.0/16   (192.168.0.0 ~ 192.168.255.255)
   ```

3. **격리 및 보안**
   - 다른 VPC, 온프레미스 네트워크와 기본적으로 격리됩니다.
   - 명시적으로 연결을 설정해야 통신 가능합니다.

**VPC 설계 시 고려사항:**

```
✅ DO
- 온프레미스 네트워크와 CIDR 중복 방지
- 미래 확장을 고려한 충분한 IP 주소 공간 확보
- 멀티 AZ 구성으로 고가용성 확보
- 퍼블릭/프라이빗 서브넷 명확히 분리

❌ DON'T
- 너무 작은 CIDR (예: /28) - IP 부족 위험
- 여러 VPC 간 CIDR 중복 - VPC Peering 불가
- 단일 AZ 구성 - 장애 시 전체 중단
```

#### CIDR 표기법 이해

**CIDR (Classless Inter-Domain Routing):**

```
형식: IP주소/Prefix길이
예시: 10.0.0.0/16

10.0.0.0: 네트워크 주소
/16: 앞의 16비트는 네트워크 부분 (고정)
     뒤의 16비트는 호스트 부분 (가변)
```

**Prefix에 따른 IP 개수:**

| CIDR | 서브넷 마스크 | 사용 가능 IP | 용도 |
|------|------------|------------|------|
| /28 | 255.255.255.240 | 16개 (11개 사용 가능*) | 매우 작은 서브넷 |
| /24 | 255.255.255.0 | 256개 (251개 사용 가능*) | 일반적인 서브넷 |
| /20 | 255.255.240.0 | 4096개 (4091개 사용 가능*) | 큰 서브넷 |
| /16 | 255.255.0.0 | 65536개 (65531개 사용 가능*) | VPC 전체 |

\* AWS는 각 서브넷에서 5개의 IP를 예약합니다 (자세한 내용은 서브넷 섹션 참조).

**실무 예시:**

```
VPC CIDR: 10.100.0.0/16
├─ us-west-2a
│  ├─ Public Subnet:  10.100.1.0/24  (256개 IP)
│  └─ Private Subnet: 10.100.11.0/24 (256개 IP)
└─ us-west-2b
   ├─ Public Subnet:  10.100.2.0/24  (256개 IP)
   └─ Private Subnet: 10.100.12.0/24 (256개 IP)
```

---

### 2.2. 서브넷 (Subnet)

#### 서브넷이란?

**서브넷 (Subnet)**은 VPC의 IP 주소 범위를 더 작은 단위로 분할한 하위 네트워크입니다. 각 서브넷은 특정 가용 영역(AZ)에 위치합니다.

**핵심 규칙:**

1. **서브넷 CIDR은 VPC CIDR의 하위 집합**
```
VPC CIDR: 10.0.0.0/16
유효한 서브넷: 10.0.1.0/24, 10.0.2.0/24, ...
무효한 서브넷: 192.168.1.0/24 (VPC CIDR 범위 벗어남)
```

2. **서브넷은 하나의 AZ에만 속함**
```
Subnet-A → us-west-2a (고정)
Subnet-B → us-west-2c (고정)
```

3. **서브넷 간 CIDR 중복 불가**
```
❌ 불가능:
Subnet-A: 10.0.1.0/24
Subnet-B: 10.0.1.0/24  (같은 범위)

✅ 가능:
Subnet-A: 10.0.1.0/24
Subnet-B: 10.0.2.0/24  (다른 범위)
```

#### AWS 예약 IP 주소

AWS는 각 서브넷에서 **5개의 IP 주소**를 예약하여 사용자가 사용할 수 없습니다.

**예제: 10.0.1.0/24 서브넷**

| IP 주소 | 용도 | 설명 |
|---------|------|------|
| 10.0.1.0 | 네트워크 주소 | 서브넷 자체를 식별 |
| 10.0.1.1 | VPC 라우터 | VPC 내부 라우팅 담당 |
| 10.0.1.2 | DNS 서버 | Amazon DNS 서버 (VPC base + 2) |
| 10.0.1.3 | 미래 사용 예약 | AWS가 향후 사용 가능 |
| 10.0.1.255 | 브로드캐스트 주소 | VPC는 브로드캐스트 미지원이나 예약됨 |

**사용 가능한 IP:**
```
총 IP: 256개 (2^8)
예약 IP: 5개
사용 가능: 251개
```

**실제 할당 예시:**
```bash
# 서브넷 정보 조회
aws ec2 describe-subnets --subnet-ids subnet-12345678

# 출력 예시
{
    "AvailableIpAddressCount": 251,  # 사용 가능 IP
    "CidrBlock": "10.0.1.0/24",
    "AvailabilityZone": "us-west-2a"
}
```

#### 퍼블릭 서브넷 vs 프라이빗 서브넷

**퍼블릭 서브넷 (Public Subnet):**

**특징:**
- 인터넷 게이트웨이(IGW)로 향하는 라우팅 규칙 보유
- 배치된 리소스는 공인 IP 또는 Elastic IP 할당 가능
- 외부 인터넷에서 직접 접근 가능

**사용 사례:**
- 웹 서버 (HTTP/HTTPS 서비스)
- 로드 밸런서 (ALB, NLB)
- 베스천 호스트 (Bastion Host)
- NAT Gateway

**라우팅 테이블 예시:**
```
목적지 (Destination)    대상 (Target)
10.0.0.0/16             local          # VPC 내부 통신
0.0.0.0/0               igw-12345678   # 인터넷 게이트웨이
```

**프라이빗 서브넷 (Private Subnet):**

**특징:**
- 인터넷 게이트웨이로 향하는 직접 경로 없음
- 배치된 리소스는 사설 IP만 보유
- 외부 인터넷에서 직접 접근 불가

**사용 사례:**
- 데이터베이스 (RDS, ElastiCache)
- 애플리케이션 서버 (백엔드 로직)
- 내부 마이크로서비스
- 민감한 데이터 처리 인스턴스

**라우팅 테이블 예시 (아웃바운드 인터넷 필요 시):**
```
목적지 (Destination)    대상 (Target)
10.0.0.0/16             local               # VPC 내부 통신
0.0.0.0/0               nat-0a1b2c3d4e5f    # NAT Gateway
```

**비교 표:**

| 구분 | 퍼블릭 서브넷 | 프라이빗 서브넷 |
|------|-------------|---------------|
| IGW 경로 | 있음 (0.0.0.0/0 → IGW) | 없음 |
| 공인 IP | 할당 가능 | 할당 불가 |
| 인바운드 접근 | 인터넷에서 직접 접근 가능 | 불가능 (VPC 내부만) |
| 아웃바운드 접근 | IGW 통해 직접 | NAT Gateway 필요 |
| 용도 | 공개 서비스 | 내부 서비스 |

---

### 2.3. 라우팅 테이블 (Route Table)

#### 라우팅 테이블의 역할

**라우팅 테이블**은 VPC 내에서 네트워크 트래픽의 경로를 결정하는 규칙 집합입니다. 각 서브넷은 반드시 하나의 라우팅 테이블에 연결되어야 합니다.

**기본 구조:**

| 목적지 (Destination) | 대상 (Target) | 상태 (Status) |
|---------------------|--------------|--------------|
| 10.0.0.0/16 | local | Active |
| 0.0.0.0/0 | igw-1234abcd | Active |

**필드 설명:**
- **Destination**: 목적지 IP 범위 (CIDR 형식)
- **Target**: 트래픽을 전달할 대상
  - `local`: VPC 내부 통신
  - `igw-xxx`: 인터넷 게이트웨이
  - `nat-xxx`: NAT Gateway
  - `eni-xxx`: 특정 네트워크 인터페이스
  - `pcx-xxx`: VPC Peering 연결
- **Status**: 경로의 활성화 상태

#### 라우팅 규칙 평가 순서

**원칙: 가장 구체적인 경로(longest prefix match) 우선 적용**

```
라우팅 테이블:
1. 10.0.1.0/24  → Target A
2. 10.0.0.0/16  → Target B
3. 0.0.0.0/0    → Target C

패킷 목적지: 10.0.1.50
매칭 순서:
1) 10.0.1.0/24 매칭 (O) → Target A 선택 ✅
2) 10.0.0.0/16 매칭 (O)
3) 0.0.0.0/0 매칭 (O)

결과: Target A로 전달 (가장 구체적인 경로)
```

**실무 예제:**

```
목적지                대상              설명
10.0.0.0/16         local            VPC 내부 통신 (최우선)
192.168.0.0/16      pcx-12345        VPC Peering 연결
0.0.0.0/0           igw-abcde        나머지 모든 트래픽 (인터넷)

패킷 A: 10.0.5.10    → local (VPC 내부)
패킷 B: 192.168.1.1  → pcx-12345 (Peering)
패킷 C: 8.8.8.8      → igw-abcde (인터넷)
```

#### 라우팅 테이블과 서브넷 연결

**규칙:**
- 하나의 서브넷은 **하나의** 라우팅 테이블에만 연결됩니다.
- 하나의 라우팅 테이블은 **여러 개의** 서브넷에 연결될 수 있습니다.

**연결 예시:**

```
Route Table: public-rt
└─ 연결된 서브넷:
   ├─ subnet-public-2a (us-west-2a)
   └─ subnet-public-2c (us-west-2c)

Route Table: private-rt
└─ 연결된 서브넷:
   ├─ subnet-private-2a (us-west-2a)
   └─ subnet-private-2c (us-west-2c)
```

**명령어로 확인:**

```bash
# 서브넷이 연결된 라우팅 테이블 확인
aws ec2 describe-route-tables \
  --filters "Name=association.subnet-id,Values=subnet-12345678" \
  --query 'RouteTables[0].RouteTableId' \
  --output text

# 예상 출력
rtb-0a1b2c3d4e5f6g7h8
```

---

### 2.4. 인터넷 게이트웨이 (Internet Gateway, IGW)

#### IGW란?

**인터넷 게이트웨이**는 VPC와 인터넷 간의 통신을 가능하게 하는 수평 확장 가능한 고가용성 VPC 구성 요소입니다.

**주요 기능:**

1. **NAT (Network Address Translation)**
   - 인스턴스의 사설 IP를 공인 IP로 변환
   - 응답 패킷을 다시 사설 IP로 변환하여 전달

2. **고가용성**
   - AWS가 자동으로 이중화 및 확장 관리
   - 단일 장애 지점(SPOF) 없음

**IGW 동작 방식:**

```mermaid
sequenceDiagram
    participant EC2 as EC2 인스턴스<br/>(사설IP: 10.0.1.10<br/>공인IP: 54.1.2.3)
    participant IGW as Internet Gateway
    participant Internet as 인터넷

    EC2->>IGW: 송신 패킷<br/>출발지: 10.0.1.10
    IGW->>IGW: NAT 수행<br/>출발지: 10.0.1.10 → 54.1.2.3
    IGW->>Internet: 송신 패킷<br/>출발지: 54.1.2.3
    Internet->>IGW: 응답 패킷<br/>목적지: 54.1.2.3
    IGW->>IGW: NAT 수행<br/>목적지: 54.1.2.3 → 10.0.1.10
    IGW->>EC2: 응답 패킷<br/>목적지: 10.0.1.10
```

**IGW 사용 조건:**

```
인스턴스가 인터넷 통신을 하려면:
✅ 인스턴스에 공인 IP 또는 Elastic IP 할당
✅ 서브넷의 라우팅 테이블에 IGW로의 경로 등록
   (0.0.0.0/0 → igw-xxx)
✅ 보안 그룹에서 아웃바운드 트래픽 허용
✅ NACL에서 아웃바운드 및 인바운드 허용
```

**생성 및 연결:**

```bash
# IGW 생성
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=my-igw}]'

# 예상 출력
{
    "InternetGateway": {
        "InternetGatewayId": "igw-0a1b2c3d4e5f6g7h8"
    }
}

# VPC에 연결
aws ec2 attach-internet-gateway \
  --internet-gateway-id igw-0a1b2c3d4e5f6g7h8 \
  --vpc-id vpc-12345678

# 라우팅 테이블에 경로 추가
aws ec2 create-route \
  --route-table-id rtb-abcd1234 \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-0a1b2c3d4e5f6g7h8
```

---

### 2.5. NAT Gateway / NAT Instance

#### NAT Gateway란?

**NAT Gateway**는 프라이빗 서브넷의 인스턴스가 인터넷으로 아웃바운드 트래픽을 보낼 수 있게 하되, 인바운드 연결은 차단하는 관리형 서비스입니다.

**NAT Gateway 특징:**

| 특징 | 설명 |
|------|------|
| 관리 주체 | AWS 완전 관리형 |
| 확장성 | 자동 확장 (최대 100 Gbps) |
| 고가용성 | 단일 AZ 내 이중화 (AZ 간 이중화는 사용자 책임) |
| 포트 포워딩 | 미지원 |
| 보안 그룹 | 적용 불가 (NACL로 제어) |
| Elastic IP | 필수 (자동 할당 또는 수동 지정) |
| 비용 | 시간당 요금 + 데이터 처리 요금 |

**NAT Gateway 동작 방식:**

```
프라이빗 서브넷의 EC2 (10.0.11.10)
    ↓ 아웃바운드 요청 (목적지: 8.8.8.8)
NAT Gateway (Public Subnet, EIP: 54.1.2.3)
    ↓ 출발지 IP 변경: 10.0.11.10 → 54.1.2.3
Internet Gateway
    ↓
인터넷 (8.8.8.8)
```

**NAT Gateway 배치 권장 사항:**

```
고가용성 구성:
AZ-A
├─ Public Subnet: NAT Gateway-A
└─ Private Subnet: EC2들 → NAT Gateway-A 사용

AZ-B
├─ Public Subnet: NAT Gateway-B
└─ Private Subnet: EC2들 → NAT Gateway-B 사용

이유: AZ 장애 시에도 다른 AZ의 NAT Gateway로 계속 작동
```

**생성 명령어:**

```bash
# Elastic IP 할당 (NAT Gateway용)
aws ec2 allocate-address --domain vpc

# 예상 출력
{
    "AllocationId": "eipalloc-12345678",
    "PublicIp": "54.1.2.3"
}

# NAT Gateway 생성 (퍼블릭 서브넷에 배치)
aws ec2 create-nat-gateway \
  --subnet-id subnet-public-2a \
  --allocation-id eipalloc-12345678 \
  --tag-specifications 'ResourceType=nat-gateway,Tags=[{Key=Name,Value=nat-gw-2a}]'

# 예상 출력
{
    "NatGateway": {
        "NatGatewayId": "nat-0a1b2c3d4e5f6g7h8",
        "State": "pending"
    }
}

# 상태 확인 (available 될 때까지 대기)
aws ec2 describe-nat-gateways --nat-gateway-ids nat-0a1b2c3d4e5f6g7h8

# 프라이빗 서브넷 라우팅 테이블에 경로 추가
aws ec2 create-route \
  --route-table-id rtb-private-2a \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id nat-0a1b2c3d4e5f6g7h8
```

#### NAT Instance (참고)

**NAT Instance**는 EC2 인스턴스를 NAT Gateway 대신 사용하는 방식입니다.

**NAT Gateway vs NAT Instance 비교:**

| 구분 | NAT Gateway | NAT Instance |
|------|------------|-------------|
| 관리 | AWS 관리형 | 사용자 직접 관리 |
| 확장성 | 자동 확장 | 수동 확장 (인스턴스 타입 변경) |
| 고가용성 | AZ 내 자동 | 사용자 구성 필요 |
| 보안 그룹 | 적용 불가 | 적용 가능 |
| 포트 포워딩 | 불가 | 가능 (iptables 설정) |
| 비용 | 시간당 + 데이터 | EC2 비용만 |
| 유지보수 | 불필요 | OS 패치, 업데이트 필요 |
| 권장 사용 | 대부분의 경우 | 포트 포워딩 필요 시, 비용 최적화 |

**NAT Instance 사용 사례:**
- 포트 포워딩이 필수인 경우
- 비용 최적화가 중요한 경우
- 세밀한 네트워크 제어가 필요한 경우

### 2.6. 보안 그룹과 NACL

#### 보안 그룹 (Security Group)

**정의:** EC2 인스턴스 수준에서 작동하는 **상태 유지형(Stateful)** 가상 방화벽입니다.

**핵심 특징:**

1. **허용 규칙만 지원**
   - Allow 규칙만 정의 가능
   - Deny 규칙은 정의 불가 (NACL 사용)

2. **상태 유지 (Stateful)**
   - 인바운드 허용 시 해당 세션의 아웃바운드는 자동 허용
   - 반대의 경우도 동일

3. **모든 규칙 평가**
   - 여러 규칙 중 하나라도 매칭되면 허용

**기본 규칙:**
```
사용자 정의 보안 그룹:
- 인바운드: 모든 트래픽 거부
- 아웃바운드: 모든 트래픽 허용

Default 보안 그룹:
- 인바운드: 같은 보안 그룹 내만 허용
- 아웃바운드: 모두 허용
```

#### NACL (Network ACL)

**정의:** 서브넷 수준에서 작동하는 **상태 비저장형(Stateless)** 가상 방화벽입니다.

**핵심 특징:**

1. **허용/거부 규칙 모두 지원**
2. **상태 비저장 (Stateless)**
   - 인바운드와 아웃바운드 독립적 평가
3. **규칙 번호 순서대로 평가**
   - 낮은 번호부터 평가, 매칭 시 즉시 적용

**비교표:**

| 구분 | 보안 그룹 | NACL |
|------|----------|------|
| 작동 수준 | 인스턴스 (ENI) | 서브넷 |
| 상태 유지 | Stateful | Stateless |
| 규칙 유형 | Allow만 | Allow + Deny |
| 규칙 평가 | 모든 규칙 | 번호 순 (첫 매칭) |
| 기본 정책 | 인바운드 거부 | 사용자 정의: 모두 거부 |

---

## Part 3: VPC 네트워크 구축 실습

### 3.1. 실습 목표 및 아키텍처

**구축할 네트워크:**

```
VPC: sk46-myvpc (10.0.0.0/16)

us-west-2a:
├─ Public Subnet 1: 10.0.1.0/24
└─ Private Subnet 1: 10.0.11.0/24

us-west-2c:
├─ Public Subnet 2: 10.0.2.0/24
└─ Private Subnet 2: 10.0.12.0/24

Components:
├─ Internet Gateway: sk46-myvpc-igw
├─ NAT Gateway: sk46-myvpc-natgw
├─ Route Tables: public-rt, private-rt
└─ Security Groups
```

### 3.2. 콘솔 실습 단계

#### Step 1: VPC 생성

**콘솔 경로:**
```
Services > VPC > Your VPCs > Create VPC
```

**설정:**
```
Name: sk46-myvpc
IPv4 CIDR: 10.0.0.0/16
IPv6: No IPv6
Tenancy: Default
```

**Create VPC 클릭**

---

#### Step 2: 서브넷 생성 (4개)

**콘솔 경로:**
```
VPC > Subnets > Create subnet
```

**서브넷 1:**
```
VPC: sk46-myvpc
Name: sk46-myvpc-public-subnet1
AZ: us-west-2a
CIDR: 10.0.1.0/24
```

**서브넷 2:**
```
Name: sk46-myvpc-private-subnet1
AZ: us-west-2a
CIDR: 10.0.11.0/24
```

**서브넷 3:**
```
Name: sk46-myvpc-public-subnet2
AZ: us-west-2c
CIDR: 10.0.2.0/24
```

**서브넷 4:**
```
Name: sk46-myvpc-private-subnet2
AZ: us-west-2c
CIDR: 10.0.12.0/24
```

**퍼블릭 서브넷 설정:**
```
public-subnet1, public-subnet2 선택
Actions > Edit subnet settings
☑ Enable auto-assign public IPv4 address
Save
```

---

#### Step 3: Internet Gateway 생성

**콘솔 경로:**
```
VPC > Internet gateways > Create internet gateway
```

**설정:**
```
Name: sk46-myvpc-igw
```

**VPC에 연결:**
```
Actions > Attach to VPC
VPC: sk46-myvpc 선택
Attach
```

---

#### Step 4: NAT Gateway 생성

**Elastic IP 할당:**
```
VPC > Elastic IPs > Allocate Elastic IP address
Tags: Name = sk46-myvpc-natgw-eip
Allocate
```

**NAT Gateway 생성:**
```
VPC > NAT gateways > Create NAT gateway

Name: sk46-myvpc-natgw
Subnet: sk46-myvpc-public-subnet1 (중요!)
Elastic IP: 방금 할당한 EIP 선택
Create
```

State가 Available될 때까지 대기 (2-3분)

---

#### Step 5: 라우팅 테이블 구성

**Public Route Table:**
```
VPC > Route tables > Create route table

Name: sk46-myvpc-public-rt
VPC: sk46-myvpc
Create
```

**IGW 경로 추가:**
```
sk46-myvpc-public-rt 선택
Routes 탭 > Edit routes
Add route:
  Destination: 0.0.0.0/0
  Target: Internet Gateway > sk46-myvpc-igw
Save
```

**서브넷 연결:**
```
Subnet associations 탭
Edit subnet associations
☑ public-subnet1
☑ public-subnet2
Save
```

**Private Route Table:**
```
Create route table

Name: sk46-myvpc-private-rt
VPC: sk46-myvpc
Create
```

**NAT Gateway 경로 추가:**
```
Routes 탭 > Edit routes
Add route:
  Destination: 0.0.0.0/0
  Target: NAT Gateway > sk46-myvpc-natgw
Save
```

**서브넷 연결:**
```
Subnet associations
☑ private-subnet1
☑ private-subnet2
Save
```

---

#### Step 6: 보안 그룹 생성

**웹 서버용:**
```
VPC > Security groups > Create security group

Name: sk46-myvpc-web-sg
Description: Web server security group
VPC: sk46-myvpc

Inbound rules:
- Type: HTTP, Port: 80, Source: 0.0.0.0/0
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0
- Type: SSH, Port: 22, Source: My IP

Outbound: 기본값 유지 (All traffic)
Create
```

**DB용:**
```
Name: sk46-myvpc-db-sg
Description: Database security group

Inbound rules:
- Type: MySQL/Aurora, Port: 3306
  Source: sk46-myvpc-web-sg (보안 그룹 ID)

Create
```

---

#### Step 7: 검증

**Resource Map 확인:**
```
VPC > sk46-myvpc > Resource map 탭

확인 항목:
✅ VPC
✅ Subnets (4개)
✅ Internet Gateway
✅ NAT Gateway
✅ Route tables
```

**라우팅 확인:**
```
Public RT:
- 10.0.0.0/16 → local
- 0.0.0.0/0 → igw

Private RT:
- 10.0.0.0/16 → local
- 0.0.0.0/0 → nat
```

---

#### Step 8: 실습 정리 (필수!)

**삭제 순서:**

1. **NAT Gateway 삭제**
```
NAT gateways > sk46-myvpc-natgw
Actions > Delete NAT gateway
입력: delete
Delete
```

2. **Elastic IP 해제**
```
Elastic IPs > EIP 선택
Actions > Release Elastic IP addresses
Release
```

3. **라우팅 테이블 삭제**
```
public-rt, private-rt 삭제
(Main은 자동 삭제)
```

4. **Internet Gateway 삭제**
```
Actions > Detach from VPC
Actions > Delete internet gateway
```

5. **보안 그룹 삭제**
```
web-sg, db-sg 삭제
(default는 삭제 불가)
```

6. **서브넷 삭제**
```
4개 모두 선택하여 삭제
```

7. **VPC 삭제**
```
sk46-myvpc 삭제
입력: delete
Delete
```

---

## 주요 개념 요약표

| 구분 | 주요 개념 | 설명 | 예시/비고 |
|------|----------|------|-----------|
| **클라우드** | NIST 5대 특성 | 주문형 셀프서비스, 광범위 네트워크 접근, 리소스 풀링, 빠른 탄력성, 측정 가능 서비스 | 클라우드 판단 기준 |
| | IaaS/PaaS/SaaS | 서비스 모델별 관리 책임 | EC2 / Beanstalk / Google Workspace |
| | 리전/AZ | 지리적 단위 / 물리적 분리 데이터센터 | 멀티 AZ로 고가용성 |
| **IAM** | 루트 사용자 | 모든 권한 보유, 일상 사용 금지 | MFA 필수 |
| | IAM 사용자 | 개인/서비스용 장기 자격증명 | 생성 시 권한 없음 |
| | IAM 그룹 | 사용자 권한 일괄 관리 | 정책 상속 |
| | IAM 역할 | 임시 자격증명 위임 | EC2 프로파일, 교차 계정 |
| | 정책 평가 | 명시적 Deny > Allow > 묵시적 Deny | Deny 최우선 |
| | 권한 경계 | 최대 권한 제한 | 자격증명 정책과 교집합 |
| | SCP | OU/계정 단위 제한 | Organizations 필수 |
| **VPC** | VPC | 논리적 격리 네트워크 | 리전 단위, CIDR 필수 |
| | 서브넷 | VPC의 하위 네트워크 | 1개 AZ, 5개 IP 예약 |
| | 퍼블릭 서브넷 | IGW 경로, 공인 IP | 웹 서버 배치 |
| | 프라이빗 서브넷 | 사설 IP만 | DB 배치 |
| | IGW | VPC-인터넷 게이트웨이 | VPC당 1개 |
| | NAT Gateway | 프라이빗→인터넷 아웃바운드 | EIP 필수, 비용 주의 |
| | 라우팅 테이블 | 트래픽 경로 결정 | Longest Prefix Match |
| | 보안 그룹 | 인스턴스 레벨 Stateful | 허용만 |
| | NACL | 서브넷 레벨 Stateless | 허용/거부 |

---

## 마무리

### 학습 성과

**Part 1 - 클라우드 기초:**
- NIST 5대 특성 이해
- 서비스 모델 구분 가능
- AWS 글로벌 인프라 구조 파악
- 리전 선택 기준 이해

**Part 2 - IAM:**
- 루트/IAM 사용자 구분
- 정책 구조 이해 (JSON)
- 역할 기반 임시 자격증명
- 콘솔 실습 완료

**Part 3 - VPC:**
- VPC 기본 개념 이해
- 멀티 AZ 네트워크 구축
- IGW/NAT 구성
- 보안 그룹/NACL 설정

### 다음 학습 주제

- VPC Peering / Transit Gateway
- ALB + Auto Scaling 구성
- RDS Multi-AZ 배포
- CloudFront + S3 정적 호스팅

### 실무 체크리스트

**보안:**
```
☐ 루트 MFA 활성화
☐ 루트 액세스 키 삭제
☐ IAM 그룹 기반 권한 관리
☐ 비밀번호 정책 강화
```

**네트워크:**
```
☐ 멀티 AZ 배포
☐ 퍼블릭/프라이빗 분리
☐ NAT GW AZ당 1개
☐ 최소 권한 보안 그룹
```

**비용:**
```
☐ 미사용 리소스 정리
☐ NAT GW 사용량 모니터링
☐ EIP 미사용 시 해제
☐ Cost Explorer 정기 확인
```

### 참고 자료

- IAM Guide: https://docs.aws.amazon.com/iam/
- VPC Guide: https://docs.aws.amazon.com/vpc/
- AWS Skill Builder (무료 학습)
- AWS re:Post (Q&A 포럼)

