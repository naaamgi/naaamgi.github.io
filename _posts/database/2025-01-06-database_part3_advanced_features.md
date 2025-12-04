---
title: "고급 데이터베이스 기능"
excerpt: "저장 프로시저, 트리거, 커서, 인덱스 등 고급 데이터베이스 기능을 학습하고 실무에 활용하는 방법을 익힙니다"
categories: ['database']
typora-root-url: ../../
published: true
date: 2025-01-06
tags: [database, stored-procedure, trigger, cursor, index, transaction, mariadb, mysql, 저장프로시저, 트리거, 커서, 인덱스]
---

## 전체 흐름 요약

데이터베이스의 고급 기능은 단순한 데이터 조회와 조작을 넘어, 복잡한 비즈니스 로직을 데이터베이스 내부에서 처리하고 성능을 최적화하는 강력한 도구입니다.

본 문서에서는 저장 프로시저 (Stored Procedure), 트리거 (Trigger), 커서 (Cursor), 인덱스 (Index) 등의 고급 기능을 학습합니다. 이러한 기능들은 실무에서 데이터베이스 성능을 극대화하고, 데이터 무결성을 보장하며, 반복적인 작업을 자동화하는 데 필수적입니다.

먼저 저장 프로시저를 통해 복잡한 SQL 로직을 모듈화하는 방법을 학습합니다. 이어서 트리거로 특정 이벤트 발생 시 자동으로 실행되는 작업을 정의하고, 커서를 사용하여 결과 집합을 한 행씩 처리하는 기법을 익힙니다. 마지막으로 인덱스를 활용하여 대용량 데이터에서 검색 성능을 극대화하는 방법을 학습합니다.

각 개념마다 실제 실행 가능한 예제를 제공하여, 문서만으로도 완전히 따라하며 학습할 수 있도록 구성하였습니다.

---

## 1. 저장 프로시저 (Stored Procedure)

### 1.1 저장 프로시저란?

**저장 프로시저 (Stored Procedure)**는 미리 작성된 SQL 문장들의 집합을 데이터베이스에 저장하고, 필요할 때 호출하여 실행하는 프로그램입니다.

**저장 프로시저의 장점:**
- **성능 향상**: 컴파일된 상태로 저장되어 실행 속도가 빠름
- **네트워크 트래픽 감소**: 여러 SQL 문을 한 번에 전송
- **재사용성**: 한 번 작성하면 여러 곳에서 호출 가능
- **보안 강화**: 직접 테이블 접근 대신 프로시저를 통해 접근
- **유지보수 용이**: 비즈니스 로직을 한 곳에서 관리

**저장 프로시저의 단점:**
- 디버깅이 어려움
- DBMS에 종속적 (이식성 낮음)
- 복잡한 로직은 애플리케이션에서 처리하는 것이 더 적합할 수 있음

### 1.2 저장 프로시저 생성

#### 기본 문법

```sql
DELIMITER $$

CREATE PROCEDURE 프로시저명 (
    [IN|OUT|INOUT] 매개변수명 데이터타입,
    ...
)
BEGIN
    -- SQL 문장들
END $$

DELIMITER ;
```

**매개변수 종류:**
- `IN`: 입력 매개변수 (기본값)
- `OUT`: 출력 매개변수
- `INOUT`: 입출력 매개변수

**DELIMITER 설명:**
- 기본 구분자 `;`를 임시로 `$$`로 변경
- 프로시저 내부의 세미콜론과 구분하기 위함
- 프로시저 생성 후 다시 `;`로 복원

#### 매개변수가 없는 프로시저

```sql
DELIMITER $$

CREATE PROCEDURE get_all_employees()
BEGIN
    SELECT * FROM employee;
END $$

DELIMITER ;

-- 프로시저 호출
CALL get_all_employees();
```

#### IN 매개변수 사용

```sql
DELIMITER $$

CREATE PROCEDURE get_employee_by_dept(IN dept_name VARCHAR(50))
BEGIN
    SELECT * FROM employee WHERE department = dept_name;
END $$

DELIMITER ;

-- 프로시저 호출
CALL get_employee_by_dept('Sales');
```

#### OUT 매개변수 사용

```sql
DELIMITER $$

CREATE PROCEDURE get_employee_count(
    IN dept_name VARCHAR(50),
    OUT emp_count INT
)
BEGIN
    SELECT COUNT(*) INTO emp_count
    FROM employee
    WHERE department = dept_name;
END $$

DELIMITER ;

-- 프로시저 호출 및 결과 확인
CALL get_employee_count('Sales', @count);
SELECT @count AS employee_count;
```

#### INOUT 매개변수 사용

```sql
DELIMITER $$

CREATE PROCEDURE increase_salary(INOUT salary DECIMAL(10,2))
BEGIN
    SET salary = salary * 1.1;  -- 10% 인상
END $$

DELIMITER ;

-- 프로시저 호출
SET @my_salary = 3000000;
CALL increase_salary(@my_salary);
SELECT @my_salary;  -- 3300000
```

