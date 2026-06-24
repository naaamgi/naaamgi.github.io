---
title: "Burp Suite 실무 활용: Param Miner"
excerpt: "숨겨진 파라미터와 헤더를 자동으로 찾아주는 Param Miner를 활용한 백도어 탐지 및 웹 캐시 포이즈닝"
categories: ['burpsuite']
published: false
date: 2026-06-23
tags: [burpsuite, param miner, 모의해킹, 웹해킹, web cache poisoning]
---

모의해킹 실무를 하다 보면 화면에 노출된 입력값 외에, 개발자가 테스트나 디버깅 목적으로 몰래 만들어둔 파라미터(`?debug=true`, `?admin=1` 등)나 내부 HTTP 헤더(`X-Forwarded-Host` 등)가 보안 결함을 일으키는 경우가 있다.

과거에는 이를 찾기 위해 무조건 **Param Miner**를 돌려 수만 개의 파라미터를 무차별 대입(Brute-force)하곤 했다. 하지만 이 방식은 서버에 막대한 트래픽 과부하를 일으켜 장애(DoS)를 유발할 위험이 매우 크다. 

따라서 최근 실무에서는 파라미터 탐지는 타겟 서버에 트래픽을 주지 않는 **ParamSpider**(웹 아카이브 OSINT)나, 다중 파라미터 병렬 전송에 특화된 **Arjun** 툴로 대체하는 추세다. 

대신 Param Miner는 튼튼한 캐시 서버 환경에서 **웹 캐시 포이즈닝(Web Cache Poisoning)을 유발하는 숨겨진 헤더(Headers)를 찾아내는 용도**로 매우 날카롭게 사용된다.

## 1. Param Miner 란?
PortSwigger의 연구원 Albinowax가 개발한 도구로, 캐시 포이즈닝(Web Cache Poisoning) 취약점을 찾을 때 필수적으로 사용된다. 타겟 패킷에 수만 개의 파라미터와 헤더를 백그라운드에서 던져보고, 서버의 응답이 미세하게 달라지는 것을 캐치하여 숨겨진 입력값을 찾아낸다.

## 2. 기본 세팅 및 사용법
설치는 `BApp Store`에서 **Param Miner**를 검색해 설치하면 끝이다. 

타겟 패킷에서 우클릭 후 `Extensions > Param Miner`를 보면 크게 3가지 핵심 메뉴가 있다.
- **Guess GET/POST parameters**: URL 쿼리나 바디(Body)의 숨겨진 파라미터 탐지
- **Guess headers**: 숨겨진 HTTP 헤더 탐지
- **Guess everything**: 파라미터, 헤더, 쿠키 모두 탐지 (트래픽이 많이 발생하므로 주의)

기본적으로 메뉴를 클릭한 뒤, 설정 창에서 **`Use default wordlist`**가 체크되어 있는지 확인하고 OK를 누르면 백그라운드에서 알아서 공격이 시작된다.

![image-20260623113000101](../../images/2026-06-23-Burp_ParamMiner/image-20260623113000101.png)

## 3. 결과 확인
공격 진행률과 로그는 `Extensions > Installed > Param Miner > Output` 탭에서 확인할 수 있다. 
만약 유의미한 파라미터나 헤더가 발견되면 Burp Suite의 **Dashboard (Target > Issues)**에 아래와 같이 바로 알림이 뜬다.

- `Secret parameter discovered`
- `Unkeyed header found`

## 4. 실무 활용 시나리오

### 4.1. 숨겨진 디버그 파라미터 찾기
특정 API 엔드포인트에서 `Guess parameters`를 돌려 `Secret parameter: debug` 가 발견되었다고 가정해 보자.
원본 요청에 `?debug=true` 또는 `?debug=1`을 임의로 추가해서 전송해 본다. 평소에는 보이지 않던 서버 내부의 SQL 에러 로그나 디버그 정보가 화면에 그대로 출력된다면, 즉시 정보 노출 취약점으로 이어질 수 있다.

### 4.2. 웹 캐시 포이즈닝 (Web Cache Poisoning)
Param Miner를 쓰는 가장 큰 이유다. 타겟 사이트가 Varnish나 Cloudflare 등 웹 캐시 서버를 거치는 구조일 때, `Guess headers`를 돌려본다.

대시보드에 **`Unkeyed header: X-Forwarded-Host`** 가 떴다면 취약할 확률이 매우 높다. 이는 캐시 서버가 식별하지 않는(Unkeyed) 특정 헤더를 백엔드 서버가 받아서 처리하고 있다는 뜻이다.

1. 타겟 패킷에 `X-Forwarded-Host: attacker.com` 헤더를 추가해 전송한다.
2. 서버 응답 소스코드에 `<script src="https://attacker.com/script.js">` 처럼 내 도메인이 박혀서 응답이 오는지 확인한다.
3. 이 악의적인 응답이 캐시 서버에 저장(Cache Hit)되면, 이후 해당 페이지에 접속하는 일반 유저들은 공격자의 스크립트를 다운받아 실행하게 된다. (대규모 XSS)

## 5. 트래픽 제어 및 과부하 방지 팁

Param Miner는 기본적으로 수만 개의 단어를 대입하므로 타겟 서버에 엄청난 트래픽 부하를 줄 수 있다. WAF(웹 방화벽) 차단이나 서버 장애를 피하기 위해 아래 세팅들을 적극 활용해야 한다.

1. **작은 단위의 사전(Wordlist) 사용**
   공격 세팅 창에서 무조건 `Use default wordlist`를 쓰기보다, 상황에 맞춰 범위를 줄이는 것이 좋다.
   - **Use basic wordlist**: 가장 빈도수가 높은 필수 파라미터/헤더만 추려서 공격 속도와 부하를 대폭 줄여준다.
   - **Custom wordlist**: 실무 중 파악된 타겟 시스템 특화 단어(예: 개발사 이름, 사내 용어 등)만 별도의 텍스트 파일로 만들어 대입하면 정확도도 높고 서버 부하도 없다.

2. **불필요한 공격 필터링 옵션**
   - **Skip uncacheable**: 캐시 불가능한 페이지는 건너뛰어 쓸데없는 요청을 줄인다.
   - **Skip uninteresting**: 정적 파일(이미지, CSS 등)처럼 공격 의미가 없는 엔드포인트를 알아서 패스한다.

3. **빠른 중단 (Abort)**
   - 대규모 스캔을 돌렸는데 서버 응답 속도가 현저히 느려졌다면 즉시 `Extensions > Param Miner > Abort`를 눌러 공격을 강제 종료해야 한다.
