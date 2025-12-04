---
title: "Docker Part 5 - Docker Compose"
excerpt: "여러 컨테이너를 조합하여 멀티 컨테이너 애플리케이션을 선언적으로 정의하고 관리하는 Docker Compose를 학습합니다."
categories: ['docker']
typora-root-url: ../../
published: true
date: 2025-01-24
tags: [docker, docker-compose, compose, yaml, multi-container, orchestration, services, volumes, networks]
---

## 전체 흐름 요약

실제 애플리케이션 환경은 단일 컨테이너로 구성되지 않습니다. 웹 서버, 애플리케이션 서버, 데이터베이스, 캐시 서버, 메시지 큐 등 **여러 컨테이너가 협력하여 동작**합니다. 각 컨테이너를 개별적으로 `docker container run` 명령어로 실행하고 관리하는 것은 복잡하고 오류가 발생하기 쉽습니다.

**Docker Compose**는 이러한 멀티 컨테이너 애플리케이션을 **YAML 파일 하나로 정의**하고, **단일 명령어로 전체 스택을 시작/중지/관리**할 수 있게 해주는 도구입니다. `docker-compose.yml` 파일에 서비스(services), 네트워크(networks), 볼륨(volumes)을 선언적으로 정의하면, Docker Compose가 자동으로 컨테이너를 생성하고 연결합니다.

이 과정에서는 Docker Compose의 **설치 방법**부터 시작하여, **docker-compose.yml 파일의 구조와 작성 방법**을 학습합니다. services 섹션에서 각 컨테이너의 이미지, 포트, 환경 변수, 볼륨 등을 정의하고, networks 섹션에서 컨테이너 간 통신을 설정하며, volumes 섹션에서 데이터 영속성을 관리하는 방법을 익힙니다.

또한 **docker-compose 명령어**(up, down, ps, logs, scale, exec 등)를 통해 전체 애플리케이션 스택을 효율적으로 관리하는 방법을 배웁니다. WordPress + MySQL 조합, Django + PostgreSQL 조합 등 실전 예제를 통해 **실무에서 즉시 활용 가능한 멀티 컨테이너 환경 구축 능력**을 갖추게 됩니다.

Docker Compose를 마스터하면 개발 환경 구축 시간을 대폭 단축하고, 팀원 간 환경 일관성을 보장하며, 운영 환경으로의 배포를 표준화할 수 있습니다.

---

## 1. Docker Compose 개요

### 1-1. Docker Compose란?

**Docker Compose**는 여러 컨테이너로 구성된 애플리케이션을 **정의하고 실행하는 도구**입니다. YAML 형식의 설정 파일(`docker-compose.yml`)로 전체 애플리케이션 스택을 선언적으로 관리합니다.

**Docker Compose의 핵심 개념:**

```mermaid
graph TD
    A[docker-compose.yml] --> B[Services]
    A --> C[Networks]
    A --> D[Volumes]

    B --> B1[웹 서버 컨테이너]
    B --> B2[앱 서버 컨테이너]
    B --> B3[DB 컨테이너]

    C --> C1[사용자 정의 네트워크]
    D --> D1[데이터 영속성 볼륨]
```

| 구성 요소 | 설명 |
|----------|------|
| **Services** | 애플리케이션을 구성하는 각 컨테이너 (웹, DB, 캐시 등) |
| **Networks** | 컨테이너 간 통신 네트워크 |
| **Volumes** | 데이터 영속성을 위한 볼륨 |

### 1-2. Docker Compose를 사용하는 이유

**Docker Compose 없이 (수동 관리):**

```bash
# 네트워크 생성
$ docker network create myapp-net

# 볼륨 생성
$ docker volume create myapp-db-data

# 데이터베이스 컨테이너 실행
$ docker container run -d \
  --name db \
  --network myapp-net \
  -v myapp-db-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=myapp \
  mysql:8.0

# 웹 서버 컨테이너 실행
$ docker container run -d \
  --name web \
  --network myapp-net \
  -p 80:80 \
  -e DB_HOST=db \
  -e DB_PASSWORD=secret \
  myapp:latest
```

**Docker Compose 사용:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: mysql:8.0
    volumes:
      - db-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: myapp

  web:
    image: myapp:latest
    ports:
      - "80:80"
    environment:
      DB_HOST: db
      DB_PASSWORD: secret
    depends_on:
      - db

volumes:
  db-data:
