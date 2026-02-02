---
title: "SQL Injection 개념 및 원리"
excerpt: "SQL Injection의 핵심 원리와 논리적 접근 방법을 정리한 학습자료"

categories: ['sk']
typora-root-url: ../../

date: 2026-01-28
last_modified_at: 2026-01-28
published: true
tags: [sk-rookies, sql-injection, pentesting, web-security, union-sqli, error-based-sqli, oracle, mysql, sqlite, 모의해킹, SQL인젝션, 웹보안]
---

## 개요

모의해킹 과정에서 배운 SQL Injection의 원리와 논리적 접근 방법을 정리한 학습자료다.

> "공격구문 외우고 명령어 외우는 수업이 아니다. 원리를 이해하고 나서 AI한테 질문해서 원하는 답을 얻어내는 게 중요하다."
>
> "그냥 `or 1=1` 넣는 게 무슨 의미가 있나. 왜 이렇게 되는지 원리를 이해해야 한다."

---

## 1. 웹 아키텍처 기초

### 1.1 전체 흐름

```
사용자(브라우저)  →  요청(Request)  →  웹서버(Static)  →  WAS(로직처리)  →  DB
                 ←  응답(Response) ←                   ←                 ←
```

**구성 요소:**
- **클라이언트**: 브라우저 (Chrome, Firefox, Safari 등)
- **웹서버**: Apache, Nginx (정적 파일 제공)
- **WAS**: Tomcat 등 (동적 로직 처리)
- **DB**: Oracle, MySQL, PostgreSQL 등

### 1.2 HTTP의 특징

| 특징 | 설명 |
|------|------|
| **1회성 연결** | 요청-응답 후 연결 종료 |
| **상태 저장 안 함** | 서버가 클라이언트 상태를 기억하지 않음 |
| **단방향 통신** | 서버가 일방적으로 클라이언트에 전송 불가 |

상태를 저장하지 않기 때문에 **세션(Session)과 쿠키(Cookie)** 개념이 등장한다.
- **Session**: 서버에 저장
- **Cookie**: 브라우저에 저장

### 1.3 HTTP Status Code

| 코드 | 의미 | 보안 관점 |
|------|------|----------|
| 200 | OK (정상) | - |
| 302 | 주소 이동 | 리다이렉션 확인 필요 |
| 400 | Bad Request (메소드 틀림) | - |
| 404 | Not Found (경로 틀림) | - |
| **500** | Internal Server Error | **개발자가 예외처리 안 한 것 → 공격 포인트!** |

500 에러는 "개발자가 예외처리를 제대로 안 해놨다"는 신호다. SQL Injection 시 이 에러가 뜨면 쿼리가 DB까지 전달되고 있다는 증거다.

---

## 2. 데이터베이스 기초

### 2.1 DB와 Excel 비교

| DB 용어 | Excel 대응 | 설명 |
|---------|-----------|------|
| Database | 통합 문서 | 전체 파일 |
| Table | Sheet | 개별 시트 |
| Column | A, B, C, D | 세로 열 |
| Row | 1, 2, 3, 4 | 가로 행 |

### 2.2 CRUD와 SQL Injection

| 작업 | SQL | 공격 가능? |
|------|-----|-----------|
| Create | INSERT | ❌ |
| **Read** | **SELECT** | ✅ **주요 공격 대상** |
| Update | UPDATE | ❌ |
| Delete | DELETE | ❌ |

**실무 금지 사항:**

INSERT, UPDATE, DELETE에서 공격하면 실제로 DB가 수정된다!

**실제 사고 사례**: 업데이트 쿼리 잘못 때려서 전체 회원의 비밀번호가 '1'로 바뀜. 암호화된 값도 아니라서 어떤 비밀번호로도 로그인 불가.

---

## 3. SELECT문의 동작 원리 (핵심!)

### 3.1 WHERE절의 진짜 의미

```sql
SELECT * FROM friends WHERE address = '서울';
```