### 1.3 변수 사용

프로시저 내부에서 변수를 선언하고 사용할 수 있습니다.

```sql
DELIMITER $$

CREATE PROCEDURE calculate_bonus()
BEGIN
    DECLARE total_salary DECIMAL(12,2);
    DECLARE bonus_rate DECIMAL(4,2);
    DECLARE total_bonus DECIMAL(12,2);

    -- 변수 초기화
    SET bonus_rate = 0.1;

    -- 전체 급여 합계 조회
    SELECT SUM(salary) INTO total_salary FROM employee;

    -- 보너스 계산
    SET total_bonus = total_salary * bonus_rate;

    -- 결과 출력
    SELECT total_salary, bonus_rate, total_bonus;
END $$

DELIMITER ;

CALL calculate_bonus();
```

### 1.4 제어문

#### IF 문

```sql
DELIMITER $$

CREATE PROCEDURE get_salary_grade(
    IN emp_salary DECIMAL(10,2),
    OUT grade VARCHAR(10)
)
BEGIN
    IF emp_salary >= 5000000 THEN
        SET grade = 'High';
    ELSEIF emp_salary >= 3500000 THEN
        SET grade = 'Medium';
    ELSE
        SET grade = 'Low';
    END IF;
END $$

DELIMITER ;

-- 호출
CALL get_salary_grade(4000000, @grade);
SELECT @grade;
```

#### CASE 문

```sql
DELIMITER $$

CREATE PROCEDURE get_department_size(
    IN dept_name VARCHAR(50),
    OUT size_category VARCHAR(20)
)
BEGIN
    DECLARE emp_count INT;

    SELECT COUNT(*) INTO emp_count
    FROM employee
    WHERE department = dept_name;

    CASE
        WHEN emp_count >= 10 THEN
            SET size_category = 'Large';
        WHEN emp_count >= 5 THEN
            SET size_category = 'Medium';
        ELSE
            SET size_category = 'Small';
    END CASE;
END $$

DELIMITER ;
```

#### WHILE 반복문

```sql
DELIMITER $$

CREATE PROCEDURE insert_test_data()
BEGIN
    DECLARE i INT DEFAULT 1;

    WHILE i <= 10 DO
        INSERT INTO test_table (id, value)
        VALUES (i, CONCAT('Test', i));

        SET i = i + 1;
    END WHILE;
END $$

DELIMITER ;
```

#### LOOP와 LEAVE

```sql
DELIMITER $$

CREATE PROCEDURE sum_until(IN max_num INT, OUT total INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    SET total = 0;

    sum_loop: LOOP
        SET total = total + i;
        SET i = i + 1;

        IF i > max_num THEN
            LEAVE sum_loop;  -- 루프 탈출
        END IF;
    END LOOP;
END $$

DELIMITER ;

-- 1부터 100까지 합
CALL sum_until(100, @result);
SELECT @result;  -- 5050
```

### 1.5 저장 프로시저 관리

```sql
-- 프로시저 목록 조회
SHOW PROCEDURE STATUS WHERE db = 'database_name';

-- 프로시저 정의 확인
SHOW CREATE PROCEDURE 프로시저명;

-- 프로시저 삭제
DROP PROCEDURE IF EXISTS 프로시저명;

-- 프로시저 수정 (삭제 후 재생성)
DROP PROCEDURE IF EXISTS get_all_employees;

DELIMITER $$
CREATE PROCEDURE get_all_employees()
BEGIN
    SELECT emp_id, name, department FROM employee;
END $$
DELIMITER ;
```

### 1.6 실전 예제

#### 급여 인상 프로시저

```sql
DELIMITER $$

CREATE PROCEDURE raise_salary_by_dept(
    IN dept_name VARCHAR(50),
    IN increase_rate DECIMAL(4,2),
    OUT affected_rows INT
)
BEGIN
    -- 급여 인상
    UPDATE employee
    SET salary = salary * (1 + increase_rate)
    WHERE department = dept_name;

    -- 영향받은 행 수 반환
    SET affected_rows = ROW_COUNT();
END $$

DELIMITER ;

-- 호출: Sales 부서 급여 10% 인상
CALL raise_salary_by_dept('Sales', 0.10, @count);
SELECT @count AS updated_employees;
```

#### 직원 통계 프로시저

```sql
DELIMITER $$

CREATE PROCEDURE get_employee_statistics(
    IN dept_name VARCHAR(50)
)
BEGIN
    SELECT
        department,
        COUNT(*) AS total_employees,
        AVG(salary) AS avg_salary,
        MAX(salary) AS max_salary,
        MIN(salary) AS min_salary,
        SUM(salary) AS total_salary
    FROM employee
    WHERE department = dept_name OR dept_name IS NULL
    GROUP BY department;
END $$

DELIMITER ;

-- 특정 부서 통계
CALL get_employee_statistics('Sales');

-- 전체 부서 통계
CALL get_employee_statistics(NULL);
```

---

## 2. 트리거 (Trigger)

### 2.1 트리거란?

