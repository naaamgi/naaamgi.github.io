---
title: "리눅스 (1) - 리눅스 기초와 파일 시스템"
excerpt: ".."

categories: linux
typora-root-url: ../../
published: true
date: 2025-11-22
last_modified_at: 2025-11-22

tags: [linux, command, filesystem, sk]

---

## 전체 흐름 요약

이 글은 리눅스의 기본 구조와 파일 시스템을 다룹니다. 커널과 쉘의 개념부터 시작하여 리눅스의 계층적 디렉토리 구조를 이해하고, 파일과 디렉토리를 관리하는 핵심 명령어들을 학습합니다. 각 명령어는 개별 옵션 설명과 함께 실무에서 자주 사용하는 조합 예시를 포함하여 즉시 활용할 수 있도록 구성했습니다.

---

## 리눅스 기본 구조

### 커널(Kernel)과 쉘(Shell)

리눅스는 **커널(Kernel)**과 **쉘(Shell)**로 구성됩니다.

**커널**은 운영체제의 핵심으로, 하드웨어를 직접 제어하고 시스템 리소스를 관리합니다. 메모리 관리, 프로세스 스케줄링, 파일 시스템 관리, 디바이스 드라이버 제어 등의 저수준 작업을 담당합니다. 커널은 하드웨어와 소프트웨어 사이의 중재자 역할을 하며, 시스템 호출(System Call)을 통해 응용 프로그램의 요청을 처리합니다.

**쉘**은 사용자와 커널 사이의 인터페이스 역할을 합니다. 사용자가 입력하는 명령어를 해석하여 커널에 전달하고, 실행 결과를 사용자에게 보여줍니다. 쉘은 명령어 해석기(Command Interpreter)이자 프로그래밍 환경으로, 스크립트 작성을 통해 작업을 자동화할 수 있습니다.

**주요 쉘 종류:**
- **Bash (Bourne Again Shell)** : 가장 널리 사용되는 쉘, 대부분의 리눅스 배포판의 기본 쉘. 강력한 스크립팅 기능과 명령어 히스토리, 자동완성 제공
- **Zsh (Z Shell)** : Bash의 확장 버전, 강력한 자동완성과 테마 지원. Oh-My-Zsh 프레임워크를 통해 다양한 플러그인 사용 가능
- **Fish (Friendly Interactive Shell)** : 사용자 친화적인 기능과 구문 강조 제공. 설정 없이도 강력한 자동완성 기능
- **Ksh (Korn Shell)** : 유닉스 시스템에서 많이 사용. Bash와 Csh의 기능을 결합
- **Csh/Tcsh (C Shell)** : C 언어와 유사한 문법 제공. 인터랙티브 사용에 최적화
- **Dash (Debian Almquist Shell)** : 경량 쉘, 스크립트 실행 속도가 빠름. /bin/sh로 많이 사용

### 리눅스 디렉토리 구조 (FHS - Filesystem Hierarchy Standard)

리눅스는 계층적 디렉토리 구조를 사용합니다. 모든 파일과 디렉토리는 루트(`/`)에서 시작하는 트리 구조로 조직화됩니다. FHS(Filesystem Hierarchy Standard)는 리눅스 배포판 간의 일관성을 위해 정의된 표준입니다.

**디렉토리 구조 시각화:**

```mermaid
graph TD
    A[/ root] --> B[/bin 기본 실행 파일]
    A --> C[/etc 설정 파일]
    A --> D[/home 사용자 홈]
    A --> E[/var 가변 데이터]
    A --> F[/usr 사용자 응용]
    A --> G[/tmp 임시 파일]
    D --> D1[/home/user1]
    D --> D2[/home/user2]
    E --> E1[/var/log 로그]
    E --> E2[/var/mail 메일]
    F --> F1[/usr/bin]
    F --> F2[/usr/local]
```

**주요 디렉토리:**

