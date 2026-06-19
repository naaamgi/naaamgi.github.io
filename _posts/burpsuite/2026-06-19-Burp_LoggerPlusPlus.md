---
title: "Burp Suite 실무 활용: Logger++"
excerpt: "수만 개의 트래픽 중 내가 원하는 정보만 쏙쏙 뽑아내는 Logger++의 정규표현식 필터링"
categories: ['burpsuite']
published: true
date: 2026-06-19
tags: [burpsuite, logger++, 모의해킹, 웹해킹]
---

웹 모의해킹 실무를 하다 보면 수백, 수천 개의 트래픽이 쌓인다. Burp Suite 기본 HTTP history 기능만으로는 내가 원하는 특정 파라미터나 민감 정보(이메일, 토큰 등)가 포함된 패킷을 찾기에는 한계가 있다.

이때 **Logger++** 플러그인을 활용하면 아주 정교한 필터링과 정규표현식(Regex)을 이용해 원하는 트래픽만 정확히 찾아낼 수 있다. 이번 글에서는 Logger++의 설치부터 실무에서 바로 써먹는 필터링 기법까지 정리해 보았다.

## 1. Logger++ 란?
Logger++는 Burp Suite의 모든 도구(Proxy, Repeater, Intruder, Scanner 등)에서 발생하는 트래픽을 한곳에 모아주고, 아주 강력한 다중 필터링을 제공하는 로깅 확장 도구다. 
기본 로거와 다르게 **정규표현식(Regex)**과 **논리 연산자(AND, OR)**를 완벽하게 지원하는 것이 핵심이다.

## 2. 기본 세팅 및 화면 구성
설치는 `BApp Store`에서 **Logger++**를 검색해 설치하면 끝이다. 
탭을 열어보면 상단에 필터링 바(Filter bar)가 있고, 하단에 트래픽 로그가 표시된다.

![image-20260619134922163](../../images/2026-06-19-Burp_LoggerPlusPlus/image-20260619134922163.png)

## 3. 필터링 구문(Filter Syntax)
Logger++ 필터링의 핵심은 문법이다. **대소문자**를 가리며 기본적으로 `속성 연산자 "값"` 형태로 작성한다.

### 3.1. 기본 연산자와 속성
- **속성:** `Request.Headers`, `Request.Body`, `Response.Headers`, `Response.Body`
- **연산자:** `==` (일치), `CONTAINS` (포함), `MATCHES` (정규표현식 매칭)
- **논리 연산:** `AND` (또는 `&&`), `OR` (또는 `||`)

### 3.2. 필터링 모음
패킷을 분석할 때 복붙해서 쓰기 좋은 필터링 구문들이다.

**1) 특정 API 엔드포인트만 모아보기**

```text
Request.Headers CONTAINS "POST /api/" OR Request.Headers CONTAINS "PUT /api/"
```
GET 요청은 버리고, 중요한 데이터가 수정/생성되는 POST와 PUT API만 걸러낼 때 유용하다.

**2) JSON 응답만 보기**

```text
Response.Headers CONTAINS "Content-Type: application/json"
```

**3) 이메일 주소가 응답값에 노출된 패킷 찾기 (정규표현식 활용)**

```text
Response.Body MATCHES /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/
```
이 구문 하나면 수만 개의 트래픽 중, 타인의 이메일이 응답값에 평문으로 새고 있는 취약점을 순식간에 찾아낼 수 있다.

**4) CORS 설정 결함 찾기**

```text
Response.Headers MATCHES /Access-Control-Allow-Origin: .*/
```

## 4. '딸깍'으로 필터링하기 (Filter Library)
실무 모의해킹에서 Logger++를 쓰는 가장 큰 이유 중 하나가 바로 이 `Filter Library` 탭이다. 매번 복잡한 필터링 구문을 치고 있을 필요 없이, 자주 쓰는 취약점 탐지 구문을 즐겨찾기처럼 저장해 두고 클릭 한 번으로 꺼내 쓸 수 있다.

`Options` 탭의 **Import Saved Filters** 기능을 이용해 JSON 파일로 한 번에 밀어 넣으면 1초 만에 수십 개의 필터 세팅이 끝난다.

