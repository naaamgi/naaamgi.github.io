---
title:  "OSINT 심화: 구글 도킹(Google Dorking)과 검색엔진 해킹 완벽 가이드"
excerpt: "구글, 빙(Bing), 트위터 등 검색엔진의 고급 연산자를 활용하여 숨겨진 소스코드, 인증키, 사내 협업툴의 유출 정보를 찾아내는 방법을 실습한다."

categories: [osint, technique]
tags:
  - [osint, google, dorking, redteam, security]

typora-root-url: ../../
 
date: 2026-07-06
last_modified_at: 2026-07-06
---

# 구글 도킹(Google Dorking)

**구글 도킹(Google Dorking)**, 혹은 구글 해킹(Google Hacking)은 구글 검색엔진이 지원하는 '고급 검색 연산자(Advanced Search Operators)'를 활용하여, 일반적인 검색으로는 찾기 힘든 웹 서버의 취약점, 숨겨진 관리자 페이지, 하드코딩된 인증 정보 등을 찾아내는 OSINT 기법이다.

정보 수집 시에는 구글뿐만 아니라 **Bing(빙)** 등 다른 검색엔진을 병행하는 것이 좋다. 구글에서는 필터링되거나 인덱싱되지 않은 정보가 Bing에서는 고스란히 노출되는 경우가 많기 때문이다.

---

## 고급 연산자 요약 사전 (Operator Dictionary)

본격적인 실전 시나리오에 앞서, 실무에서 가장 자주 쓰이는 구글 도킹 핵심 연산자 5가지를 요약한다. 이 연산자들을 자유자재로 조합(AND, OR, -)하여 검색 범위를 좁혀나가는 것이 핵심이다.

| 연산자 | 기능 설명 | 사용 예시 |
|---|---|---|
| **`site:`** | 특정 도메인이나 최상위 도메인(TLD) 내에서만 검색 | `site:example.com`, `site:go.kr` |
| **`intitle:`** | 웹 페이지의 제목(Title) 태그에 특정 키워드가 포함된 결과 검색 | `intitle:"index of"` |
| **`inurl:`** | 웹 페이지의 URL 주소에 특정 키워드가 포함된 결과 검색 | `inurl:admin`, `inurl:login` |
| **`intext:`** | 웹 페이지의 본문 내용에 특정 키워드가 포함된 결과 검색 | `intext:"password"` |
| **`filetype:`** | 특정 파일 확장자를 가진 문서만 필터링하여 검색 | `filetype:pdf`, `filetype:sql` |

---

# 실무 활용 시나리오

모의해킹 실무나 위협 헌팅(Threat Hunting) 시 자주 쓰이는 핵심 검색어 조합들을 카테고리별로 알아본다.

## 1. 소스코드 및 인증키(API) 노출 추적

개발자의 실수로 웹 서버에서 파싱되어야 할 소스코드가 텍스트 형태로 그대로 노출되거나, 소셜 로그인 연동을 위한 API 키가 외부로 유출되는 경우를 찾는다.

### JSP 소스코드 노출 확인
JSP 코드는 서버 단에서 실행되어 사용자에게는 HTML로 보여야 정상이다. 하지만 서버 설정 오류로 JSP 소스코드가 그대로 노출된 페이지를 찾을 수 있다.
```text
site:co.kr | site:go.kr | site:or.kr "<%@ page contentType=\"text/html\""
```
*   **분석**: `site:` 연산자로 국내 도메인을 한정하고, JSP 문서의 헤더 문자열을 검색한다.

### 소셜 로그인 인증 정보 (네이버 연동 등)
서비스에 네이버/카카오 로그인을 연동할 때 사용하는 클라이언트 ID와 시크릿 키(Secret Key)가 하드코딩된 페이지를 찾는다.
```text
"naver_client_id | naver_secret" site:co.kr
```
*   **분석**: 이 키가 유출되면 공격자는 해당 서비스의 권한을 악용하여 인증 과정을 우회하거나 사용자 데이터를 탈취할 수 있다.

---

## 2. 써드파티(3rd Party) 인프라 및 협업 툴 노출 추적