- **`/`** : 최상위 루트 디렉토리, 모든 디렉토리의 시작점. 파일 시스템 계층 구조의 최상단
- **`/bin`** : 기본 실행 파일 (binary), 시스템 부팅과 복구에 필요한 필수 명령어 저장 (ls, cp, mv, cat, bash 등)
- **`/sbin`** : 시스템 관리용 실행 파일 (system binary), root 권한이 필요한 시스템 관리 명령어 (fdisk, ifconfig, reboot, shutdown 등)
- **`/etc`** : 시스템 설정 파일 (editable text configuration), 각종 설정 파일과 스크립트 저장 (/etc/passwd, /etc/hosts, /etc/fstab 등)
- **`/home`** : 일반 사용자의 홈 디렉토리, 각 사용자별로 개인 디렉토리 생성 (/home/user1, /home/user2 등)
- **`/root`** : root 사용자의 홈 디렉토리, 일반 사용자의 /home과 별도로 존재
- **`/var`** : 가변 데이터 저장 (variable), 로그 파일, 메일, 프린트 스풀, 임시 파일 등 자주 변경되는 데이터 (/var/log, /var/mail, /var/spool 등)
- **`/tmp`** : 임시 파일 저장소, 재부팅 시 삭제될 수 있음. 모든 사용자가 쓰기 가능
- **`/usr`** : 사용자 응용 프로그램과 파일 (/usr/bin, /usr/lib, /usr/share 등). 읽기 전용으로 마운트되는 경우가 많음
- **`/usr/bin`** : 일반 사용자용 응용 프로그램 실행 파일
- **`/usr/sbin`** : 시스템 관리용 응용 프로그램 실행 파일
- **`/usr/local`** : 로컬에서 설치한 소프트웨어, 배포판 패키지 관리자가 아닌 수동 설치 프로그램
- **`/opt`** : 추가 소프트웨어 패키지, 독립적인 응용 프로그램 설치 (Oracle, Google Chrome 등)
- **`/dev`** : 장치 파일 (device), 하드웨어 장치를 파일로 표현 (/dev/sda, /dev/null, /dev/random 등)
- **`/proc`** : 프로세스 정보, 가상 파일 시스템으로 커널과 프로세스 정보를 파일 형태로 제공 (/proc/cpuinfo, /proc/meminfo 등)
- **`/sys`** : 시스템 정보, 커널의 장치 드라이버와 하드웨어 정보 제공
- **`/mnt`** : 임시 마운트 포인트, 파일 시스템을 임시로 마운트할 때 사용
- **`/media`** : 이동식 장치 마운트, USB, CD-ROM 등이 자동으로 마운트되는 위치
- **`/lib`** : 공유 라이브러리, /bin과 /sbin의 실행 파일이 사용하는 라이브러리 파일
- **`/lib64`** : 64비트 공유 라이브러리
- **`/boot`** : 부팅 관련 파일, 커널 이미지와 부트로더 설정 파일 (vmlinuz, initrd 등)
- **`/run`** : 런타임 데이터, 부팅 이후 시스템 상태 정보 저장. 재부팅 시 삭제
- **`/srv`** : 서비스 데이터, 시스템에서 제공하는 서비스의 데이터 (웹 서버, FTP 서버 등)
- **`/lost+found`** : 파일 시스템 복구 시 발견된 손상된 파일 조각 저장

### 절대 경로와 상대 경로

**절대 경로 (Absolute Path)**
- 루트 디렉토리(`/`)부터 시작하는 전체 경로
- 현재 위치와 관계없이 항상 동일한 위치를 가리킴
- 예: `/home/user/documents/file.txt`, `/etc/passwd`, `/var/log/syslog`

**상대 경로 (Relative Path)**
- 현재 작업 디렉토리를 기준으로 하는 경로
- `.` : 현재 디렉토리
- `..` : 상위(부모) 디렉토리
- `~` : 현재 사용자의 홈 디렉토리
- `~username` : 특정 사용자의 홈 디렉토리
- 예: `./file.txt`, `../images/photo.jpg`, `~/documents`

---

## 파일과 디렉토리 관리 명령어

### pwd - 현재 작업 디렉토리 확인

현재 작업 중인 디렉토리의 절대 경로를 출력하는 명령어입니다. Print Working Directory의 약자입니다.

**예시**
```bash
# 현재 디렉토리 확인
pwd
```