> [!IMPORTANT]
> **주의사항: Filter Library는 "자동 감시"가 아님.**
> Filter Library에 필터를 100개 저장해 두었다고 해서, `View Logs` 탭에서 실시간으로 지나가는 패킷들에 자동으로 색깔이 칠해지거나 태그가 달리는 것은 아니다.
>
> Library는 내가 원할 때 클릭해서 **"지나간 패킷들 중에서 해당 조건만 조회"**할 때 쓰는 **즐겨찾기 보관함** 역할만 한다.
>
> 패킷이 흘러갈 때 **자동으로 태그를 달고 색깔(Highlighting)**을 입히려면, 바로 다음에 설명할 **Tags & Colorize 기능에 해당 필터 구문을 따로 등록**해 주어야 한다.
>
> 그렇다고해서 너무 많은 필터를 Tag & Colorize 하게 되면 Burp가 뻗어버릴 수도 있으니 최소한의 필터만 적용해야한다.

**[취약점 필터 예시]**
우리가 직접 파일로 임포트해 둔 43개의 필터들은 실무에서 발생하는 가장 치명적인 취약점들을 모두 커버한다.

1. **클라우드 권한 및 API 키 탈취 탐지:** 운 좋게 서버 응답에 클라우드 키(AWS, GCP 등)가 하나라도 떨어지면 바로 최고 등급(Critical) 취약점이다. 이를 자동으로 감시한다.
2. **개인정보 대량 유출 (BOLA / IDOR):** 이메일, 주민번호, 전화번호, JWT 토큰 등이 불필요하게 응답값에 포함되어 날아오는지 자동으로 낚아챈다.
3. **권한 차단 우회 및 CORS 결함:** 401/403 에러나 잘못된 인증 헤더 등을 한눈에 필터링해 줘서 우회 공격(Bypass) 성공 여부를 즉시 파악할 수 있다.



##### 필터링 복붙용: Options > Saved Filter Backup > Import Saved Filters
아래 구문을 복붙하면 한번에 필터링 등록이 가능하다. 