**트리거 (Trigger)**는 테이블에 특정 이벤트(INSERT, UPDATE, DELETE)가 발생했을 때 자동으로 실행되는 프로시저입니다.

**트리거의 용도:**
- 데이터 무결성 보장
- 자동 로그 기록
- 복잡한 비즈니스 규칙 적용
- 연쇄적인 데이터 변경
- 감사 추적 (Audit Trail)

**트리거 실행 시점:**
- `BEFORE`: 이벤트 발생 전
- `AFTER`: 이벤트 발생 후

**트리거 이벤트:**
- `INSERT`: 데이터 삽입 시
- `UPDATE`: 데이터 수정 시
- `DELETE`: 데이터 삭제 시

### 2.2 트리거 생성

#### 기본 문법

```sql
DELIMITER $$

CREATE TRIGGER 트리거명
{BEFORE | AFTER} {INSERT | UPDATE | DELETE}
ON 테이블명
FOR EACH ROW
BEGIN
    -- SQL 문장들
    -- NEW.컬럼명: 새로운 값 (INSERT, UPDATE)
    -- OLD.컬럼명: 이전 값 (UPDATE, DELETE)
END $$

DELIMITER ;
```

#### BEFORE INSERT 트리거

```sql
-- 직원 테이블
CREATE TABLE employee (
    emp_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    salary DECIMAL(10,2),
    created_at DATETIME
);

-- 이메일 자동 소문자 변환 트리거
DELIMITER $$

CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employee
FOR EACH ROW
BEGIN
    -- 이메일을 소문자로 변환
    SET NEW.email = LOWER(NEW.email);

    -- 생성 시간 자동 설정
    SET NEW.created_at = NOW();
END $$

DELIMITER ;

-- 테스트
INSERT INTO employee (name, email, salary)
VALUES ('Kim', 'KIM@COMPANY.COM', 3500000);

SELECT * FROM employee;  -- 이메일: kim@company.com
```

#### AFTER INSERT 트리거 - 로그 기록

```sql
-- 로그 테이블
CREATE TABLE employee_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(10),
    emp_id INT,
    emp_name VARCHAR(50),
    action_time DATETIME
);

-- 직원 추가 시 로그 기록
DELIMITER $$

CREATE TRIGGER after_employee_insert
AFTER INSERT ON employee
FOR EACH ROW
BEGIN
    INSERT INTO employee_log (action, emp_id, emp_name, action_time)
    VALUES ('INSERT', NEW.emp_id, NEW.name, NOW());
END $$

DELIMITER ;

-- 테스트
INSERT INTO employee (name, email, salary)
VALUES ('Lee', 'lee@company.com', 4000000);

SELECT * FROM employee_log;
```

#### BEFORE UPDATE 트리거 - 변경 제한

```sql
-- 급여 감소 방지 트리거
DELIMITER $$

CREATE TRIGGER before_salary_update
BEFORE UPDATE ON employee
FOR EACH ROW
BEGIN
    IF NEW.salary < OLD.salary THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '급여는 감소할 수 없습니다';
    END IF;
END $$

DELIMITER ;

-- 테스트
-- 급여 인상: 성공
UPDATE employee SET salary = 3800000 WHERE emp_id = 1;

-- 급여 감소: 오류 발생
-- UPDATE employee SET salary = 3000000 WHERE emp_id = 1;
```

**SIGNAL 설명:**
- SQL 에러를 발생시키는 명령어
- `SQLSTATE '45000'`: 사용자 정의 예외
- `MESSAGE_TEXT`: 에러 메시지

#### AFTER UPDATE 트리거 - 변경 이력 기록

```sql
-- 급여 변경 이력 테이블
CREATE TABLE salary_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id INT,
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    changed_at DATETIME
);

-- 급여 변경 이력 기록 트리거
DELIMITER $$

CREATE TRIGGER after_salary_update
AFTER UPDATE ON employee
FOR EACH ROW
BEGIN
    IF NEW.salary != OLD.salary THEN
        INSERT INTO salary_history (emp_id, old_salary, new_salary, changed_at)
        VALUES (NEW.emp_id, OLD.salary, NEW.salary, NOW());
    END IF;
END $$

DELIMITER ;

-- 테스트
UPDATE employee SET salary = 4200000 WHERE emp_id = 2;

SELECT * FROM salary_history;
```

#### AFTER DELETE 트리거 - 삭제 기록

```sql
-- 삭제된 직원 백업 테이블
CREATE TABLE deleted_employee (
    emp_id INT,
    name VARCHAR(50),
    email VARCHAR(100),
    salary DECIMAL(10,2),
    deleted_at DATETIME
);

-- 직원 삭제 시 백업 트리거
DELIMITER $$

CREATE TRIGGER after_employee_delete
AFTER DELETE ON employee
FOR EACH ROW
BEGIN
    INSERT INTO deleted_employee (emp_id, name, email, salary, deleted_at)
    VALUES (OLD.emp_id, OLD.name, OLD.email, OLD.salary, NOW());
END $$

DELIMITER ;

-- 테스트
DELETE FROM employee WHERE emp_id = 5;

SELECT * FROM deleted_employee;
```