**일반적인 오해**: "서울에 있는 걸 골라서 꺼내줘"

**실제 동작 원리**:
1. 첫 번째 줄 가져옴
2. `address` 컬럼 값을 조건에 대입
3. `'서울' = '서울'` → 참이면 **합격**, 거짓이면 **불합격**
4. 다음 줄로 넘어가서 반복

**핵심 이해:**

WHERE절은 **검색 기능이 아니라 필터링 기능**이다!

한 줄씩 가져와서 조건이 **참/거짓**인지 판단하고, 참인 것만 결과에 포함시킨다.

### 3.2 왜 이해가 중요한가?

SQL Injection은 이 **참/거짓 판단 로직**을 조작하는 것이다.

```sql
-- 원래 쿼리
SELECT * FROM members WHERE id='입력값' AND pw='입력값';

-- 공격 시
SELECT * FROM members WHERE id='admin' OR '1'='1' AND pw='아무거나';
```

조건을 **항상 참**으로 만들면 모든 데이터가 "합격"된다.

---

## 4. 논리 연산자 이해

### 4.1 AND와 OR

| 연산자 | 의미 | 결과 조건 |
|--------|------|-----------|
| AND | ~이고 ~도 | **둘 다 참**이어야 참 |
| OR | ~이거나 ~이거나 | **하나라도 참**이면 참 |


### 4.2 연산 순서

**AND가 OR보다 먼저 실행된다!** (곱하기 > 더하기)

```sql
-- 예시: 집이 서울이고 취미가 축구이거나 나이가 27세 이상
WHERE age >= 27 OR (address='서울' AND hobby='축구')
```

복잡한 조건도 결국:
1. AND 먼저 묶기
2. OR로 연결
3. 각 조건이 참/거짓 판단

### 4.3 Short-Circuit Evaluation (단락 평가)

- **OR에서 하나라도 T가 나오면** → 나머지 평가 안 함 (어차피 참)
- **AND에서 하나라도 F가 나오면** → 나머지 평가 안 함 (어차피 거짓)

**공격 활용**:
```sql
-- OR 1=1을 넣으면
WHERE 조건1 AND 조건2 OR 1=1
-- 1=1이 참인 순간, 앞의 조건들은 의미 없음!
```

### 4.4 항상 참/거짓 조건

| 용도 | OR 사용 | AND 사용 |
|------|---------|----------|
| 항상 참 | `OR 1=1` ✅ | `AND 1=1` ❌ (있으나 마나) |
| 항상 거짓 | `OR 1=2` ❌ (있으나 마나) | `AND 1=2` ✅ |

**왜 `AND 1=1`은 의미가 없나?**
```sql
-- AND 1=1은 앞 조건에 영향을 주지 않음
WHERE (조건) AND 1=1  -- 조건이 F면 결과도 F
WHERE (조건)          -- 결과 동일
```

---

## 5. SQL Injection의 본질

### 5.1 정의

> 사용자 입력값이 **쿼리문의 일부로 작동**하게 만드는 공격

```
입력창에 입력 → 백엔드 쿼리에 삽입 → DB에서 실행
```

**핵심**: 내가 입력한 게 "데이터"가 아니라 "명령어"로 해석되게 만드는 것

### 5.2 쿼리문 유추의 중요성

"쿼리문 유추가 반드시 되어야 한다. 유추 없이 공격하면 그냥 치트시트 복붙하는 수준밖에 안 된다."

**유추해야 할 것들**:
1. 검색 방식이 `=`(Equal)인지 `LIKE`인지
2. 컬럼 이름과 순서
3. 따옴표 위치
4. `%` 사용 여부 (LIKE 패턴)

### 5.3 Equal vs LIKE 검색

```sql
-- Equal: 정확히 일치해야 함
WHERE name = '김철수'   -- '김'만 치면 안 나옴

-- LIKE: 패턴 매칭
WHERE name LIKE '%김%'  -- '김'이 포함된 모든 것
```