```
[{"uid":"11111111-1111-4111-a111-111111111111","name":"API_REST","filter":{"filter":"(Request.Path CONTAINS \"api\" OR Request.Host CONTAINS \"api\") AND !(Request.Method == \"OPTIONS\")"}},{"uid":"22222222-2222-4222-a222-222222222222","name":"API_GraphQL","filter":{"filter":"(Request.Path CONTAINS \"graphql\" OR Request.Host CONTAINS \"graphql\") AND !(Request.Method == \"OPTIONS\")"}},{"uid":"33333333-3333-4333-a333-333333333333","name":"API_gRPC-Web","filter":{"filter":"(Response.Headers CONTAINS \"grpc-web\" OR Request.Headers CONTAINS \"grpc-web\" OR Request.Headers CONTAINS \"X-Grpc-Web\") AND !(Request.Method == \"OPTIONS\")"}},{"uid":"44444444-4444-4444-a444-444444444444","name":"Key_Google_API","filter":{"filter":"Response.Body MATCHES \"AIza[0-9A-Za-z\\-_]{35}\""}},{"uid":"55555555-5555-4555-a555-555555555555","name":"Key_GCP_OAUTH","filter":{"filter":"Response.Body MATCHES \"[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com\""}},{"uid":"66666666-6666-4666-a666-666666666666","name":"Key_GCP_Service","filter":{"filter":"Response.Body CONTAINS \"service_account\""}},{"uid":"77777777-7777-4777-a777-777777777777","name":"Key_GOOGLE_OAUTH","filter":{"filter":"Response.Body MATCHES \"ya29\\.[0-9A-Za-z\\-_]+\""}},{"uid":"88888888-8888-4888-a888-888888888888","name":"Key_HEROKU","filter":{"filter":"Response.Body MATCHES \"[hH][eE][rR][oO][kK][uU].*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\""}},{"uid":"99999999-9999-4999-a999-999999999999","name":"Key_MAILCHIMP","filter":{"filter":"Response.Body MATCHES \"[0-9a-f]{32}-us[0-9]{1,2}\""}},{"uid":"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa","name":"Key_MAILGUN","filter":{"filter":"Response.Body MATCHES \"key-[0-9a-zA-Z]{32}\""}},{"uid":"bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb","name":"Key_AWS","filter":{"filter":"Response.Body MATCHES \"amzn\\.mws\\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\""}},{"uid":"cccccccc-cccc-4ccc-accc-cccccccccccc","name":"Key_CLOUDINARY","filter":{"filter":"Response.Body MATCHES \"cloudinary://.*\""}},{"uid":"dddddddd-dddd-4ddd-addd-dddddddddddd","name":"Key_Firebase","filter":{"filter":"Response.Body MATCHES \".*firebaseio\\.com\""}},{"uid":"eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee","name":"Key_SLACK","filter":{"filter":"Response.Body MATCHES \"(xox[pboa]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})\""}},{"uid":"ffffffff-ffff-4fff-afff-ffffffffffff","name":"Key_RSA","filter":{"filter":"Response.Body CONTAINS \"-----BEGIN RSA PRIVATE KEY-----\""}},{"uid":"10000000-1000-4000-a000-100000000000","name":"Key_SSH_DSA","filter":{"filter":"Response.Body CONTAINS \"-----BEGIN DSA PRIVATE KEY-----\""}},{"uid":"11000000-1100-4100-a100-110000000000","name":"Key_SSH_EC","filter":{"filter":"Response.Body CONTAINS \"-----BEGIN EC PRIVATE KEY-----\""}},{"uid":"12000000-1200-4200-a200-120000000000","name":"Key_PGP","filter":{"filter":"Response.Body CONTAINS \"-----BEGIN PGP PRIVATE KEY BLOCK-----\""}},{"uid":"13000000-1300-4300-a300-130000000000","name":"Key_Facebook","filter":{"filter":"Response.Body MATCHES \"EAACEdEose0cBA[0-9A-Za-z]+\""}},{"uid":"14000000-1400-4400-a400-140000000000","name":"Key_Facebook_OAuth","filter":{"filter":"Response.Body MATCHES \"[fF][aA][cC][eE][bB][oO][oO][kK].*.{0,2}[0-9a-f]{32}.{0,2}\""}},{"uid":"15000000-1500-4500-a500-150000000000","name":"Key_GitHub","filter":{"filter":"Response.Body MATCHES \"[gG][iI][tT][hH][uU][bB].*.{0,2}[0-9a-zA-Z]{35,40}.{0,2}\""}},{"uid":"16000000-1600-4600-a600-160000000000","name":"Key_Generic_API","filter":{"filter":"Response.Body MATCHES \"[aA][pP][iI][_]?[kK][eE][yY].*.{0,2}[0-9a-zA-Z]{32,45}.{0,2}\""}},{"uid":"17000000-1700-4700-a700-170000000000","name":"Key_Twitter_Access","filter":{"filter":"Response.Body MATCHES \"[tT][wW][iI][tT][tT][eE][rR].*[1-9][0-9]+-[0-9a-zA-Z]{40}\""}},{"uid":"18000000-1800-4800-a800-180000000000","name":"Key_Twitter_OAuth","filter":{"filter":"Response.Body MATCHES \"[tT][wW][iI][tT][tT][eE][rR].*.{0,2}[0-9a-zA-Z]{35,44}.{0,2}\""}},{"uid":"19000000-1900-4900-a900-190000000000","name":"Key_Twilio","filter":{"filter":"Response.Body MATCHES \"SK[0-9a-fA-F]{32}\""}},{"uid":"1a000000-1a00-4a00-aa00-1a0000000000","name":"Key_Square_Access","filter":{"filter":"Response.Body MATCHES \"sq0atp-[0-9A-Za-z\\-_]{22}\""}},{"uid":"1b000000-1b00-4b00-ab00-1b0000000000","name":"Key_Square_OAuth","filter":{"filter":"Response.Body MATCHES \"sq0csp-[0-9A-Za-z\\-_]{43}\""}},{"uid":"1c000000-1c00-4c00-ac00-1c0000000000","name":"Key_Stripe_API","filter":{"filter":"Response.Body MATCHES \"sk_live_[0-9a-zA-Z]{24}\""}},{"uid":"1d000000-1d00-4d00-ad00-1d0000000000","name":"Key_Stripe_Restricted","filter":{"filter":"Response.Body MATCHES \"rk_live_[0-9a-zA-Z]{24}\""}},{"uid":"1e000000-1e00-4e00-ae00-1e0000000000","name":"Key_Slack_Webhook","filter":{"filter":"Response.Body MATCHES \"https://hooks\\.slack\\.com/services/T[a-zA-Z0-9_]{8}/B[a-zA-Z0-9_]{8}/[a-zA-Z0-9_]{24}\""}},{"uid":"1f000000-1f00-4f00-af00-1f0000000000","name":"Key_Picatic","filter":{"filter":"Response.Body MATCHES \"sk_live_[0-9a-z]{32}\""}},{"uid":"20000000-2000-4000-a000-200000000000","name":"Key_PayPal_Braintree","filter":{"filter":"Response.Body MATCHES \"access_token\\$production\\$[0-9a-z]{16}\\$[0-9a-f]{32}\""}},{"uid":"21000000-2100-4100-a100-210000000000","name":"Key_Password_Response","filter":{"filter":"Response.Body MATCHES \"[a-zA-Z]{3,10}://[^/\\s:@]{3,20}:[^/\\s:@]{3,20}@.{1,100}\""}},{"uid":"22000000-2200-4200-a200-220000000000","name":"Key_Generic_Secret","filter":{"filter":"Response.Body MATCHES \"[sS][eE][cC][rR][eE][tT].*.{0,2}[0-9a-zA-Z]{32,45}.{0,2}\""}},{"uid":"23000000-2300-4300-a300-230000000000","name":"Vuln_Excessive_Data_Exposure","filter":{"filter":"Response.Body CONTAINS \"email\" OR Response.Body CONTAINS \"name\" OR Response.Body CONTAINS \"ssn\" OR Response.Body CONTAINS \"nationalId\" OR Response.Body CONTAINS \"_id\" OR Response.Body CONTAINS \"family\" OR Response.Body CONTAINS \"phone\" OR Response.Body CONTAINS \"phoneNumber\""}},{"uid":"24000000-2400-4400-a400-240000000000","name":"Vuln_Mass_Assignment","filter":{"filter":"(Request.Method == \"POST\" OR Request.Method == \"PUT\" OR Request.Method == \"PATCH\") AND Request.Body CONTAINS \"mutation\""}},{"uid":"25000000-2500-4500-a500-250000000000","name":"Vuln_BOLA_Injection","filter":{"filter":"Request.Query MATCHES \".*=.*\" AND (Request.Method == \"POST\" OR Request.Method == \"PUT\" OR Request.Method == \"PATCH\") AND Request.Body CONTAINS \"variables\""}},{"uid":"26000000-2600-4600-a600-260000000000","name":"Vuln_CSRF_SSRF_1","filter":{"filter":"Request.Method == \"POST\" AND Request.Headers CONTAINS \"application/x-www-form-urlencoded\""}},{"uid":"27000000-2700-4700-a700-270000000000","name":"Vuln_CSRF_SSRF_2","filter":{"filter":"Request.Method == \"POST\" AND Request.Headers CONTAINS \"application/json\" AND Request.Headers CONTAINS \"Content-Length: 0\""}},{"uid":"28000000-2800-4800-a800-280000000000","name":"Vuln_CSRF_SSRF_3","filter":{"filter":"Request.Query CONTAINS \"http://\" OR Request.Query CONTAINS \"https://\" OR Request.Body CONTAINS \"http://\""}},{"uid":"29000000-2900-4900-a900-290000000000","name":"Vuln_CORS_Misconfig","filter":{"filter":"Response.Headers CONTAINS \"Access-Control-Allow-Credentials\" OR Response.Headers CONTAINS \"Access-Control-Allow-Origin\""}},{"uid":"2a000000-2a00-4a00-aa00-2a0000000000","name":"Vuln_Unrestricted_Resource","filter":{"filter":"Request.Body CONTAINS \"limit\" OR Request.Body CONTAINS \"filter\" OR Request.Body CONTAINS \"offset\" OR Request.Body CONTAINS \"first\" OR Request.Body CONTAINS \"after\" OR Request.Body CONTAINS \"last\" OR Request.Body CONTAINS \"max\" OR Request.Body CONTAINS \"total\" OR Request.Query CONTAINS \"limit\" OR Request.Query CONTAINS \"filter\" OR Request.Query CONTAINS \"offset\" OR Request.Query CONTAINS \"first\" OR Request.Query CONTAINS \"after\" OR Request.Query CONTAINS \"last\" OR Request.Query CONTAINS \"max\" OR Request.Query CONTAINS \"total\""}}]
```

