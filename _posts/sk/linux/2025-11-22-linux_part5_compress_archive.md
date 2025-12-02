---
title: "리눅스 (5) - 압축 및 아카이브"
excerpt: ".."

categories: linux
typora-root-url: ../../
published: true
date: 2025-11-22
last_modified_at: 2025-11-22
tags: [linux, compress, archive, tar, gzip, sk]
---

## 전체 흐름 요약

이 글은 리눅스 학습 시리즈의 다섯 번째 파트로, 파일 압축과 아카이브 관리를 다룹니다. 리눅스에서 파일을 압축하고 여러 파일을 하나로 묶는 방법, 그리고 압축과 아카이브를 동시에 수행하는 실무 기법들을 학습합니다. 각 명령어는 개별 옵션 설명과 함께 실무에서 자주 사용하는 조합 예시를 포함하여 즉시 활용할 수 있도록 구성했습니다.

---

## 압축과 아카이브의 차이

**압축 (Compression)**
- 파일의 크기를 줄이는 것
- 하나의 파일만 처리
- gzip, bzip2, xz 등

**아카이브 (Archive)**
- 여러 파일을 하나로 묶는 것
- 크기는 줄어들지 않음
- tar

**일반적 사용**
- tar로 여러 파일을 묶은 후 → 압축 수행
- tar + gzip = .tar.gz (또는 .tgz)
- tar + bzip2 = .tar.bz2 (또는 .tbz2)
- tar + xz = .tar.xz

```mermaid
graph LR
    A[여러 파일] --> B[tar로 묶기<br/>아카이브]
    B --> C[압축<br/>gzip/bzip2/xz]
    C --> D[최종 파일<br/>.tar.gz]
```

---

## 압축 명령어

### gzip - 파일 압축

GNU zip의 약자로, 가장 일반적으로 사용되는 압축 도구입니다.

**특징**
- 압축 속도가 빠름
- 압축률은 중간 정도
- 확장자: `.gz`
- 원본 파일은 삭제됨

**주요 옵션**
- `-d` : 압축 해제 (decompress)
- `-k` : 원본 파일 유지 (keep)
- `-r` : 디렉토리 재귀 압축
- `-v` : 압축 과정 표시 (verbose)
- `-1 ~ -9` : 압축 레벨 (1=빠름, 9=높은 압축률)

**예시**
```bash
# 파일 압축
gzip file.txt
# 결과: file.txt.gz (원본 삭제됨)

# 압축 해제
gunzip file.txt.gz
# 또는
gzip -d file.txt.gz

# 원본 파일 유지하며 압축
gzip -k file.txt

# 압축률 지정 (9 = 최고 압축)
gzip -9 file.txt

# 압축 과정 표시
gzip -v file.txt
```

**실무 조합 예시**
```bash
# 여러 파일 동시 압축
gzip file1.txt file2.txt file3.txt

# 디렉토리 내 모든 파일 압축
gzip -r directory/

# 원본 유지하며 최대 압축
gzip -9k important.txt

# 압축률 확인
gzip -l file.txt.gz
```

### bzip2 - 고압축률 파일 압축

block-sorting file compressor의 약자로, gzip보다 높은 압축률을 제공합니다.

**특징**
- 압축률이 높음 (파일 크기를 더 많이 줄임)
- 압축/해제 속도가 느림
- 확장자: `.bz2`
- 대용량 파일에 유리

**주요 옵션**
- `-d` : 압축 해제
- `-k` : 원본 파일 유지
- `-v` : 자세한 정보 출력
- `-f` : 동일 파일명 있어도 강제로 압축 해제
- `-1 ~ -9` : 압축 레벨

**예시**
```bash
# 파일 압축
bzip2 file.txt
# 결과: file.txt.bz2

# 압축 해제
bunzip2 file.txt.bz2
# 또는
bzip2 -d file.txt.bz2

# 원본 유지하며 압축
bzip2 -k file.txt

# 최대 압축
bzip2 -9 largefile.txt
```

**실무 조합 예시**
```bash
# 로그 파일 고압축 (용량 절약)
bzip2 -9 /var/log/old_logs/*.log

# 백업 파일 압축 (원본 유지)
bzip2 -k backup.sql

# 강제 압축 해제
bzip2 -df archive.bz2
```

### xz - 최고 압축률 파일 압축