**실무 조합 예시**
```bash
# 스크립트에서 현재 디렉토리 저장
CURRENT_DIR=$(pwd)
echo "Working in: $CURRENT_DIR"
```

### ls - 파일 목록 확인

디렉토리 내의 파일과 폴더를 보여주는 기본 명령어입니다. List의 약자입니다.

**주요 옵션**
- `-l` : 상세 정보 표시 (권한, 소유자, 크기, 날짜)
- `-a` : 숨김 파일 포함 (`.`으로 시작하는 파일)
- `-h` : 파일 크기를 읽기 쉬운 형태로 (1K, 234M, 2G)
- `-t` : 수정 시간 순 정렬 (최신 파일 먼저)
- `-r` : 역순 정렬
- `-S` : 파일 크기 순 정렬 (큰 파일 먼저)
- `-R` : 하위 디렉토리 재귀 표시
- `-d` : 디렉토리 자체 정보만 표시

**예시**
```bash
# 기본 파일 목록
ls

# 상세 정보 표시
ls -l

# 숨김 파일 포함 모두 표시
ls -la

# 크기를 읽기 쉽게 표시
ls -lh

# 최신 파일 순으로 정렬
ls -lt

# 큰 파일부터 표시
ls -lS

# 하위 디렉토리 모든 파일 확인
ls -R

# 특정 확장자만 찾기
ls *.txt

# 디렉토리 자체 정보만 보기
ls -ld /var/log
```

**실무 조합 예시**
```bash
# 숨김 파일 포함, 상세 정보, 읽기 쉬운 크기, 최신 순
ls -laht

# 용량이 큰 파일 찾기 (크기 순 + 읽기 쉬운 형태)
ls -lhS

# 특정 디렉토리의 모든 로그 파일을 최신 순으로
ls -lht /var/log/*.log

# 숨김 파일 포함, 파일 타입 표시, 색상 구분
ls -aF --color

# inode와 함께 상세 정보 표시 (하드 링크 확인 시 유용)
ls -li
```

### cd - 디렉토리 이동

작업 디렉토리를 변경하는 명령어입니다. Change Directory의 약자입니다.

**주요 사용법**
- `cd /path` : 절대 경로로 이동
- `cd path` : 상대 경로로 이동
- `cd ..` : 상위 디렉토리로 이동
- `cd ~` 또는 `cd` : 홈 디렉토리로 이동
- `cd -` : 이전 디렉토리로 이동 (OLDPWD 환경변수 사용)
- `cd ../..` : 두 단계 상위 디렉토리로 이동

**예시**
```bash
# 홈 디렉토리로 이동
cd ~
cd

# 절대 경로로 이동
cd /var/log

# 상대 경로로 이동
cd documents

# 상위 디렉토리로 이동
cd ..

# 이전 위치로 돌아가기
cd -

# 여러 단계 상위로 이동
cd ../..
```

**실무 조합 예시**
```bash
# 특정 디렉토리로 이동 후 작업하고 원위치
cd /etc && ls -la && cd -

# 홈의 특정 하위 디렉토리로 빠르게 이동
cd ~/projects/myapp/src

# 긴 경로를 환경변수로 저장하고 이동
PROJECT_DIR="/var/www/html/mysite"
cd $PROJECT_DIR
```

### mkdir - 디렉토리 생성

새로운 디렉토리를 만드는 명령어입니다. Make Directory의 약자입니다.

**주요 옵션**
- `-p` : 상위 디렉토리까지 한번에 생성
- `-m` : 권한을 지정하며 생성 (예: 755)

**예시**
```bash
# 단일 디렉토리 생성
mkdir project

# 중첩된 디렉토리 한번에 생성
mkdir -p project/src/main

# 권한 지정하며 생성 (755)
mkdir -m 755 secure_dir
```

**실무 조합 예시**
```bash
# 프로젝트 구조 한번에 생성
mkdir -p project/{src,bin,doc,test}

# 날짜별 로그 디렉토리 생성 (권한 지정 + 상세 표시)
mkdir -pv -m 750 /var/log/myapp/$(date +%Y%m%d)

# 여러 단계 디렉토리 생성 및 확인
mkdir -pv ~/workspace/project/{frontend/{src,public},backend/{api,db}}
```