타겟 기업 자체 서버가 아니더라도, 직원들이 사용하는 클라우드 서비스나 협업 툴의 설정 실수로 인해 치명적인 내부 문서가 노출되기도 한다.

### Firebase(파이어베이스) DB 유출
앱 개발에 많이 쓰이는 Firebase는 데이터베이스 규칙 설정을 잘못하면 누구나 DB를 읽고 쓸 수 있다. 구글 검색보다 Bing에서 더 잘 잡히는 경우가 많다.
```text
site:firebaseio.com "타겟기업명"
```

### Trello(트렐로) 및 Jira(지라) 노출
사내 업무 칸반보드나 이슈 트래커를 '전체 공개(Public)'로 설정해 둔 경우, 로그인 없이도 업무 내용을 훤히 들여다볼 수 있다.
```text
site:trello.com "타겟기업명"
inurl:jira AND intitle:login site:co.kr
```

### Zoom(줌) 화상회의 패스워드 노출
게시판이나 블로그에 줌 화상회의 초대 링크와 패스워드를 평문으로 올려둔 사례를 찾는다.
```text
inurl:zoom.us/j intext:pwd
```

---

## 3. 개인정보 및 다크웹 유출 정보 추적

### 익명 사이트 (Pastebin) 모니터링
해커들은 탈취한 계정 정보나 데이터베이스 덤프를 Pastebin 같은 익명 텍스트 공유 사이트에 자주 올린다. 타겟 기업의 이메일이나 도메인이 포함된 유출 내역이 있는지 확인한다.
```text
site:pastebin.com "target.co.kr"
```

### 트위터(X) 해시태그를 이용한 위협 헌팅
트위터는 최신 취약점(1-Day, 0-Day)이나 데이터 유출 사고가 가장 빨리 공유되는 플랫폼이다. 아래 해시태그를 검색하면 실시간 사이버 위협 동향을 파악할 수 있다.
*   `#0day`, `#RCE`, `#Exploit`, `#CyberSecurity`
*   `#DataBreach`, `#CyberBreach`, `#Leaked` (데이터 유출 사고 전용)

---

## 4. 인프라 및 파일 시스템 노출

### 구글 스토리지 (GCP Cloud Storage) 노출
AWS S3 버킷과 마찬가지로 퍼블릭하게 열린 구글 클라우드 스토리지를 찾는다.
```text
site:*.googleapis.com -storage "타겟기업명"
```

### 디렉토리 인덱싱 (Directory Listing) 취약점
웹 서버의 기본 페이지(index.html 등)가 없어서 폴더 내 파일 목록이 전부 보이는 취약점이다. 백업 파일(`*.bak`, `*.sql`, `*.zip`)을 통째로 다운로드할 수 있는 위험이 있다.
```text
intitle:"index of" "백업" | "backup" site:co.kr
intitle:"index of" "admin" | "config" 
```

---

## 더 알아보기: GHDB (Google Hacking Database)

구글 도킹 기술의 가장 거대한 패턴 저장소는 바로 Exploit Database에서 운영하는 **[GHDB(Google Hacking Database)](https://www.exploit-db.com/google-hacking-database)**이다.
전 세계의 보안 전문가들이 발견한 수천 개의 강력한 Dork 패턴(취약한 서버, 패스워드 파일, 주요 디렉토리 노출 등)이 카테고리별로 매일 업데이트되고 있다. 본 가이드의 기본기를 익힌 후 GHDB를 참고하면 무궁무진한 공격 표면 탐색 아이디어를 얻을 수 있다.

---
> [!CAUTION]
> **모의해킹 윤리 및 법적 책임**
> 구글 도킹을 통해 취약한 페이지를 발견하는 것 자체는 검색엔진의 인덱싱 결과를 보는 것이므로 불법이 아니다. 하지만, **발견된 민감한 파일이나 인증키를 이용해 실제로 대상 시스템에 로그인(접근)하거나 데이터를 열람/다운로드하는 행위는 명백한 정보통신망법 위반(해킹)**이다. 반드시 사전 인가된 대상에게만 정보 수집 용도로 제한하여 사용해야 한다.