LZMA/LZMA2 알고리즘을 사용하는 최신 압축 도구입니다.

**특징**
- 가장 높은 압축률
- 가장 느린 속도
- 확장자: `.xz`
- 최신 리눅스 배포판에서 선호

**주요 옵션**
- `-d` : 압축 해제
- `-k` : 원본 파일 유지
- `-v` : 자세한 정보 출력
- `-z` : 강제 압축
- `-0 ~ -9` : 압축 레벨

**예시**
```bash
# 파일 압축
xz file.txt
# 결과: file.txt.xz

# 압축 해제
unxz file.txt.xz
# 또는
xz -d file.txt.xz

# 원본 유지하며 최대 압축
xz -9k file.txt
```

**실무 조합 예시**
```bash
# 소스 코드 배포용 압축
xz -9 source_code.tar

# 데이터베이스 덤프 압축
xz -k database_dump.sql

# 압축 해제
unxz archive.tar.xz
```

### zip - 윈도우 호환 압축

윈도우와 호환되는 압축 형식입니다.

**특징**
- 윈도우에서 기본 지원
- 여러 파일을 하나로 압축 가능
- 확장자: `.zip`
- 원본 파일 유지

**주요 옵션**
- `-r` : 디렉토리 재귀 압축 (recursive)
- `-d` : 압축 파일에서 파일 삭제
- `-v` : 자세한 정보 출력
- `-e` : 암호화
- `-q` : 조용한 모드

**예시**
```bash
# 파일 압축
zip archive.zip file.txt

# 디렉토리 압축 (재귀)
zip -r archive.zip directory/

# 여러 파일 압축
zip archive.zip file1.txt file2.txt file3.txt

# 압축 해제
unzip archive.zip

# 특정 디렉토리에 압축 해제
unzip archive.zip -d /target/directory/

# 압축 파일 내용 확인
unzip -l archive.zip

# 암호화 압축
zip -e secure.zip secret.txt
```

**실무 조합 예시**
```bash
# 프로젝트 전체 압축
zip -r project.zip /path/to/project/

# 로그 제외하고 압축
zip -r archive.zip directory/ -x "*.log"

# 압축 파일 내용 확인 후 해제
unzip -l archive.zip
unzip archive.zip

# 특정 파일만 압축 해제
unzip archive.zip file1.txt
```

---

## tar - 아카이브 (파일 묶기)

Tape ARchive의 약자로, 여러 파일을 하나로 묶는 명령어입니다.

**특징**
- 여러 파일/디렉토리를 하나로 묶음
- 압축 기능은 없음 (압축 도구와 함께 사용)
- 권한과 속성 보존 가능
- 백업에 가장 많이 사용

### tar 주요 옵션

**동작 옵션 (반드시 하나 선택)**
- `c` : create, 새로 묶기
- `x` : extract, 묶음 풀기
- `t` : list, 묶음 파일 내용 확인

**일반 옵션**
- `v` : verbose, 묶거나 푸는 과정 표시
- `f` : file, 묶음 파일명 지정 (필수!)
- `p` : permission, 원본 파일 권한 유지
- `C` : change directory, 압축 해제 위치 지정
- `r` : 기존 tar 파일에 새 파일 추가

**압축 옵션 (압축 도구 결합)**
- `z` : gzip 사용 (`.tar.gz` 또는 `.tgz`)
- `j` : bzip2 사용 (`.tar.bz2` 또는 `.tbz2`)
- `J` : xz 사용 (`.tar.xz`)

### tar 기본 사용

**예시**
```bash
# 파일 묶기 (압축 없음)
tar cvf archive.tar file1 file2 file3

# 디렉토리 묶기
tar cvf archive.tar directory/

# 묶음 파일 내용 확인
tar tvf archive.tar

# 묶음 풀기
tar xvf archive.tar

# 특정 디렉토리에 풀기
tar xvf archive.tar -C /target/directory/

# 특정 파일만 추출
tar xvf archive.tar file1.txt

# 기존 tar에 파일 추가
tar rvf archive.tar newfile.txt
```

### tar + 압축 (가장 많이 사용)

**tar.gz (gzip 압축)**
```bash
# 압축하며 묶기
tar czvf archive.tar.gz directory/

# 압축 풀기
tar xzvf archive.tar.gz

# 내용 확인
tar tzvf archive.tar.gz
```