### 2.3 트리거 관리

```sql
-- 트리거 목록 조회
SHOW TRIGGERS;

-- 특정 데이터베이스의 트리거 조회
SHOW TRIGGERS FROM database_name;

-- 트리거 정의 확인
SHOW CREATE TRIGGER 트리거명;

-- 트리거 삭제
DROP TRIGGER IF EXISTS 트리거명;
```

### 2.4 트리거 실전 예제

#### 재고 관리 트리거

```sql
-- 상품 테이블
CREATE TABLE product (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(50),
    stock INT
);

-- 주문 테이블
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    quantity INT
);

-- 주문 시 재고 차감 트리거
DELIMITER $$

CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    DECLARE current_stock INT;

    -- 현재 재고 확인
    SELECT stock INTO current_stock
    FROM product
    WHERE product_id = NEW.product_id;

    -- 재고 부족 시 오류
    IF current_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '재고가 부족합니다';
    END IF;

    -- 재고 차감
    UPDATE product
    SET stock = stock - NEW.quantity
    WHERE product_id = NEW.product_id;
END $$

DELIMITER ;

-- 테스트
INSERT INTO product VALUES (1, 'Laptop', 10);

-- 주문: 성공 (재고 10 -> 7)
INSERT INTO orders (product_id, quantity) VALUES (1, 3);

-- 주문: 실패 (재고 부족)
-- INSERT INTO orders (product_id, quantity) VALUES (1, 20);
```

---

## 3. 커서 (Cursor)

### 3.1 커서란?

**커서 (Cursor)**는 SELECT 문의 결과 집합을 한 행씩 순차적으로 처리할 수 있게 해주는 메커니즘입니다.

**커서의 특징:**
- 결과를 한 행씩 읽어서 처리
- 반복문과 함께 사용
- 복잡한 행 단위 처리에 유용

**커서 사용 시 주의사항:**
- 성능이 느림 (가능하면 집합 연산 사용 권장)
- 많은 행을 처리할 때 메모리 사용량 증가
- 간단한 작업은 일반 SQL로 처리하는 것이 효율적

### 3.2 커서 사용 단계

1. **선언**: `DECLARE cursor_name CURSOR FOR SELECT ...`
2. **열기**: `OPEN cursor_name`
3. **데이터 가져오기**: `FETCH cursor_name INTO 변수`
4. **닫기**: `CLOSE cursor_name`

### 3.3 커서 기본 예제

```sql
DELIMITER $$

CREATE PROCEDURE process_all_employees()
BEGIN
    -- 변수 선언
    DECLARE done INT DEFAULT 0;
    DECLARE emp_name VARCHAR(50);
    DECLARE emp_salary DECIMAL(10,2);

    -- 커서 선언
    DECLARE emp_cursor CURSOR FOR
        SELECT name, salary FROM employee;

    -- 커서 끝 감지 핸들러
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- 커서 열기
    OPEN emp_cursor;

    -- 반복문
    read_loop: LOOP
        -- 한 행 가져오기
        FETCH emp_cursor INTO emp_name, emp_salary;

        -- 커서 끝이면 종료
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 처리 로직
        SELECT CONCAT('Employee: ', emp_name, ', Salary: ', emp_salary);
    END LOOP;

    -- 커서 닫기
    CLOSE emp_cursor;
END $$

DELIMITER ;

CALL process_all_employees();
```

**핸들러 (Handler) 설명:**
- `DECLARE CONTINUE HANDLER FOR NOT FOUND`: 더 이상 데이터가 없을 때 실행
- `SET done = 1`: 플래그 변수를 1로 설정하여 루프 종료 신호

### 3.4 커서 실전 예제

#### 급여 등급 업데이트

```sql
-- 직원 테이블에 급여 등급 컬럼 추가
ALTER TABLE employee ADD COLUMN salary_grade VARCHAR(10);

DELIMITER $$

CREATE PROCEDURE update_salary_grades()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE emp_id_var INT;
    DECLARE emp_salary DECIMAL(10,2);
    DECLARE grade VARCHAR(10);

    -- 커서 선언
    DECLARE emp_cursor CURSOR FOR
        SELECT emp_id, salary FROM employee;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN emp_cursor;

    grade_loop: LOOP
        FETCH emp_cursor INTO emp_id_var, emp_salary;

        IF done THEN
            LEAVE grade_loop;
        END IF;

        -- 급여에 따라 등급 결정
        IF emp_salary >= 5000000 THEN
            SET grade = 'A';
        ELSEIF emp_salary >= 4000000 THEN
            SET grade = 'B';
        ELSEIF emp_salary >= 3000000 THEN
            SET grade = 'C';
        ELSE
            SET grade = 'D';
        END IF;

        -- 등급 업데이트
        UPDATE employee
        SET salary_grade = grade
        WHERE emp_id = emp_id_var;
    END LOOP;

    CLOSE emp_cursor;

    SELECT '급여 등급 업데이트 완료' AS message;
END $$

DELIMITER ;

CALL update_salary_grades();
SELECT name, salary, salary_grade FROM employee;
```