```

```bash
# 전체 스택 시작
$ docker-compose up -d
```

**Docker Compose의 장점:**

| 장점 | 설명 |
|------|------|
| **선언적 관리** | YAML 파일로 전체 구성 정의 |
| **간편한 명령어** | `up`, `down` 등 단일 명령어로 전체 제어 |
| **환경 일관성** | 개발/테스트/운영 환경 표준화 |
| **버전 관리** | Git으로 인프라 코드 관리 |
| **자동 네트워킹** | 서비스 간 자동 DNS 해석 |
| **의존성 관리** | `depends_on`으로 시작 순서 제어 |

### 1-3. Docker Compose 사용 사례

| 사용 사례 | 예시 |
|----------|------|
| **개발 환경** | 로컬에서 전체 스택 실행 |
| **테스트 환경** | CI/CD 파이프라인에서 통합 테스트 |
| **소규모 운영** | 단일 호스트에서 운영 (Kubernetes 대안) |
| **데모/프로토타입** | 빠른 환경 구축 |

---

## 2. Docker Compose 설치

### 2-1. 설치 확인

Docker Desktop(Windows/Mac)을 사용하는 경우 Docker Compose가 **기본 포함**되어 있습니다.

```bash
$ docker-compose --version
Docker Compose version v2.21.0
```

### 2-2. Linux에서 설치

#### 방법 1: Docker Compose V2 (권장)

Docker Compose V2는 **Docker CLI 플러그인** 형태로 제공됩니다.

```bash
# Docker 공식 저장소에서 설치 (Docker Engine과 함께 설치됨)
$ sudo apt-get update
$ sudo apt-get install docker-compose-plugin

# 설치 확인 (docker compose 명령어 사용)
$ docker compose version
Docker Compose version v2.21.0
```

#### 방법 2: Docker Compose V1 (레거시)

```bash
# 바이너리 다운로드
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

# 실행 권한 부여
$ sudo chmod +x /usr/local/bin/docker-compose

# 심볼릭 링크 생성 (선택)
$ sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 설치 확인 (docker-compose 명령어 사용)
$ docker-compose --version
docker-compose version 1.29.2, build 5becea4c
```

**V1 vs V2 명령어 차이:**

| 버전 | 명령어 형식 | 예시 |
|------|------------|------|
| **V1** | `docker-compose` | `docker-compose up -d` |
| **V2** | `docker compose` | `docker compose up -d` |

> **참고:** 본 문서에서는 V2 문법(`docker compose`)을 사용하지만, V1 문법(`docker-compose`)도 동일하게 작동합니다.

---

## 3. docker-compose.yml 파일 구조

### 3-1. 기본 구조

**docker-compose.yml**은 크게 세 가지 섹션으로 구성됩니다:

```yaml
version: '3.8'    # Compose 파일 버전

services:         # 컨테이너 정의
  service1:
    # 서비스 설정
  service2:
    # 서비스 설정

networks:         # 네트워크 정의 (선택)
  network1:
    # 네트워크 설정

volumes:          # 볼륨 정의 (선택)
  volume1:
    # 볼륨 설정
```

### 3-2. version 지정

**Compose 파일 버전:**

| 버전 | Docker Engine | 특징 |
|------|--------------|------|
| `3.8` | 19.03.0+ | 최신 권장 버전 |
| `3.7` | 18.06.0+ | 널리 사용됨 |
| `3.0` | 1.13.0+ | 기본 기능 |
| `2.4` | 17.12.0+ | 레거시 (V2 형식) |

```yaml
version: '3.8'
```

> **참고:** Compose V2부터는 version 필드가 선택 사항이지만, 호환성을 위해 명시하는 것을 권장합니다.

---

## 4. Services 정의

### 4-1. 기본 서비스 정의

```yaml
services:
  web:
    image: nginx:alpine        # 사용할 이미지
    container_name: my-web     # 컨테이너 이름 (선택)
    ports:                     # 포트 매핑
      - "8080:80"
    environment:               # 환경 변수
      - ENV=production
    volumes:                   # 볼륨 마운트
      - ./html:/usr/share/nginx/html
    restart: always            # 재시작 정책
```

### 4-2. 주요 서비스 옵션

#### 📟 `image` vs `build`

**image:** Docker Hub 등에서 이미지를 가져옵니다.

```yaml
services:
  web:
    image: nginx:1.21-alpine