등록이 되었다면 필요할 때마다 `Set as LogFilter`를 클릭하면 자동으로 필터에 입력된다.

![image-20260619152805548](../../images/2026-06-19-Burp_LoggerPlusPlus/image-20260619152805548.png)

## 5. Tags & Colorize
`View Logs` 탭 우측 상단을 보면 **Tags**와 **Colorize** 버튼이 있다. 이 두 기능은 패킷을 숨기지 않고 **전체 흐름을 보면서 특정 패킷만 눈에 띄게 강조**할 때 사용한다.

- **Tags (꼬리표 달기):** 특정 필터에 맞는 패킷이 지나가면, `Tags` 열에 내가 지정한 글자를 뱃지처럼 달아준다. (예: `Request.Path CONTAINS "admin"` 이면 `[Admin]` 태그 달기)
- **Colorize (형광펜 칠하기):** 특정 필터에 맞는 패킷 행의 배경색을 칠해준다. (예: `Response.Status == 401` 이면 빨간색으로 칠하기)



**[Colorize 추천 세팅]**

1. **빨간색 (Red) - 에러 및 권한 탈락**
   - **Filter:** `Response.Status IN [401, 403, 500]`
   - **이유:** 401/403(권한 없음)이나 500(서버 에러) 패킷을 빨갛게 칠해두면, SQL 인젝션 시도 중 서버가 터졌는지, 권한 우회가 막혔는지 직관적으로 알 수 있다.