#### 부서별 보너스 계산

```sql
-- 보너스 테이블
CREATE TABLE bonus (
    emp_id INT,
    bonus_amount DECIMAL(10,2),
    calculated_at DATETIME
);

DELIMITER $$

CREATE PROCEDURE calculate_department_bonus(IN dept_name VARCHAR(50))
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE emp_id_var INT;
    DECLARE emp_salary DECIMAL(10,2);
    DECLARE bonus DECIMAL(10,2);

    DECLARE emp_cursor CURSOR FOR
        SELECT emp_id, salary
        FROM employee
        WHERE department = dept_name;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN emp_cursor;

    bonus_loop: LOOP
        FETCH emp_cursor INTO emp_id_var, emp_salary;

        IF done THEN
            LEAVE bonus_loop;
        END IF;

        -- 보너스 계산 (급여의 10%)
        SET bonus = emp_salary * 0.1;

        -- 보너스 기록
        INSERT INTO bonus (emp_id, bonus_amount, calculated_at)
        VALUES (emp_id_var, bonus, NOW());
    END LOOP;

    CLOSE emp_cursor;
END $$

DELIMITER ;

-- Sales 부서 보너스 계산
CALL calculate_department_bonus('Sales');

-- 결과 확인
SELECT e.name, e.salary, b.bonus_amount
FROM employee e
INNER JOIN bonus b ON e.emp_id = b.emp_id;
```

---

## 4. 인덱스 (Index)

### 4.1 인덱스란?

**인덱스 (Index)**는 데이터베이스 테이블의 검색 속도를 향상시키기 위한 자료구조입니다. 책의 색인과 같은 역할을 합니다.

**인덱스의 장점:**
- 검색 속도 대폭 향상
- WHERE, ORDER BY, GROUP BY 절 성능 개선
- JOIN 성능 향상

**인덱스의 단점:**
- 추가 저장 공간 필요 (테이블 크기의 10-15%)
- INSERT, UPDATE, DELETE 성능 저하
- 너무 많은 인덱스는 오히려 성능 저하

**인덱스 사용 시기:**
- WHERE 절에 자주 사용되는 컬럼
- JOIN 조건으로 사용되는 컬럼
- ORDER BY에 자주 사용되는 컬럼
- 고유한 값이 많은 컬럼 (Cardinality가 높은 컬럼)

**인덱스 사용 지양:**
- 데이터가 자주 변경되는 컬럼
- 고유한 값이 적은 컬럼 (예: 성별)
- 테이블 크기가 작은 경우

### 4.2 인덱스 종류

| 종류 | 설명 | 특징 |
|------|------|------|
| PRIMARY KEY | 기본키 인덱스 | 자동 생성, 중복 불가, NULL 불가 |
| UNIQUE | 고유 인덱스 | 중복 불가, NULL 허용 |
| INDEX (일반) | 일반 인덱스 | 중복 허용, 검색 속도 향상 |
| FULLTEXT | 전문 검색 인덱스 | 텍스트 검색 최적화 |

### 4.3 인덱스 생성

#### 일반 인덱스 생성

```sql
-- 단일 컬럼 인덱스
CREATE INDEX idx_employee_name ON employee(name);

-- 다중 컬럼 인덱스 (복합 인덱스)
CREATE INDEX idx_dept_salary ON employee(department, salary);

-- 테이블 생성 시 인덱스 정의
CREATE TABLE employee (
    emp_id INT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    INDEX idx_name (name),
    INDEX idx_dept (department)
);
```

#### UNIQUE 인덱스 생성

```sql
-- UNIQUE 인덱스 생성
CREATE UNIQUE INDEX idx_employee_email ON employee(email);

-- 또는 ALTER TABLE 사용
ALTER TABLE employee ADD UNIQUE INDEX idx_email (email);
```

#### FULLTEXT 인덱스 생성

```sql
-- FULLTEXT 인덱스 생성 (MyISAM 또는 InnoDB)
CREATE TABLE articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200),
    content TEXT,
    FULLTEXT INDEX idx_fulltext (title, content)
);

-- 전문 검색
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('데이터베이스');

-- 불리언 모드 검색
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('+MySQL -Oracle' IN BOOLEAN MODE);
```

### 4.4 인덱스 관리

```sql
-- 테이블의 인덱스 확인
SHOW INDEX FROM employee;

-- 인덱스 삭제
DROP INDEX idx_employee_name ON employee;

-- 또는 ALTER TABLE 사용
ALTER TABLE employee DROP INDEX idx_employee_name;

-- 기본키 삭제 (주의!)
ALTER TABLE employee DROP PRIMARY KEY;
```

### 4.5 인덱스 성능 비교

#### 인덱스 없는 경우