```

**build:** Dockerfile로 이미지를 빌드합니다.

```yaml
services:
  app:
    build:
      context: ./app            # Dockerfile 경로
      dockerfile: Dockerfile    # Dockerfile 이름 (기본값: Dockerfile)
      args:                     # 빌드 인자
        VERSION: 1.0
```

**혼합 사용:**

```yaml
services:
  app:
    build: ./app
    image: myapp:latest    # 빌드 후 이미지 이름
```

---

#### 📟 `ports` (포트 매핑)

**기본 문법:**

```yaml
ports:
  - "HOST_PORT:CONTAINER_PORT"
```

**예제:**

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"              # 호스트 8080 → 컨테이너 80
      - "8443:443"             # 호스트 8443 → 컨테이너 443
      - "127.0.0.1:3000:3000"  # 로컬호스트만 접근 가능
      - "3000-3005:3000-3005"  # 범위 지정
```

**포트 노출 (expose):**

```yaml
services:
  app:
    image: myapp:latest
    expose:
      - "8080"    # 다른 서비스에만 노출 (호스트에는 노출 안 됨)
```

---

#### 📟 `environment` (환경 변수)

**배열 형식:**

```yaml
services:
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=mydb
      - MYSQL_USER=user
      - MYSQL_PASSWORD=pass
```

**객체 형식:**

```yaml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: mydb
      MYSQL_USER: user
      MYSQL_PASSWORD: pass
```

**환경 변수 파일 (.env):**

```yaml
# docker-compose.yml
services:
  app:
    image: myapp:latest
    env_file:
      - .env
      - .env.local
```

```bash
# .env 파일
DB_HOST=db
DB_PORT=5432
DB_NAME=myapp
DB_USER=user
DB_PASSWORD=secret
```

---

#### 📟 `volumes` (볼륨 마운트)

**Bind Mount (호스트 경로 → 컨테이너):**

```yaml
services:
  web:
    image: nginx:alpine
    volumes:
      - ./html:/usr/share/nginx/html          # 상대 경로
      - /var/log/nginx:/var/log/nginx         # 절대 경로
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro  # 읽기 전용
```

**Named Volume (Docker 관리 볼륨):**

```yaml
services:
  db:
    image: mysql:8.0
    volumes:
      - db-data:/var/lib/mysql    # 최상위 volumes에 정의 필요

volumes:
  db-data:    # 볼륨 정의
```

**tmpfs Mount (임시 파일시스템):**

```yaml
services:
  app:
    image: myapp:latest
    tmpfs:
      - /tmp
      - /run
```

---

#### 📟 `depends_on` (의존성 관리)

**기본 사용:**

```yaml
services:
  web:
    image: nginx:alpine
    depends_on:
      - app
      - db    # app, db가 시작된 후 web 시작

  app:
    image: myapp:latest
    depends_on:
      - db    # db가 시작된 후 app 시작

  db:
    image: mysql:8.0
```

**시작 순서:**

```
db → app → web
```

> **주의:** `depends_on`은 컨테이너 **시작 순서**만 제어하며, **애플리케이션이 준비될 때까지 대기하지 않습니다**. 예를 들어, DB 컨테이너는 시작되었지만 MySQL이 완전히 초기화되기 전에 app이 접속을 시도할 수 있습니다.

**헬스체크 기반 대기 (Compose V3.8+):**

```yaml
services:
  db:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: myapp:latest
    depends_on:
      db:
        condition: service_healthy    # db가 healthy 상태가 될 때까지 대기
```

---

#### 📟 `restart` (재시작 정책)

```yaml
services:
  web:
    image: nginx:alpine
    restart: always
```

| 옵션 | 설명 |
|------|------|
| `no` | 재시작 안 함 (기본값) |
| `always` | 항상 재시작 |
| `on-failure` | 오류 종료 시에만 재시작 |
| `unless-stopped` | 수동 중지가 아닌 경우 재시작 |

---

#### 📟 `networks` (네트워크 연결)

```yaml
services:
  web:
    image: nginx:alpine
    networks:
      - frontend

  app:
    image: myapp:latest
    networks:
      - frontend
      - backend

  db:
    image: mysql:8.0
    networks:
      - backend

networks:
  frontend:
  backend:
```

**네트워크 격리:**

```
web (frontend) ←→ app (frontend + backend) ←→ db (backend)
web ←X→ db (직접 통신 불가)
```

---