2. **노란색 (Yellow) - 중요 데이터 수정**
   - **Filter:** `Request.Method IN ["POST", "PUT", "DELETE"] AND Response.Status == 200`
   - **이유:** GET 요청은 무시하고, 내 정보가 성공적으로 수정되거나 삭제된 중요한 패킷들만 눈에 띄게 추적할 수 있다.

**[Tags 추천 세팅]**

1. **`[Admin]` 태그 - 관리자 기능 추적**
   - **Filter:** `Request.Path CONTAINS "admin"`
   - **이유:** 사이트를 돌아다닐 때 무심코 지나친 백오피스나 관리자용 API가 호출되면 꼬리표가 달려 즉시 파악이 가능하다.
2. **`[Upload]` 태그 - 파일 업로드 추적**
   - **Filter:** `Request.Headers CONTAINS "multipart/form-data"`
   - **이유:** 웹쉘(WebShell) 공격의 핵심 타겟인 '파일 업로드' 구간만 찾아내어 공격 포인트를 잡을 수 있다.
3. **`[Auth]` 태그 - 인증 구간 추적**
   - **Filter:** `Request.Path CONTAINS "login" OR Request.Path CONTAINS "oauth" OR Request.Path CONTAINS "register"`
   - **이유:** 로그인, 회원가입, 비밀번호 찾기 등 인증 우회 공격을 수행할 핵심 페이지들을 쉽게 모아볼 수 있다.

이 기능들을 세팅해 두고 사이트를 돌아다니면, 굳이 패킷을 하나하나 열어보지 않아도 색깔과 태그만으로 어떤 트래픽인지 단번에 알아챌 수 있다.

![image-20260619150103921](../../images/2026-06-19-Burp_LoggerPlusPlus/image-20260619150103921.png)

## 6. Grep Values
Logger++ 공식 문서에 따르면, Logger++의 내장 Grep 도구는 **지정된 패턴과 일치하는 항목을 검색하고, 캡처 그룹(Capture Groups)의 값을 추출(Extract)**하는 강력한 기능을 제공한다.



**활용 예시 (세션 ID 추적 및 추출)**

1. `Grep Values` 탭 상단의 `Regex` 칸에 추출하고 싶은 값을 **소괄호 `()`**로 묶어서 정규표현식을 작성한다. (예: `JSESSIONID=([a-zA-Z0-9]+)`)
2. `Search` 버튼을 누르면 전체 로그를 스캔한다.
3. **Results 탭:** 매칭된 전체 패킷 내역과 함께, 괄호 `()` 안의 캡처 그룹에 해당하는 값이 무엇인지 보여준다.
4. **Unique Results 탭:** 수백 개의 패킷에서 발견된 캡처 그룹 값들 중 **중복을 제거한 고유(Unique) 값 목록**만 깔끔하게 추려서 리스트업 해준다.