### touch - 파일 생성 및 타임스탬프 수정

빈 파일을 생성하거나 기존 파일의 타임스탬프를 변경하는 명령어입니다.

**주요 옵션**
- `-t` : 특정 시간으로 타임스탬프 설정 (YYYYMMDDhhmm)
- `-r` : 참조 파일의 타임스탬프 복사

**예시**
```bash
# 빈 파일 생성
touch file.txt

# 여러 파일 동시 생성
touch file1.txt file2.txt file3.txt

# 특정 시간으로 설정
touch -t 202401011200 file.txt

# 다른 파일의 타임스탬프 복사
touch -r reference.txt target.txt
```

**실무 조합 예시**
```bash
# 여러 확장자 파일 한번에 생성
touch index.{html,css,js}

# 현재 시간으로 타임스탬프 갱신 (백업 전 사용)
touch -m important_file.txt

# 특정 날짜의 파일로 만들기 (테스트용)
touch -t 202301011200 test_old_file.txt
```

### cp - 파일 및 디렉토리 복사

파일이나 디렉토리를 복사하는 명령어입니다. Copy의 약자입니다.

**주요 옵션**
- `-r` 또는 `-R` : 디렉토리 재귀 복사
- `-i` : 덮어쓰기 전 확인
- `-f` : 강제 복사 (확인 없이 덮어쓰기)
- `-p` : 파일 속성 보존 (권한, 타임스탬프)
- `-a` : 아카이브 모드 (모든 속성 보존 + 재귀 복사)
- `-u` : 최신 파일만 복사 (update)

**예시**
```bash
# 파일 복사
cp source.txt destination.txt

# 디렉토리 복사
cp -r source_dir destination_dir

# 여러 파일을 디렉토리로 복사
cp file1.txt file2.txt /target/directory/

# 속성 보존하며 복사
cp -p original.txt copy.txt

# 최신 파일만 복사
cp -u source.txt destination.txt

# 덮어쓰기 전 확인
cp -i source.txt existing.txt
```

**실무 조합 예시**
```bash
# 디렉토리 전체를 속성 보존하며 백업
cp -a /important/data /backup/location/

# 여러 파일을 패턴으로 복사
cp *.txt /backup/

# 최신 파일만 업데이트 복사 (증분 백업)
cp -ru /source/dir /backup/dir
```

### mv - 파일 및 디렉토리 이동/이름 변경

파일이나 디렉토리를 이동하거나 이름을 변경하는 명령어입니다. Move의 약자입니다.

**주요 옵션**
- `-i` : 덮어쓰기 전 확인
- `-f` : 강제 이동 (확인 없이 덮어쓰기)
- `-u` : 최신 파일만 이동

**예시**
```bash
# 파일 이름 변경
mv old_name.txt new_name.txt

# 파일 이동
mv file.txt /target/directory/

# 디렉토리 이동 및 이름 변경
mv old_dir_name new_dir_name

# 여러 파일을 디렉토리로 이동
mv file1.txt file2.txt /target/

# 덮어쓰기 전 확인
mv -i source.txt destination.txt
```

**실무 조합 예시**
```bash
# 여러 파일을 한번에 이동 (확인 포함)
mv -i *.txt /backup/

# 최신 파일만 업데이트 이동
mv -u /source/*.log /archive/

# 패턴 매칭으로 대량 이동
mv backup_* /old_backups/
```

### rm - 파일 및 디렉토리 삭제

파일이나 디렉토리를 삭제하는 명령어입니다. Remove의 약자입니다. **주의**: 리눅스는 휴지통이 없어 삭제 시 복구가 어렵습니다.

**주요 옵션**
- `-r` 또는 `-R` : 디렉토리 재귀 삭제
- `-i` : 삭제 전 확인
- `-f` : 강제 삭제 (확인 없이, 매우 위험!)
- `-I` : 3개 이상 파일 삭제 시 한 번만 확인

**예시**
```bash
# 파일 삭제
rm file.txt

# 여러 파일 삭제
rm file1.txt file2.txt file3.txt

# 삭제 전 확인
rm -i important.txt

# 디렉토리 삭제 (재귀)
rm -r directory/

# 패턴으로 삭제
rm *.log
```