#### 📟 기타 유용한 옵션

**command:** 컨테이너 시작 명령어 오버라이드

```yaml
services:
  app:
    image: python:3.9
    command: python app.py --debug
```

**working_dir:** 작업 디렉토리 설정

```yaml
services:
  app:
    image: node:16
    working_dir: /app
```

**user:** 실행 사용자 지정

```yaml
services:
  app:
    image: myapp:latest
    user: "1000:1000"
```

**stdin_open / tty:** 인터랙티브 모드

```yaml
services:
  ubuntu:
    image: ubuntu:20.04
    stdin_open: true    # -i
    tty: true           # -t
```

**labels:** 메타데이터 추가

```yaml
services:
  web:
    image: nginx:alpine
    labels:
      com.example.description: "Web Server"
      com.example.version: "1.0"
```

---

## 5. Networks 정의

### 5-1. 기본 네트워크

Docker Compose는 기본적으로 **프로젝트별 브리지 네트워크**를 자동 생성합니다.

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
  db:
    image: mysql:8.0
```

**생성되는 네트워크:**

```
{프로젝트명}_default
```

**서비스 간 통신:**

```bash
# web 컨테이너에서 db 컨테이너로 접속
$ docker compose exec web ping db
PING db (172.18.0.2): 56 data bytes
```

> **자동 DNS 해석:** 서비스 이름(`db`)으로 다른 컨테이너에 접근 가능합니다.

### 5-2. 사용자 정의 네트워크

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    networks:
      - frontend

  app:
    image: myapp:latest
    networks:
      - frontend
      - backend

  db:
    image: mysql:8.0
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.100.0/24
```

### 5-3. 외부 네트워크 사용

```yaml
services:
  web:
    image: nginx:alpine
    networks:
      - existing-network

networks:
  existing-network:
    external: true    # 기존 네트워크 사용
```

---

## 6. Volumes 정의

### 6-1. Named Volume

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:    # Docker가 관리하는 볼륨
```

**볼륨 확인:**

```bash
$ docker volume ls
DRIVER    VOLUME NAME
local     myproject_db-data
```

### 6-2. 외부 볼륨 사용

```yaml
volumes:
  db-data:
    external: true    # 기존 볼륨 사용
```

### 6-3. 볼륨 드라이버 지정

```yaml
volumes:
  db-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,rw
      device: ":/path/to/dir"
```

---

## 7. Docker Compose 명령어

### 7-1. 주요 명령어

#### 📟 `docker compose up` 명령어

**목적:** 서비스를 생성하고 시작합니다.

**기본 문법:**

```bash
docker compose up [OPTIONS] [SERVICE...]
```

**주요 옵션:**

| 옵션 | 의미 | 예시 |
|------|------|------|
| `-d` | 백그라운드 실행 | `docker compose up -d` |
| `--build` | 이미지 강제 재빌드 | `docker compose up --build` |
| `--force-recreate` | 컨테이너 강제 재생성 | `docker compose up --force-recreate` |
| `--scale` | 서비스 인스턴스 수 지정 | `docker compose up --scale web=3` |
| `--no-deps` | 연결된 서비스 시작 안 함 | `docker compose up --no-deps web` |

**실행 예제:**

```bash
# 전체 서비스 시작 (포그라운드)
$ docker compose up

# 백그라운드 시작
$ docker compose up -d

# 특정 서비스만 시작
$ docker compose up -d web db

# 이미지 재빌드 후 시작
$ docker compose up -d --build
```

**예상 출력:**

```
[+] Running 3/3
 ✔ Network myapp_default    Created
 ✔ Container myapp-db-1     Started
 ✔ Container myapp-web-1    Started
```

---

#### 📟 `docker compose down` 명령어

**목적:** 서비스를 중지하고 리소스를 제거합니다.

**기본 문법:**

```bash
docker compose down [OPTIONS]
```

**주요 옵션:**

| 옵션 | 의미 | 예시 |
|------|------|------|
| `-v` | 볼륨도 함께 삭제 | `docker compose down -v` |
| `--rmi` | 이미지도 삭제 (`all` 또는 `local`) | `docker compose down --rmi all` |
| `--remove-orphans` | 고아 컨테이너 제거 | `docker compose down --remove-orphans` |

**실행 예제:**

```bash
# 컨테이너, 네트워크 제거
$ docker compose down

# 볼륨도 함께 제거
$ docker compose down -v

