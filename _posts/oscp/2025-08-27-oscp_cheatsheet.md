---
title:  "OSCP cheat sheet"
excerpt: "cheat sheet"

categories: oscp
tags:
  - [oscp, cheatsheet]

typora-root-url: ../../
 
date: 2025-08-27
last_modified_at: 2025-08-27
---

## Enumeration (정보 수집)
### 1. 네트워크 스캔 및 포트 스캐닝
#### Nmap




### 2. 서비스별 정보 수집
#### 22 - SSH



#### FTP





#### SMB





#### SNMP




#### RPC




#### SMTP







### 3. 웹 어플리케이션 스캐닝
#### 디렉토리 및 파일 탐색 (gobuster, dirb, wfuzz)




#### 웹 서버 정보 수집 (curl)





#### robots.txt, sitemap.xml




#### 웹 서비스 버전 및 서버 정보 확인





### 4. 사용자 계정 및 인증 관련
####  Finger, enum4linu 등 사용자 및 그룹 정보 조회



#### 기본/취약한 계정 검색 및 크래킹 시도 (hydra, medusa)





### 5. 취약점 탐색 및 익스플로잇 탐색
#### ExploitDB 및 searchsploit 활용








### 6. 기타 정보 수집 방법
#### DNS 정보 조사 (dig, nslookup, host)





#### 메타데이터 추출 (exiftool 등)



### 7. 스크립트 및 자동화 도구
#### linPEAS, enum4linux, snmp-check 등






## Exploitation (공격)
### 1. 익스플로잇 준비 및 식별
#### 취약점 분석을 위해 정보 확인 방법



#### Exploit-DB, searchsploit 활용법



#### PoC 구하기 및 수정




### 2. 원격 코드 실행 (RCE)
#### 리버스 쉘 제작 및 실행



#### Metasploit 모듈 사용법






### 3. 서비스별 익스플로잇
#### FTP


#### SSH


#### Web




### 4. 패드워드 크래킹 및 인증 우회
#### 브루트 포싱



#### 인증 우회 취약점 페이로드?




### 5. 커맨드 인젝션 및 스크립트 삽입 공격
#### 명령어 삽입 벡터 찾기 및 이용


#### URL 인코딩과 PowerShell / bash 스크립트 삽입 방법



#### 웹쉘 업로드 및 사용법




### 6. 악성 페이로드 생성 및 전송
#### msfvenom 페이로드 생성 (포맷별 설명 포함)



#### 쉘코드 인코딩 및 우회 기법



#### 타겟 서버로 페이로드 전송 및 실행 방법



### 7. 공격 검증 및 유지
#### 공격 성공 확인 명령어



#### 세션 유지 기법 및 로그 클리어



## Post-Exploitation (후속 공격)