```sql
-- 테스트 테이블 생성 (대용량 데이터)
CREATE TABLE test_no_index (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    email VARCHAR(100),
    age INT
);

-- 100만 행 삽입 (실제로는 프로시저나 외부 스크립트 사용)
-- 생략...

-- 인덱스 없이 검색
SELECT * FROM test_no_index WHERE name = 'Kim';
-- 실행 시간: 약 1.2초 (예시)
```

#### 인덱스 있는 경우

```sql
-- 인덱스 생성
CREATE INDEX idx_test_name ON test_no_index(name);

-- 인덱스를 사용한 검색
SELECT * FROM test_no_index WHERE name = 'Kim';
-- 실행 시간: 약 0.01초 (예시)
```

### 4.6 실행 계획 분석 (EXPLAIN)

인덱스가 실제로 사용되는지 확인하려면 `EXPLAIN` 명령어를 사용합니다.

```sql
-- 실행 계획 확인
EXPLAIN SELECT * FROM employee WHERE name = 'Kim';
```

**EXPLAIN 결과 주요 컬럼:**

| 컬럼 | 설명 |
|------|------|
| id | SELECT 식별자 |
| select_type | SELECT 유형 (SIMPLE, SUBQUERY 등) |
| table | 참조 테이블 |
| type | 조인 타입 (ALL, index, range, ref, eq_ref, const) |
| possible_keys | 사용 가능한 인덱스 |
| key | 실제 사용된 인덱스 |
| rows | 검사할 행 수 (적을수록 좋음) |
| Extra | 추가 정보 (Using index, Using filesort 등) |

**type 값 (성능 순서):**
1. `const`: 기본키/유니크 인덱스로 단일 행 검색 (최고 성능)
2. `eq_ref`: 조인 시 기본키/유니크 인덱스 사용
3. `ref`: 인덱스 사용 (여러 행 반환)
4. `range`: 인덱스 범위 검색
5. `index`: 인덱스 풀 스캔
6. `ALL`: 테이블 풀 스캔 (최악 성능)

**예제:**

```sql
-- 인덱스 없음: type = ALL
EXPLAIN SELECT * FROM employee WHERE salary > 3000000;

-- 인덱스 생성
CREATE INDEX idx_salary ON employee(salary);

-- 인덱스 있음: type = range
EXPLAIN SELECT * FROM employee WHERE salary > 3000000;
```

### 4.7 복합 인덱스 (Composite Index)

여러 컬럼을 하나의 인덱스로 묶는 것입니다.

```sql
-- 복합 인덱스 생성
CREATE INDEX idx_dept_salary ON employee(department, salary);

-- 효과적인 사용 (왼쪽 컬럼부터 사용)
SELECT * FROM employee WHERE department = 'Sales' AND salary > 3000000;  -- 인덱스 사용 O
SELECT * FROM employee WHERE department = 'Sales';  -- 인덱스 사용 O

-- 비효율적인 사용
SELECT * FROM employee WHERE salary > 3000000;  -- 인덱스 사용 X (왼쪽 컬럼 생략)
```

**복합 인덱스 사용 규칙:**
- **왼쪽 우선 규칙**: 인덱스의 왼쪽 컬럼부터 사용해야 인덱스가 효과적
- `(A, B, C)` 인덱스는 `(A)`, `(A, B)`, `(A, B, C)` 조건에서만 효과적
- `(B)`, `(C)`, `(B, C)` 조건에서는 인덱스 사용 불가

### 4.8 인덱스 최적화 팁

```sql
-- 1. LIKE 검색 시 앞부분 와일드카드 피하기
-- 비효율적 (인덱스 사용 불가)
SELECT * FROM employee WHERE name LIKE '%Kim';

-- 효율적 (인덱스 사용 가능)
SELECT * FROM employee WHERE name LIKE 'Kim%';

-- 2. 함수 사용 시 인덱스 무효화
-- 비효율적 (인덱스 사용 불가)
SELECT * FROM employee WHERE YEAR(hire_date) = 2020;

-- 효율적 (인덱스 사용 가능)
SELECT * FROM employee WHERE hire_date BETWEEN '2020-01-01' AND '2020-12-31';

-- 3. OR 대신 UNION 사용 고려
-- 비효율적 (인덱스 사용 제한적)
SELECT * FROM employee WHERE department = 'Sales' OR salary > 5000000;

-- 효율적 (각각 인덱스 사용)
SELECT * FROM employee WHERE department = 'Sales'
UNION
SELECT * FROM employee WHERE salary > 5000000;

-- 4. 인덱스 컬럼에 연산 피하기
-- 비효율적 (인덱스 사용 불가)
SELECT * FROM employee WHERE salary * 12 > 50000000;

-- 효율적 (인덱스 사용 가능)
SELECT * FROM employee WHERE salary > 50000000 / 12;
```

---

## 5. 트랜잭션 (Transaction)

### 5.1 트랜잭션이란?

**트랜잭션 (Transaction)**은 데이터베이스의 상태를 변화시키는 하나의 논리적 작업 단위입니다.

**트랜잭션의 ACID 특성:**