# 이미지까지 제거
$ docker compose down --rmi all
```

**예상 출력:**

```
[+] Running 3/3
 ✔ Container myapp-web-1    Removed
 ✔ Container myapp-db-1     Removed
 ✔ Network myapp_default    Removed
```

---

#### 📟 `docker compose ps` 명령어

**목적:** 실행 중인 서비스 목록을 표시합니다.

**실행 예제:**

```bash
$ docker compose ps
```

**예상 출력:**

```
NAME            IMAGE         COMMAND                  SERVICE   CREATED         STATUS         PORTS
myapp-db-1      mysql:8.0     "docker-entrypoint.s…"   db        2 minutes ago   Up 2 minutes   3306/tcp, 33060/tcp
myapp-web-1     nginx:alpine  "/docker-entrypoint.…"   web       2 minutes ago   Up 2 minutes   0.0.0.0:8080->80/tcp
```

**전체 컨테이너 (중지 포함):**

```bash
$ docker compose ps -a
```

---

#### 📟 `docker compose logs` 명령어

**목적:** 서비스 로그를 확인합니다.

**기본 문법:**

```bash
docker compose logs [OPTIONS] [SERVICE...]
```

**주요 옵션:**

| 옵션 | 의미 | 예시 |
|------|------|------|
| `-f` | 실시간 로그 스트림 | `docker compose logs -f` |
| `--tail` | 마지막 N줄만 표시 | `docker compose logs --tail=100` |
| `-t` | 타임스탬프 표시 | `docker compose logs -t` |

**실행 예제:**

```bash
# 전체 서비스 로그
$ docker compose logs

# 특정 서비스 로그
$ docker compose logs web

# 실시간 로그
$ docker compose logs -f web

# 마지막 50줄 + 실시간
$ docker compose logs -f --tail=50 web
```

---

#### 📟 `docker compose exec` 명령어

**목적:** 실행 중인 서비스에서 명령어를 실행합니다.

**기본 문법:**

```bash
docker compose exec [OPTIONS] SERVICE COMMAND [ARGS...]
```

**실행 예제:**

```bash
# web 서비스에서 bash 실행
$ docker compose exec web /bin/bash

# db 서비스에서 MySQL 접속
$ docker compose exec db mysql -u root -p

# 환경 변수 확인
$ docker compose exec web env
```

---

#### 📟 `docker compose restart` 명령어

**목적:** 서비스를 재시작합니다.

**실행 예제:**

```bash
# 전체 서비스 재시작
$ docker compose restart

# 특정 서비스 재시작
$ docker compose restart web
```

---

#### 📟 `docker compose stop / start` 명령어

**목적:** 서비스를 중지/시작합니다 (리소스는 유지).

**실행 예제:**

```bash
# 전체 서비스 중지
$ docker compose stop

# 특정 서비스 중지
$ docker compose stop web

# 서비스 시작
$ docker compose start web
```

---

#### 📟 `docker compose build` 명령어

**목적:** 서비스 이미지를 빌드합니다.

**기본 문법:**

```bash
docker compose build [OPTIONS] [SERVICE...]
```

**주요 옵션:**

| 옵션 | 의미 | 예시 |
|------|------|------|
| `--no-cache` | 캐시 사용 안 함 | `docker compose build --no-cache` |
| `--pull` | 베이스 이미지 최신 버전 가져오기 | `docker compose build --pull` |

**실행 예제:**

```bash
# 전체 서비스 빌드
$ docker compose build

# 특정 서비스 빌드
$ docker compose build app

# 캐시 없이 빌드
$ docker compose build --no-cache app
```

---

#### 📟 `docker compose pull` 명령어

**목적:** 서비스 이미지를 다운로드합니다.

**실행 예제:**

```bash
# 전체 서비스 이미지 pull
$ docker compose pull

# 특정 서비스 이미지 pull
$ docker compose pull web
```

---

#### 📟 `docker compose config` 명령어

**목적:** Compose 파일의 설정을 검증하고 출력합니다.

**실행 예제:**

```bash
# 설정 검증 및 출력
$ docker compose config

# 서비스 목록만 출력
$ docker compose config --services