모의해킹 실무에서 "타겟 사이트에서 사용된 모든 종류의 세션 쿠키 값", 혹은 "응답 패킷에 평문으로 노출된 모든 이메일 주소 목록" 등을 단 한 번의 검색으로 깔끔하게 뽑아낼 때(Data Extraction) 필수적인 기능이다.

하지만 정규표현식을 사용할 줄 모르는 나를 포함해 해당되는 사람들에게 치트키가 있다.



> [!TIP]
> **정규표현식을 몰라도 쓸 수 있는 치트키 `(.*)`**
>
> 정규표현식이 어렵다면 딱 하나만 기억하자. **`(.*)`** 이다.
> 특정 토큰값을 뽑아내고 싶다면 앞뒤 문자열을 적고 뽑을 부분에 **`(.*)`**만 넣어주면 끝이다.
>
> 예를 들어:
>
> - `Authorization: Bearer ` 뒷부분을 전부 뽑고 싶다면 ➡️ `Authorization: Bearer (.*)`
> - `{"token": "값"}` 에서 값만 뽑고 싶다면 ➡️ `"token": "(.*?)"` (**`?`를 붙이면 다음 큰따옴표가 나올 때까지만 깔끔하게 끊어서 가져온다.**)

![image-20260619150612211](../../images/2026-06-19-Burp_LoggerPlusPlus/image-20260619150612211.png)

## 7. Options 세팅 및 메모리 관리
Logger++는 강력한 대신 트래픽을 무지막지하게 기록하므로 메모리(RAM)를 엄청나게 먹는다. 
따라서 `Options` 탭에서 반드시 다음과 같이 최적화 세팅을 해두는 것이 좋다.

![image-20260619151054462](../../images/2026-06-19-Burp_LoggerPlusPlus/image-20260619151054462.png)

**1) Log Filter (불필요한 확장자 제거)**

- 캡처 화면 상단에 보면 `Request.Extension IN ["css", "svg", "woff2"...]` 처럼 되어 있는 기본 필터가 있다.
- 모의해킹에서 이미지 파일이나 폰트 파일 트래픽은 거의 볼 일이 없으므로, 이 필터가 **Enable** 되어 있는지 확인하여 쓰레기 로그가 쌓이는 것을 방지한다. (Disable 버튼이 보여야 Enable 상태)

**2) Log From (어디서 로그를 가져올 것인가?)**

- `In scope items only`: **(매우 중요)** 타겟 사이트로 지정한(Scope에 넣은) 트래픽만 기록하게 하여 메모리를 아낀다.
- 기본적으로 `Proxy`와 `Repeater` 등 자주 쓰는 도구에만 체크를 해두고, 쓸데없이 많이 발생하는 Scanner 트래픽 등은 앵간하면 체크 해제하는 것이 좋다.

**3) 용량 및 개수 제한 (Other)**

- `Maximum Log Entries`: 기본값이 1,000,000개로 되어 있는데, 본인의 컴퓨터 RAM 용량에 맞춰 100,000개 정도로 줄여두면 Burp Suite가 뻗는 것을 막을 수 있다.
- `Maximum Response Size (MB)`: 10MB로 되어 있다. 엄청나게 큰 동영상이나 압축 파일을 다운로드할 때 그 데이터가 전부 로거에 찍혀서 버벅거리는 것을 막아주는 안전장치이다.

**4) 데이터 입출력 및 백업 (Import / Export)**

- **가져오기(Import):** Burp 기본 Proxy History를 불러오거나, 심지어 OWASP ZAP 트래픽까지 Logger++로 가져와서 통합 분석할 수 있다.
- **내보내기(Export):** 모의해킹 데이터를 엑셀로 보기 위해 **CSV**로 뽑거나, 크롬에서 보기 위해 **HAR**로 뽑을 수 있다. 대규모 진단을 한다면 **Elasticsearch**로 바로 쏴버릴 수도 있다.
- **백업(Backup):** 내가 열심히 세팅한 태그(Tags)나 색상(Color) 규칙을 Export 해두면, 다음 프로젝트에서도 그대로 불러와서 쓸 수 있다.