**LIKE 패턴 공격 시 주의점**:
```sql
-- 원래 쿼리가 이렇다면
WHERE dong LIKE '%검색어%'

-- 공격 시 뒤의 %'를 맞춰줘야 함!
삼성동%' OR 'q%'='q    -- q%와 q가 매칭되어 항상 참
```

---

## 6. 인증 우회 공격

### 6.1 기본 원리

**일반적인 로그인 쿼리**:
```sql
SELECT * FROM members WHERE id='입력값' AND pw='입력값';
```

**공격 목표**: 특정 계정(예: admin)으로 비밀번호 없이 로그인

### 6.2 식별과 인증의 분리

| 개념 | 설명 | 예시 |
|------|------|------|
| **식별** | 내가 누구인지 | ID |
| **인증** | 그게 나 맞는지 | Password |
| **인가** | 권한이 뭔지 | 관리자/일반 |

**보안 원칙:**

실무에서는 **식별과 인증을 분리**해야 한다!

```python
# 나쁜 예 (동시 처리)
result = SELECT * FROM members WHERE id=? AND pw=?

# 좋은 예 (분리 처리)
user = SELECT * FROM members WHERE id=?
if user.pw == hash(입력pw):
    로그인
```

### 6.3 공격 구문 분석

**목표**: `admin` 계정으로 로그인

**입력**:
- ID: `admin' OR '1'='1' --`
- PW: `아무거나`

**완성된 쿼리**:
```sql
SELECT * FROM members
WHERE id='admin' OR '1'='1' --' AND pw='아무거나';
```

**분석**:
1. `id='admin'` → admin이 있으면 참
2. `OR '1'='1'` → 무조건 참
3. `--` → 뒤의 AND pw 조건 주석 처리

### 6.4 OR vs AND 선택

**상황**: admin 계정만 딱 하나 가져오고 싶을 때

```sql
-- OR '1'='1' 사용 시 문제점
WHERE id='admin' OR '1'='1' AND pw='?'
-- 전체 다 나옴 → 누구로 로그인될지 모름!

-- 해결: 뒤를 거짓으로 만들기
WHERE id='admin' OR '1'='2' AND pw='몰라'
-- '1'='2'가 거짓이므로 뒤 조건 무시, admin만 나옴
```

**실전 팁:**

`OR 1=1`로 전체가 나오면 "누구를 로그인 시킬 건데?"라는 문제 발생.
특정 계정만 원하면 **뒤를 거짓으로 만들어서** 해당 조건만 살리기.

---

## 7. 주석 사용

### 7.1 DBMS별 주석

| DBMS | 한 줄 주석 | 여러 줄 주석 |
|------|-----------|-------------|
| Oracle | `--` | `/* */` |
| MySQL | `-- ` (공백 필요) 또는 `#` | `/* */` |
| SQLite | `--` | `/* */` |

### 7.2 주석을 쓰지 않는 이유

"실무에서 주석을 날리면 뒤에서 무슨 일이 벌어질지 모른다."

**문제점**:
1. 복잡한 쿼리에서 뒤가 날아가면 에러
2. 서브쿼리, 함수 안에서 주석 쓰면 깨짐
3. 한 줄 주석은 줄바꿈 있으면 풀림

**실력의 차이**:
- 초보: 주석으로 뒤를 날림
- 고수: **문법을 깔끔하게 맞춰서** 공격

---

## 8. Union SQL Injection

### 8.1 개념

**UNION**: 두 SELECT 결과를 합쳐주는 연산자

```sql
SELECT name, age FROM friends
UNION
SELECT id, pw FROM members;
-- 친구 목록 아래에 회원 정보가 붙음!
```

### 8.2 Union 제약사항 (중요!)