# 볼륨 목록만 출력
$ docker compose config --volumes
```

---

## 8. 실전 예제

### 8-1. WordPress + MySQL

#### 디렉토리 구조

```
wordpress-stack/
├── docker-compose.yml
└── .env
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: wordpress-db
    volumes:
      - db-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    networks:
      - backend
    restart: unless-stopped

  wordpress:
    image: wordpress:latest
    container_name: wordpress-app
    depends_on:
      - db
    ports:
      - "${WP_PORT:-8080}:80"
    volumes:
      - wp-data:/var/www/html
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_NAME: ${DB_NAME}
      WORDPRESS_DB_USER: ${DB_USER}
      WORDPRESS_DB_PASSWORD: ${DB_PASSWORD}
    networks:
      - backend
      - frontend
    restart: unless-stopped

networks:
  frontend:
  backend:

volumes:
  db-data:
  wp-data:
```

#### .env 파일

```bash
# .env
DB_ROOT_PASSWORD=rootpass123
DB_NAME=wordpress
DB_USER=wpuser
DB_PASSWORD=wppass123
WP_PORT=8080
```

#### 실행

```bash
# 서비스 시작
$ docker compose up -d

# 상태 확인
$ docker compose ps

# 로그 확인
$ docker compose logs -f wordpress

# 브라우저에서 접속
# http://localhost:8080
```

#### 중지 및 삭제

```bash
# 중지 (볼륨 유지)
$ docker compose down

# 중지 + 볼륨 삭제
$ docker compose down -v
```

---

### 8-2. Django + PostgreSQL + Redis

#### 디렉토리 구조

```
django-stack/
├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── docker-compose.yml
└── .env
```

#### Dockerfile (app/Dockerfile)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드
COPY . .

# 포트 노출
EXPOSE 8000

# 실행
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "myproject.wsgi:application"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    networks:
      - backend
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend
    restart: unless-stopped

  web:
    build:
      context: ./app
    command: >
      sh -c "python manage.py migrate &&
             gunicorn --bind 0.0.0.0:8000 myproject.wsgi:application"
    volumes:
      - ./app:/app
      - static-data:/app/static
      - media-data:/app/media
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379/0
      DEBUG: ${DEBUG}
    depends_on:
      - db
      - redis
    networks:
      - backend
      - frontend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - static-data:/app/static:ro
      - media-data:/app/media:ro
    ports:
      - "80:80"
    depends_on:
      - web
    networks:
      - frontend
    restart: unless-stopped

networks:
  frontend:
  backend:

volumes:
  postgres-data:
  redis-data:
  static-data:
  media-data:
```

#### .env 파일

```bash
# .env
DB_NAME=django_db
DB_USER=django_user
DB_PASSWORD=django_pass123
DEBUG=False
```

#### 실행

```bash
# 이미지 빌드 및 서비스 시작
$ docker compose up -d --build

# 로그 확인
$ docker compose logs -f web

# Django 관리 명령어 실행
$ docker compose exec web python manage.py createsuperuser

# 브라우저에서 접속
# http://localhost
```

---

### 8-3. 마이크로서비스 스택 (Node.js + Python + MongoDB + RabbitMQ)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # 메시지 큐
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"    # 관리 UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    networks:
      - backend
    restart: unless-stopped

  # 데이터베이스
  mongodb:
    image: mongo:5
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: rootpass123
    networks:
      - backend
    restart: unless-stopped

  # API Gateway (Node.js)
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      RABBITMQ_URL: amqp://admin:admin123@rabbitmq:5672
      MONGODB_URL: mongodb://root:rootpass123@mongodb:27017
    depends_on:
      - rabbitmq
      - mongodb
    networks:
      - frontend
      - backend
    restart: unless-stopped

  # 데이터 처리 서비스 (Python)
  data-processor:
    build: ./data-processor
    environment:
      RABBITMQ_URL: amqp://admin:admin123@rabbitmq:5672
      MONGODB_URL: mongodb://root:rootpass123@mongodb:27017
    depends_on:
      - rabbitmq
      - mongodb
    networks:
      - backend
    restart: unless-stopped
    deploy:
      replicas: 2    # 2개 인스턴스 실행

  # 모니터링 (Prometheus + Grafana)
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin123
    depends_on:
      - prometheus
    networks:
      - monitoring
    restart: unless-stopped

networks:
  frontend:
  backend:
  monitoring:

volumes:
  mongo-data:
  prometheus-data:
  grafana-data:
```

---

## 9. Docker Compose 고급 기능

### 9-1. 스케일링 (replicas)

**Compose 파일에서:**

```yaml
services:
  worker:
    image: myworker:latest
    deploy:
      replicas: 3    # 3개 인스턴스