**실무 조합 예시**
```bash
# 확인하며 디렉토리 재귀 삭제
rm -ri old_project/

# 3개 이상 파일 삭제 시 한 번만 확인
rm -I *.bak

# 강제 재귀 삭제 (매우 주의! 복구 불가)
rm -rf temp_directory/

# 특정 패턴 파일 안전하게 삭제
rm -i backup_*
```

### find - 파일 검색

파일 시스템에서 조건에 맞는 파일을 검색하는 강력한 명령어입니다.

**주요 옵션**
- `-name` : 파일 이름으로 검색 (대소문자 구분)
- `-iname` : 파일 이름으로 검색 (대소문자 구분 안 함)
- `-type` : 파일 타입 (f=파일, d=디렉토리, l=심볼릭링크)
- `-size` : 파일 크기 (+100M=100MB 이상, -1k=1KB 미만)
- `-mtime` : 수정 시간 (-7=최근 7일, +30=30일 이전)
- `-user` : 특정 사용자 소유 파일
- `-perm` : 특정 권한을 가진 파일
- `-exec` : 검색 결과에 명령어 실행
- `-delete` : 검색된 파일 삭제
- `-maxdepth` : 검색 깊이 제한
- `-empty` : 빈 파일/디렉토리 검색

**예시**
```bash
# 현재 디렉토리에서 파일명으로 찾기
find . -name "test.txt"

# 대소문자 구분 없이 .log 파일 찾기
find /var/log -iname "*.log"

# 100MB 이상 파일 찾기
find . -type f -size +100M

# 최근 7일 이내 수정된 파일
find . -type f -mtime -7

# 특정 권한(777) 파일 찾기
find . -type f -perm 0777

# 검색 결과 삭제하기
find . -name "*.tmp" -exec rm {} \;

# 검색 결과 직접 삭제
find . -name "*.bak" -delete

# 현재 디렉토리만 검색 (하위 제외)
find . -maxdepth 1 -name "*.txt"

# 빈 파일 찾기
find . -type f -empty
```

**실무 조합 예시**
```bash
# 7일 이상 된 로그 파일을 찾아서 압축
find /var/log -type f -name "*.log" -mtime +7 -exec gzip {} \;

# 용량 큰 파일 찾기 (100MB 이상, 크기 표시)
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# 특정 확장자 파일을 다른 디렉토리로 이동
find . -type f -name "*.pdf" -exec mv {} /backup/pdfs/ \;

# 빈 디렉토리 일괄 삭제
find . -type d -empty -delete

# 최근 수정된 설정 파일 찾기 (24시간 이내, 권한 표시)
find /etc -name "*.conf" -mtime -1 -ls

# 특정 디렉토리 제외하고 검색
find . -path "./node_modules" -prune -o -name "*.js" -print

# 소유자 없는 파일 찾기 (보안 점검)
find / -nouser -o -nogroup

# 대용량 파일 Top 10 찾기
find . -type f -exec du -h {} \; | sort -rh | head -n 10

# 특정 파일보다 최신 파일 찾기
find . -type f -newer reference.txt

# SUID 비트가 설정된 파일 찾기 (보안 감사)
find / -type f -perm -4000 -ls 2>/dev/null

# 여러 조건 조합 (5MB 이상, 최근 30일, .log 파일)
find /var -type f -name "*.log" -size +5M -mtime -30 -exec ls -lh {} \;
```

### cat - 파일 내용 출력

파일의 내용을 화면에 출력하는 명령어입니다. Concatenate의 약자로 파일 연결 기능도 있습니다.

**주요 옵션**
- `-n` : 모든 줄에 줄 번호 표시
- `-b` : 비어있지 않은 줄에만 줄 번호 표시

**예시**
```bash
# 파일 내용 출력
cat file.txt

# 여러 파일 내용 연결해서 출력
cat file1.txt file2.txt

# 줄 번호와 함께 출력
cat -n file.txt

# 여러 파일 합치기
cat file1.txt file2.txt > combined.txt
```