| 특성 | 영문 | 설명 |
|------|------|------|
| 원자성 | Atomicity | 전부 실행되거나 전혀 실행되지 않음 (All or Nothing) |
| 일관성 | Consistency | 트랜잭션 전후 데이터베이스가 일관된 상태 유지 |
| 격리성 | Isolation | 여러 트랜잭션이 동시 실행되어도 서로 영향 없음 |
| 지속성 | Durability | 완료된 트랜잭션의 결과는 영구적으로 반영 |

### 5.2 트랜잭션 제어

```sql
-- 트랜잭션 시작
START TRANSACTION;
-- 또는
BEGIN;

-- 작업 수행
UPDATE account SET balance = balance - 100000 WHERE account_id = 'A';
UPDATE account SET balance = balance + 100000 WHERE account_id = 'B';

-- 커밋 (영구 반영)
COMMIT;

-- 또는 롤백 (취소)
-- ROLLBACK;
```

### 5.3 자동 커밋 설정

```sql
-- 자동 커밋 상태 확인
SELECT @@autocommit;  -- 1: 활성화, 0: 비활성화

-- 자동 커밋 비활성화
SET autocommit = 0;

-- 자동 커밋 활성화
SET autocommit = 1;
```

### 5.4 트랜잭션 실전 예제

#### 계좌 이체

```sql
-- 계좌 테이블
CREATE TABLE account (
    account_id VARCHAR(10) PRIMARY KEY,
    owner VARCHAR(50),
    balance DECIMAL(12,2)
);

INSERT INTO account VALUES
('A001', 'Kim', 1000000),
('A002', 'Lee', 500000);

-- 트랜잭션: A001에서 A002로 10만원 이체
START TRANSACTION;

-- 출금
UPDATE account SET balance = balance - 100000 WHERE account_id = 'A001';

-- 입금
UPDATE account SET balance = balance + 100000 WHERE account_id = 'A002';

-- 잔액 확인
SELECT * FROM account;

-- 커밋
COMMIT;
```

#### 에러 처리와 롤백

```sql
START TRANSACTION;

-- 출금
UPDATE account SET balance = balance - 100000 WHERE account_id = 'A001';

-- 잔액 확인
SELECT balance INTO @balance FROM account WHERE account_id = 'A001';

-- 잔액 부족 시 롤백
IF @balance < 0 THEN
    ROLLBACK;
    SELECT '잔액 부족으로 이체 취소' AS message;
ELSE
    -- 입금
    UPDATE account SET balance = balance + 100000 WHERE account_id = 'A002';
    COMMIT;
    SELECT '이체 완료' AS message;
END IF;
```

### 5.5 SAVEPOINT - 저장점

트랜잭션 중간 지점을 저장하여 부분 롤백할 수 있습니다.

```sql
START TRANSACTION;

UPDATE account SET balance = balance - 50000 WHERE account_id = 'A001';
SAVEPOINT sp1;

UPDATE account SET balance = balance - 30000 WHERE account_id = 'A001';
SAVEPOINT sp2;

UPDATE account SET balance = balance - 20000 WHERE account_id = 'A001';

-- sp2로 롤백 (마지막 20000 출금만 취소)
ROLLBACK TO sp2;

-- 또는 sp1로 롤백 (30000 + 20000 출금 취소)
-- ROLLBACK TO sp1;

COMMIT;
```

### 5.6 격리 수준 (Isolation Level)

동시에 실행되는 트랜잭션 간의 격리 정도를 설정합니다.

| 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
|-----------|------------|---------------------|--------------|
| READ UNCOMMITTED | 발생 | 발생 | 발생 |
| READ COMMITTED | 방지 | 발생 | 발생 |
| REPEATABLE READ | 방지 | 방지 | 발생 |
| SERIALIZABLE | 방지 | 방지 | 방지 |

**격리 수준 설정:**
```sql
-- 현재 세션 격리 수준 설정
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 전역 격리 수준 설정
SET GLOBAL TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- 격리 수준 확인
SELECT @@transaction_isolation;
```

**MariaDB/MySQL 기본 격리 수준:** REPEATABLE READ

---

## 주요 개념 요약표

| 구분 | 주요 개념 | 설명 |
|------|----------|------|
| **저장 프로시저** | Stored Procedure | SQL 문장 집합을 저장하고 호출 |
| | IN | 입력 매개변수 |
| | OUT | 출력 매개변수 |
| | INOUT | 입출력 매개변수 |
| | IF, CASE | 조건문 |
| | WHILE, LOOP | 반복문 |
| **트리거** | Trigger | 특정 이벤트 발생 시 자동 실행 |
| | BEFORE | 이벤트 발생 전 실행 |
| | AFTER | 이벤트 발생 후 실행 |
| | NEW | 새로운 값 참조 |
| | OLD | 이전 값 참조 |
| | SIGNAL | 에러 발생 |
| **커서** | Cursor | 결과 집합을 한 행씩 처리 |
| | DECLARE CURSOR | 커서 선언 |
| | OPEN | 커서 열기 |
| | FETCH | 데이터 가져오기 |
| | CLOSE | 커서 닫기 |
| | HANDLER | 예외 처리 |
| **인덱스** | Index | 검색 속도 향상 자료구조 |
| | PRIMARY KEY | 기본키 인덱스 |
| | UNIQUE | 고유 인덱스 |
| | INDEX | 일반 인덱스 |
| | FULLTEXT | 전문 검색 인덱스 |
| | Composite Index | 복합 인덱스 (여러 컬럼) |
| | EXPLAIN | 실행 계획 분석 |
| **트랜잭션** | Transaction | 논리적 작업 단위 |
| | ACID | Atomicity, Consistency, Isolation, Durability |
| | COMMIT | 영구 반영 |
| | ROLLBACK | 취소 |
| | SAVEPOINT | 저장점 |
| | Isolation Level | 격리 수준 (READ UNCOMMITTED ~ SERIALIZABLE) |