| 제약 | 설명 | 확인 방법 |
|------|------|----------|
| **컬럼 수 일치** | 앞뒤 SELECT의 컬럼 수 동일 | ORDER BY 또는 직접 NULL 넣기 |
| **자료형 일치** | 대응하는 컬럼끼리 자료형 동일 | Oracle만 엄격, MySQL/SQLite는 유연 |

### 8.3 컬럼 수 찾기

**방법 1: ORDER BY** (주석 필요)
```sql
검색어' ORDER BY 1 --   → 정상
검색어' ORDER BY 5 --   → 정상
검색어' ORDER BY 6 --   → 에러! → 컬럼 수는 5개
```

**방법 2: UNION SELECT NULL** (주석 불필요, 권장)
```sql
검색어%' UNION SELECT null,null,null,null,null FROM dual WHERE 'q%'='q
```
- 에러 없이 데이터 나오면 컬럼 수 맞음
- 하나씩 늘려가며 확인

### 8.4 자료형 찾기

```sql
-- null은 자료형 무관
검색어%' UNION SELECT null,null,null,null,null FROM dual WHERE 'q%'='q

-- 하나씩 문자로 바꿔보기
검색어%' UNION SELECT 'a',null,null,null,null FROM dual WHERE 'q%'='q  -- 첫 번째 문자형
검색어%' UNION SELECT 'a','b',null,null,null FROM dual WHERE 'q%'='q  -- 두 번째도 문자형
검색어%' UNION SELECT 'a','b',1,null,null FROM dual WHERE 'q%'='q     -- 세 번째 숫자형
```

### 8.5 공격 순서 (전체 흐름)

```
1. 쿼리문 유추
   └─ 검색 방식 파악 (= vs LIKE)
   └─ 입력 위치 파악

2. 공격 포인트 확인
   └─ ' 입력 시 에러 발생하는지

3. Union 제약사항 확인
   └─ 컬럼 수 확인
   └─ 자료형 확인 (Oracle만)

4. 테이블명 탈취
   └─ 시스템 테이블 조회

5. 컬럼명 탈취
   └─ 컬럼 정보 테이블 조회

6. 데이터 탈취
   └─ 실제 개인정보 추출
```

---

## 9. DBMS별 시스템 테이블

### 9.1 테이블 정보 조회

| DBMS | 테이블 정보 | 비고 |
|------|------------|------|
| Oracle | `user_tables` | 현재 사용자 테이블만 |
| Oracle | `all_tables` | 접근 가능한 모든 테이블 |
| MySQL | `information_schema.tables` | `table_schema=database()` 필터 권장 |
| SQLite | `sqlite_master` | `type='table'` 필터 필요 |

### 9.2 컬럼 정보 조회

| DBMS | 컬럼 정보 | 비고 |
|------|----------|------|
| Oracle | `user_tab_columns` | `table_name` 조건 필요 |
| MySQL | `information_schema.columns` | `table_name` + `table_schema` 조건 |
| SQLite | `sqlite_master.sql` | CREATE문 파싱 필요 |

### 9.3 Oracle 예시

```sql
-- 테이블 목록
SELECT table_name FROM user_tables;

-- 특정 테이블의 컬럼
SELECT column_name FROM user_tab_columns WHERE table_name = 'MEMBERS';

-- 주의: Oracle은 대문자로 저장됨!
```

### 9.4 MySQL 예시

```sql
-- 현재 DB의 테이블만
SELECT table_name FROM information_schema.tables
WHERE table_schema = database();

-- 컬럼 정보
SELECT column_name FROM information_schema.columns
WHERE table_name = 'members' AND table_schema = database();
```

### 9.5 SQLite 예시

```sql
-- 테이블 목록
SELECT name FROM sqlite_master WHERE type = 'table';

-- 컬럼 정보 (CREATE문 확인)
SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'member';
-- 결과: CREATE TABLE member (id, name, password, ...)
```

---

## 10. Error-based SQL Injection

### 10.1 개념

에러 메시지 안에 **공격 쿼리의 결과**가 포함되도록 하는 기법