**실무 조합 예시**
```bash
# 여러 로그 파일을 하나로 합치기
cat /var/log/app/*.log > merged.log

# 파일 내용을 다른 명령어로 전달
cat data.txt | grep "error"

# 설정 파일 백업하며 확인
cat /etc/hosts | tee /backup/hosts.bak
```

### head - 파일 앞부분 출력

파일의 처음 부분을 출력하는 명령어입니다. 기본적으로 10줄을 출력합니다.

**주요 옵션**
- `-n` : 출력할 줄 수 지정 (기본값 10)

**예시**
```bash
# 처음 10줄 출력 (기본)
head file.txt

# 처음 20줄 출력
head -n 20 file.txt
head -20 file.txt

# 여러 파일의 처음 부분
head file1.txt file2.txt
```

**실무 조합 예시**
```bash
# 로그 파일의 첫 50줄 확인
head -n 50 /var/log/syslog

# CSV 파일의 헤더와 첫 몇 행 확인
head -n 5 data.csv

# 파이프와 함께 사용
ps aux | head -n 10
```

### tail - 파일 뒷부분 출력

파일의 마지막 부분을 출력하는 명령어입니다. 로그 파일 모니터링에 매우 유용합니다.

**주요 옵션**
- `-n` : 출력할 줄 수 지정 (기본값 10)
- `-f` : 파일을 계속 모니터링하며 추가되는 내용 실시간 출력

**예시**
```bash
# 마지막 10줄 출력 (기본)
tail file.txt

# 마지막 20줄 출력
tail -n 20 file.txt

# 실시간 로그 모니터링
tail -f /var/log/syslog

# 여러 파일 동시 모니터링
tail -f /var/log/*.log
```

**실무 조합 예시**
```bash
# 실시간 로그 모니터링 (특정 패턴 필터링)
tail -f /var/log/apache2/access.log | grep "404"

# 여러 로그 파일 동시 모니터링
tail -f /var/log/{syslog,auth.log,kern.log}

# 애플리케이션 로그 실시간 확인 (색상 강조)
tail -f /var/log/app.log | grep --color "ERROR"

# 최근 100줄의 에러만 확인
tail -n 100 /var/log/syslog | grep -i error
```

### wc - 단어, 줄, 바이트 수 세기

파일의 줄 수, 단어 수, 바이트 수를 세는 명령어입니다. Word Count의 약자입니다.

**주요 옵션**
- `-l` : 줄 수만 출력
- `-w` : 단어 수만 출력
- `-c` : 바이트 수만 출력

**예시**
```bash
# 줄, 단어, 바이트 수 모두 출력
wc file.txt

# 줄 수만 출력
wc -l file.txt

# 단어 수만 출력
wc -w file.txt
```

**실무 조합 예시**
```bash
# 로그 파일의 에러 개수 세기
grep "ERROR" /var/log/app.log | wc -l

# 디렉토리 내 파일 개수
ls | wc -l

# 코드 라인 수 계산
find . -name "*.py" -exec cat {} \; | wc -l
```

---

## 주요 개념 요약표

| 개념 | 설명 | 주요 명령어 |
|------|------|------------|
| **커널** | 하드웨어를 직접 제어하는 OS 핵심 | - |
| **쉘** | 사용자와 커널 간 인터페이스 | bash, zsh, fish |
| **절대 경로** | `/`부터 시작하는 전체 경로 | `/home/user/file.txt` |
| **상대 경로** | 현재 위치 기준 경로 | `./file.txt`, `../dir` |
| **디렉토리 탐색** | 디렉토리 이동 및 확인 | pwd, cd, ls |
| **파일 생성** | 새 파일/디렉토리 생성 | touch, mkdir |
| **파일 복사** | 파일 및 디렉토리 복사 | cp, cp -r |
| **파일 이동** | 파일 이동 및 이름 변경 | mv |
| **파일 삭제** | 파일 및 디렉토리 삭제 | rm, rm -r |
| **파일 검색** | 조건으로 파일 찾기 | find |
| **파일 내용** | 파일 내용 출력 및 확인 | cat, head, tail |
| **통계** | 파일 정보 통계 | wc |
| **실시간 모니터링** | 로그 파일 실시간 추적 | tail -f |

---