---

## 마무리

본 문서에서는 데이터베이스의 고급 기능인 저장 프로시저, 트리거, 커서, 인덱스, 트랜잭션을 학습하였습니다.

**핵심 내용 정리:**

1. **저장 프로시저 (Stored Procedure)**: 복잡한 SQL 로직을 모듈화하여 재사용성과 성능을 향상시킵니다. 매개변수(IN, OUT, INOUT)와 제어문(IF, WHILE, LOOP)을 활용하여 다양한 비즈니스 로직을 구현할 수 있습니다.

2. **트리거 (Trigger)**: 특정 이벤트(INSERT, UPDATE, DELETE) 발생 시 자동으로 실행되어 데이터 무결성을 보장하고 자동 로그 기록 등의 작업을 수행합니다. BEFORE와 AFTER 시점을 선택하여 적절한 시기에 실행할 수 있습니다.

3. **커서 (Cursor)**: 결과 집합을 한 행씩 순차 처리하여 복잡한 행 단위 작업을 수행합니다. 성능이 느리므로 가능하면 집합 연산을 사용하는 것이 좋지만, 복잡한 로직에서는 유용합니다.

4. **인덱스 (Index)**: 검색 속도를 대폭 향상시키는 자료구조입니다. WHERE, JOIN, ORDER BY 절의 성능을 개선하지만, INSERT/UPDATE/DELETE 성능은 저하될 수 있으므로 적절히 사용해야 합니다. EXPLAIN으로 실행 계획을 분석하여 인덱스 사용 여부를 확인할 수 있습니다.

5. **트랜잭션 (Transaction)**: 데이터베이스 작업의 논리적 단위로, ACID 특성을 보장합니다. COMMIT으로 영구 반영하거나 ROLLBACK으로 취소할 수 있으며, SAVEPOINT로 부분 롤백도 가능합니다.

**실무 활용 팁:**

- **저장 프로시저**: 복잡한 비즈니스 로직, 반복 작업, 배치 작업에 활용
- **트리거**: 감사 로그, 데이터 검증, 연쇄 업데이트에 활용 (과도한 사용은 디버깅 어려움)
- **커서**: 행 단위 복잡한 처리에만 사용, 가능하면 집합 연산 우선
- **인덱스**: WHERE, JOIN에 자주 사용되는 컬럼에 생성, EXPLAIN으로 검증
- **트랜잭션**: 금융 거래, 재고 관리 등 일관성이 중요한 작업에 필수

**성능 최적화 체크리스트:**

- [ ] 자주 검색되는 컬럼에 인덱스 생성
- [ ] 복합 인덱스는 왼쪽 우선 규칙 고려
- [ ] 인덱스 컬럼에 함수나 연산 피하기
- [ ] EXPLAIN으로 실행 계획 확인
- [ ] 커서 사용 최소화, 집합 연산 우선
- [ ] 트랜잭션 범위 최소화
- [ ] 트리거 로직 단순화
- [ ] 저장 프로시저로 네트워크 트래픽 감소

**보안 및 무결성 체크리스트:**

- [ ] 트리거로 데이터 검증 자동화
- [ ] 중요 작업은 트랜잭션으로 보호
- [ ] 저장 프로시저로 직접 테이블 접근 제한
- [ ] 삭제 전 백업 트리거 설정
- [ ] 변경 이력 자동 기록

**다음 학습 방향:**

본 문서에서 학습한 고급 기능을 바탕으로, 실제 프로젝트에서 다음과 같이 활용해 보시기 바랍니다:

1. **실전 프로젝트**: 쇼핑몰, 은행 시스템 등 복잡한 비즈니스 로직 구현
2. **성능 튜닝**: 대용량 데이터에서 인덱스 최적화 경험
3. **고급 SQL**: 윈도우 함수, CTE(Common Table Expression), 재귀 쿼리 학습
4. **데이터베이스 설계**: 정규화, ER 다이어그램, 스키마 설계
5. **백업 및 복구**: mysqldump, 복제(Replication), 클러스터링

데이터베이스는 실습을 통해 체득하는 것이 가장 중요합니다. 본 문서의 예제를 직접 실행해보고, 실무 시나리오에 적용해 보시기 바랍니다.