### 10.2 Oracle 에러 함수

```sql
-- CTXSYS.DRITHSX.SN 함수 활용
검색어%' AND CTXSYS.DRITHSX.SN(user,(공격쿼리))='
```

**에러 메시지 예시**:
```
ORA-20000: Oracle Text 오류:
DRG-11701: [결과값] 키워드 사전이 존재하지 않습니다
           ↑ 여기에 공격 쿼리 결과가 노출됨!
```

---

## 11. LIKE 패턴과 `'q%'='q'` 트릭

### 11.1 왜 `1=1`이 아니라 `'q%'='q'`인가?

**원래 쿼리가 LIKE일 때**:
```sql
WHERE dong LIKE '%삼성동%'
```

**공격 시 뒤의 `%'`를 맞춰야 함**:
```sql
삼성동%' OR 1=1 AND '%'='
-- 결과: WHERE dong LIKE '%삼성동%' OR 1=1 AND '%'='%'
-- '%'='%' 가 되어버림 → 의도와 다름
```

**`'q%'='q'` 사용**:
```sql
삼성동%' UNION SELECT ... WHERE 'q%'='q
-- 결과: WHERE dong LIKE '%삼성동%' UNION SELECT ... WHERE 'q%'='q%'
-- 'q%' LIKE 'q%' → 항상 참!
```

**트릭의 원리:**

`'q%'='q'`에서 뒤에 `%'`가 붙으면 `'q%'='q%'`가 된다.
LIKE 패턴에서 `%`는 "0개 이상의 문자"이므로 `'q%'`는 `'q'`를 포함해서 매칭된다.

---

## 12. Oracle의 특징

### 12.1 대소문자 처리

```sql
-- 소문자로 입력해도 대문자로 저장됨
CREATE TABLE members (...);  -- 실제로는 MEMBERS로 저장

-- 조회 시 대문자 사용 필요
WHERE table_name = 'MEMBERS'  -- ✅
WHERE table_name = 'members'  -- ❌ 결과 없음
```

### 12.2 FROM dual 필수

```sql
-- MySQL/SQLite
SELECT 'a', 'b', 'c';  -- FROM 생략 가능

-- Oracle
SELECT 'a', 'b', 'c' FROM dual;  -- FROM 필수!
```

### 12.3 자료형 엄격함

```sql
-- MySQL/SQLite: 문자↔숫자 자동 변환
SELECT 'text', 123;  -- OK

-- Oracle: 자료형 일치 필수
SELECT 'text', 123;  -- 컬럼끼리 자료형 안 맞으면 에러
```

---

## 13. 실무 조언

### 13.1 도구 의존성 경계

"버프 스위트 없으면 해킹 못 해요?" 이건 "디자이너한테 포토샵 없으면 그림 못 그려요?" 같은 질문이다.

버프 사용법을 아는 사용자가 되지 말고, **원리를 아는 전문가**가 되어야 한다.

**개발자 도구만으로도**:
- Network 탭에서 요청/응답 확인
- 파라미터 구조 파악
- Ajax 요청 분석

### 13.2 보고서의 중요성

"남는 건 보고서밖에 없다. 아무리 뛰어난 해커여도 보고서를 못 쓰면 실력이 없다고 평가받는다."

### 13.3 취약점 진단 vs 모의해킹

| 구분 | 목표 | 접근 |
|------|------|------|
| 취약점 진단 | 취약점 존재 여부 확인 | `' OR 1=1` 되면 취약 판정 |
| 모의해킹 | 실제 데이터 탈취까지 | DB 끝까지 털고, 대응방안 제시 |

---

## 14. 자격증 관련

- **정보처리기사**: 필수. 쌍기사(보안기사 + 정처기) 권장
- **보안기사**: 어렵지만 가치 있음 (운 요소 존재)
- 기사 없으면 경력 산정 시 불리
- 회사 다니면서 공부하기 힘드니 지금 따두기