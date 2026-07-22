---
title: "Burp Suite: 타겟 스코프 설정과 사이트맵 (Target 탭)"
excerpt: " Burp Suite Target 탭의 실전 활용법 가이드"
categories: ['burpsuite']
published: true
date: 2026-06-25
tags: [burpsuite, target, scope, sitemap, 모의해킹, 웹해킹]
---

이번 포스팅에서는  모의해킹 진단의 가장 중요한 첫 단추인 **Target 탭**을 다룬다.

이전 포스팅에서 설정창(Settings)을 튜닝하여 기본기를 다졌다면, 이제는 본격적으로 웹 트래픽을 가로채고 타겟 범위를 설정할 준비를 할 차례이다. (참고로 Dashboard 탭의 자동화 스캐너 기능은 실무 컨설팅에서 서버 다운이나 DB 오염 위험으로 인해 거의 사용하지 않으므로 생략한다.)

단순한 매뉴얼 번역이 아닌, 모의해킹 실무에서 **Target 탭을 어떻게 세팅해야 쓰레기 패킷을 완벽히 걸러낼 수 있는지, 실무 꿀팁과 주의할 점**을 중심으로 파헤쳐 본다.

> **[Burp Suite 실무 가이드 메인 탭 시리즈]**
> 1. 타겟 스코프 설정과 사이트맵 (Target 탭) - *현재 글*
> 2. 웹 트래픽 제어의 핵심 (Proxy 탭)
> 3. 반복 퍼징 공격 자동화 (Intruder 탭)
> 4. 수동 점검과 데이터 가공 (Repeater & Decoder 탭)
> 5. 실무 효율을 높이는 부가 기능 (Extensions, Logger 등)

---
## 1. Target (타겟 스코프 및 사이트맵)

모의해킹을 시작할 때 **가장 먼저 세팅해야 하는 핵심 탭**이다. 내가 진단할 타겟 도메인(Scope)을 명확히 설정해두지 않으면, 구글, 네이버, 카카오톡 등 내 PC 백그라운드에서 발생하는 온갖 쓰레기 패킷이 섞여 들어와 정작 중요한 타겟의 취약점을 분석하기가 매우 힘들어진다.

### 1.1. Site map (사이트맵 구조도)

![Target - Site map](../../images/2026-06-25-Burp_Target/target_sitemap.png)

프록시를 거쳐 지나간 트래픽이나 스캐너가 수집한 모든 URL을 좌측에는 도메인 및 디렉터리 트리(Tree) 구조로, 우측에는 상세한 요청/응답(Request/Response) 내용과 인스펙터(Inspector)로 정리해서 보여준다.
- **URL view / Crawl paths view**: 도메인 계층 구조로 보거나, 크롤러가 타고 들어간 링크 경로 순서대로 볼 수 있다.
- **Site map filter (필터링 바)**: 화면 상단의 텍스트(Hiding CSS...)가 적힌 회색 바를 클릭하면 상세 필터 설정창이 열린다. 
- **📌 [실무 포인트] (필터링과 하이라이트)**: 
  1. **필터링**: 실무에서는 폰트, 이미지, CSS 같은 정적 리소스(Static resources)를 분석할 이유가 없다. 필터 창을 열어 `Hide CSS, image and general binary content` 옵션을 켜두고, 타겟 외의 쓰레기 패킷을 가리기 위해 `Show only in-scope items`를 체크해 두는 것이 진단의 기본 세팅이다.
  2. **하이라이트**: 초기 정찰(Reconnaissance) 단계에서 사이트맵을 펼쳐보면, 실수로 열어둔 관리자 페이지(`/admin`)나 테스트용 백업 파일(`.bak`) 등을 한눈에 파악할 수 있는 보물창고가 된다. 진단을 진행하며 중요 항목은 우클릭 후 색깔(Highlight)을 칠해두거나, 다 본 URL은 줄을 그어(Mark as done) 진척도를 관리하면 엑셀에 따로 정리할 필요가 없다.

### 1.2. Scope (타겟 범위 설정)

![Target - Scope](../../images/2026-06-25-Burp_Target/target_scope.png)

이곳에서 내가 공격할(점검할) 대상의 URL 범위를 명확히 지정한다. 여기에 등록된 도메인만 `Proxy history`나 `Intruder` 등 다른 탭에서 필터링하여 띄울 수 있다.
- **Use advanced scope control**: 기본 설정 방식 대신 정규 표현식(Regex)을 이용해 프로토콜, 호스트, 포트, 파일 경로를 상세히 컨트롤하고 싶을 때 체크한다.
- **Include in scope**: 모의해킹 대상으로 **허가받은 도메인이나 IP**를 명시적으로 추가(`Add`)한다. (보통은 Proxy 히스토리에서 타겟 URL을 우클릭한 뒤 `Add to scope`를 누르면 이곳에 자동으로 들어온다.)
- **Exclude from scope**: 타겟 도메인 내에 속해 있더라도, **절대 건드리면 안 되는 경로**(예: 로그아웃 처리 URL `/logout`, 세션 만료 페이지, 타 부서 민감 데이터 경로 등)를 등록해 둔다. 여기에 등록된 경로는 실수로 공격 페이로드를 날리거나 스캔을 돌리는 대참사를 시스템적으로 방지해 준다.
- **📌 [실무 포인트]**: 모의해킹 전 이 Scope 설정을 명확히 하는 것은 **법적 책임**과도 직결된다. 타겟 스코프에 속하지 않은 타사 서버에 스캔을 돌리거나 페이로드를 전송하면 불법 해킹이 될 수 있으므로 가장 먼저 설정하고, 수시로 이 탭을 확인하여 엄격하게 관리해야 한다.

### 1.3. Issues (취약점 정의 및 가이드북)

![Target - Issues](../../images/2026-06-25-Burp_Target/target_issues.png)

이전 포스팅에서 언급한 Dashboard의 Issues 탭(스캔 결과)과 헷갈릴 수 있는데, 여기 Target 탭 안에 있는 Issues는 스캔 결과가 아니라 Burp Scanner가 탐지할 수 있는 **모든 취약점의 '사전(Dictionary)'**이다. 
- **Issue definitions**: OS Command Injection, SQL Injection, XSS 등 수백 가지 취약점의 리스트가 나열되어 있다.
- **Description & Remediation**: 각 취약점이 정확히 무엇인지(설명), 시스템에 어떤 영향을 미치는지, 그리고 **어떻게 조치해야 하는지(방어 대책)** 상세히 영문으로 적혀 있다.
- **📌 [실무 포인트]**: 모의해킹 결과 보고서를 쓸 때 '취약점 설명'이나 '대응 방안' 멘트를 작성하기 막막하다면, 여기서 해당 취약점을 찾아 우측의 Description과 Remediation 내용을 참고하여 쓰면 아주 훌륭하고 전문적인 레퍼런스가 된다. (PortSwigger 웹 시큐리티 아카데미 실습 링크까지 제공되어 학습용으로도 최고다.)

---