```

**명령어로:**

```bash
$ docker compose up -d --scale worker=5
```

### 9-2. 환경별 설정 (override)

**기본 설정 (docker-compose.yml):**

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
```

**개발 환경 (docker-compose.override.yml):**

```yaml
version: '3.8'

services:
  web:
    volumes:
      - ./html:/usr/share/nginx/html    # 개발 시 실시간 반영
    environment:
      - DEBUG=true
```

**프로덕션 환경 (docker-compose.prod.yml):**

```yaml
version: '3.8'

services:
  web:
    restart: always
    environment:
      - DEBUG=false
```

**실행:**

```bash
# 개발 환경 (자동으로 override.yml 병합)
$ docker compose up -d

# 프로덕션 환경
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 9-3. 헬스체크

```yaml
services:
  web:
    image: nginx:alpine
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 9-4. 리소스 제한

```yaml
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## 주요 개념 요약표

| 구분 | 주요 개념 | 설명 |
|------|----------|------|
| **Compose 구성** | services | 컨테이너 정의 |
| | networks | 네트워크 정의 |
| | volumes | 볼륨 정의 |
| **서비스 옵션** | image / build | 이미지 지정 또는 빌드 |
| | ports | 포트 매핑 (호스트:컨테이너) |
| | environment | 환경 변수 설정 |
| | volumes | 볼륨 마운트 (bind mount / named volume) |
| | depends_on | 의존성 관리 (시작 순서) |
| | restart | 재시작 정책 (always, on-failure 등) |
| **주요 명령어** | docker compose up | 서비스 생성 및 시작 |
| | docker compose down | 서비스 중지 및 리소스 제거 |
| | docker compose ps | 서비스 목록 확인 |
| | docker compose logs | 로그 확인 |
| | docker compose exec | 서비스에서 명령어 실행 |
| | docker compose build | 이미지 빌드 |
| | docker compose restart | 서비스 재시작 |
| **고급 기능** | 스케일링 | replicas 또는 --scale 옵션 |
| | 환경별 설정 | override 파일 사용 |
| | 헬스체크 | healthcheck 정의 |
| | 리소스 제한 | CPU, 메모리 제한 설정 |

---

## 마무리

이번 Part 5에서는 **Docker Compose를 이용한 멀티 컨테이너 애플리케이션 관리**를 완전히 마스터했습니다. `docker-compose.yml` 파일의 구조를 이해하고, services, networks, volumes 섹션을 정의하는 방법을 배웠습니다. image, ports, environment, volumes, depends_on 등 **핵심 서비스 옵션**을 실습하며 각 옵션의 역할과 활용법을 익혔습니다.

**docker compose up/down, ps, logs, exec** 등 주요 명령어를 통해 전체 애플리케이션 스택을 효율적으로 제어하는 방법을 배웠으며, **WordPress + MySQL, Django + PostgreSQL + Redis, 마이크로서비스 스택** 등 실전 예제를 통해 실무에서 즉시 활용 가능한 구성 패턴을 익혔습니다.

Docker Compose의 **고급 기능**(스케일링, 환경별 설정, 헬스체크, 리소스 제한)을 학습하여 개발 환경과 운영 환경을 유연하게 관리할 수 있게 되었습니다. `.env` 파일을 활용한 환경 변수 관리, override 파일을 이용한 환경별 설정 분리 등 **프로덕션 환경에 적합한 베스트 프랙티스**도 함께 배웠습니다.

**Docker 시리즈 전체(Part 1~5)를 마무리하며:**

- **Part 1**: Docker 개념, 설치, VM vs Container 비교
- **Part 2**: 이미지와 컨테이너 기본 명령어
- **Part 3**: 볼륨과 네트워크를 통한 데이터 영속성 및 통신
- **Part 4**: Dockerfile을 이용한 사용자 정의 이미지 빌드
- **Part 5**: Docker Compose를 통한 멀티 컨테이너 오케스트레이션

Docker를 활용하여 **개발 환경 구축, 애플리케이션 배포, 인프라 관리**를 효율적으로 수행할 수 있는 역량을 갖추었습니다. Docker Compose로 정의한 애플리케이션 스택은 팀원 간 공유가 용이하고, 환경 간 이동이 간편하며, CI/CD 파이프라인에 통합하기 쉽습니다.