**tar.bz2 (bzip2 압축)**
```bash
# 압축하며 묶기
tar cjvf archive.tar.bz2 directory/

# 압축 풀기
tar xjvf archive.tar.bz2

# 내용 확인
tar tjvf archive.tar.bz2
```

**tar.xz (xz 압축)**
```bash
# 압축하며 묶기
tar cJvf archive.tar.xz directory/

# 압축 풀기
tar xJvf archive.tar.xz

# 내용 확인
tar tJvf archive.tar.xz
```

### 실무 조합 예시

```bash
# 전체 웹사이트 백업
tar czvf website_backup_$(date +%Y%m%d).tar.gz /var/www/html/

# 로그 제외하고 백업
tar czvf backup.tar.gz --exclude='*.log' /data/

# 권한 보존하며 백업
tar cpzvf backup.tar.gz /important/data/

# 특정 디렉토리에 복원
tar xzvf backup.tar.gz -C /restore/location/

# 증분 백업 (변경된 파일만)
tar czvf incremental.tar.gz --listed-incremental=/tmp/backup.snar /data/

# 백업 파일 내용 확인 후 복원
tar tzvf backup.tar.gz
tar xzvf backup.tar.gz

# 여러 디렉토리 한번에 백업
tar czvf multi_backup.tar.gz /dir1 /dir2 /dir3

# 심볼릭 링크 보존하며 백업
tar chzvf backup.tar.gz /path/with/links/

# 특정 파일만 추출
tar xzvf backup.tar.gz path/to/specific/file.txt
```

---

## 압축 도구 비교

| 도구 | 확장자 | 압축률 | 속도 | 용도 |
|------|--------|--------|------|------|
| **gzip** | .gz | 중간 | 빠름 | 일반적 용도 |
| **bzip2** | .bz2 | 높음 | 느림 | 고압축 필요 시 |
| **xz** | .xz | 최고 | 가장 느림 | 최대 압축 필요 시 |
| **zip** | .zip | 낮음 | 빠름 | 윈도우 호환 |

**선택 가이드**
- **일반적인 백업**: `tar.gz` (빠르고 충분한 압축률)
- **장기 보관**: `tar.xz` (최대 압축으로 공간 절약)
- **빠른 압축/해제**: `tar.gz` 또는 `zip`
- **윈도우 공유**: `zip`

---

## 소스 파일 설치 예제

리눅스에서 소스 코드를 다운로드하고 설치하는 전체 과정입니다. (Python 3.8.4 설치 예제)

### 1. 필요한 패키지 설치
```bash
# 개발 도구 설치
yum -y install wget gcc openssl-devel bzip2-devel libffi-devel zlib-devel
```

### 2. 소스 파일 다운로드
```bash
# wget으로 tar.xz 파일 다운로드
wget https://www.python.org/ftp/python/3.8.4/Python-3.8.4.tar.xz
```

### 3. 압축 해제
```bash
# tar + xz 압축 해제
tar xvfJ Python-3.8.4.tar.xz
# 또는
tar xJvf Python-3.8.4.tar.xz
```

### 4. 환경 설정 및 컴파일
```bash
# 디렉토리 이동
cd Python-3.8.4

# Makefile 생성 (환경 설정)
./configure --enable-optimizations

# 컴파일
make

# 시스템에 설치
make install

# 또는 한번에
make && make install
```

### 5. 설치 확인
```bash
# Python 버전 확인
python3.8 --version

# 설치 위치 확인
which python3.8
```

---

## 주요 개념 요약표

| 명령어 | 용도 | 확장자 | 특징 |
|--------|------|--------|------|
| **gzip** | 빠른 압축 | .gz | 가장 일반적, 속도 우선 |
| **bzip2** | 고압축 | .bz2 | 압축률 우수, 속도 느림 |
| **xz** | 최고압축 | .xz | 최고 압축률, 가장 느림 |
| **zip** | 윈도우 호환 | .zip | 크로스 플랫폼 |
| **tar** | 아카이브 | .tar | 파일 묶기 |
| **tar + gzip** | 압축 백업 | .tar.gz, .tgz | 가장 많이 사용 |
| **tar + bzip2** | 고압축 백업 | .tar.bz2, .tbz2 | 고압축 백업 |
| **tar + xz** | 최고압축 백업 | .tar.xz | 최신 배포판 선호 |

---