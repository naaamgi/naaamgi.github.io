---
title:  "OSINT 심화: 핵심 수집 도구 완벽 가이드 (Amass, Shodan, theHarvester, Censys, Maltego)"
excerpt: "레드팀과 모의해킹 실무에서 반드시 알아야 할 5대 OSINT 도구들의 원리와 실전 활용법을 총정리한다."
categories: [osint, tools]
tags:
  - [osint, amass, shodan, theharvester, censys, maltego, redteam, security]
typora-root-url: ../../
date: 2026-07-06
last_modified_at: 2026-07-06
---

OSINT를 활용한 초기 자산 수집 단계에서 가장 널리 쓰이고 강력한 파급력을 자랑하는 5가지 도구를 소개한다. 각 도구는 서브도메인 스캐닝(Amass), 노출된 기기 및 취약점 검색(Shodan, Censys), 이메일 및 임직원 정보 스크래핑(theHarvester), 그리고 정보 시각화 및 관계 매핑(Maltego)에 특화되어 있다.

---

## OSINT 도구 요약

| 도구명 | 주요 검색 방식 | 주요 수집 타겟 | 공격 기획 단계 | 핵심 특징 |
|---|---|---|---|---|
| **theHarvester** | 검색 엔진 & API 스크래핑 | 이메일, 직원 이름, 서브도메인 | 스피어 피싱, 크리덴셜 스터핑 준비 | 검색 엔진과 인텔리전스 소스에서 사람(Human) 및 기초 자산 스크래핑 |
| **Amass** | API 연동 & DNS 브루트포싱 | 서브도메인, IP 대역(ASN) | 인프라 구조 파악, 공격 표면 확장 | API 연동을 통한 압도적인 서브도메인 브루트포싱 및 자산 매핑 |
| **Shodan** | 전역 포트 스캔 (Port Scan) | 노출된 포트, OS, 배너 정보 | 레거시 서버 탐색, 초기 침투(RDP 등) | 전 세계 IPv4 대상 24시간 포트 스캔 기반 기기 검색 엔진 |
| **Censys** | 인증서 & 핑거프린팅 스캔 | 인증서 체인, 숨겨진 서버 | 취약점 탐색, 관리자 페이지 식별 | IP뿐만 아니라 인증서(Certificate) 및 핑거프린팅 기반의 정밀 탐색 |
| **Maltego** | 노드 기반 관계도 매핑 (Graph) | 흩어진 모든 OSINT 데이터 | 타겟팅 최종 시각화, 공격 경로 설계 | 클릭 한 번으로 모든 정보를 연결선이 있는 거대한 그래프(노드)로 매핑 |

---

## OSINT 워크플로우

이 도구들은 단순히 개별적으로 쓰이는 것이 아니라, **[기초 수집 → 인프라 확장 → 취약 자산 탐색 → 시각화]**라는 전략적 파이프라인(Workflow)으로 연결될 때 진정한 파괴력을 가진다.

1. **Step 1. 기초 스크래핑 및 표적 식별 (theHarvester)**
   - 타겟 기업의 도메인을 기반으로 임직원들의 이메일과 이름을 긁어모아 사회공학적 공격(피싱) 타겟 리스트를 작성한다.
2. **Step 2. 인프라 확장 및 매핑 (Amass)**
   - 기초 단계에서 얻어낸 도메인을 바탕으로, 수십 개의 API를 동원하여 타겟 기업이 소유한 모든 서브도메인과 전체 IP 대역(ASN)을 폭발적으로 확장해 매핑한다.
3. **Step 3. 취약 자산 탐색 (Shodan, Censys)**
   - Amass로 찾아낸 방대한 IP와 도메인들 중에서 외부에 잘못 열려있는 RDP 포트, 패치가 안 된 구형 서버, 숨겨진 사내 관리자 페이지 등을 족집게처럼 찾아낸다. (이때 포트 스캔은 Shodan, 인증서 추적은 Censys 활용)
4. **Step 4. 시각화 및 최종 공격 경로 설계 (Maltego)**
   - 위에서 수집된 방대한 텍스트 데이터를 Maltego에 넣고 돌려, 어떤 서버가 어떤 관리자와 연결되어 있는지 범죄 수사망 같은 그래프로 시각화하여 가장 뚫기 쉬운 취약점을 최종 타겟팅한다.

---

## 1. theHarvester

**theHarvester(더 하베스터)**는 침투 테스트 및 레드팀 작전의 아주 초창기 단계에서 타겟의 **이메일 주소, 임직원 이름, 서브도메인, 열려있는 포트**를 수집하는 데 특화된 파이썬(Python) 기반의 강력한 OSINT 도구이다.

단순하지만 굉장히 빠르고 직관적이다. 구글, 빙(Bing), 야후, 링크드인과 같은 대중적인 검색 엔진부터 Shodan, Censys, Hunter.io 같은 전문적인 인텔리전스 소스까지 한 번에 스크래핑하여 방대한 양의 기초 자산을 긁어모아 준다.

특히, 수집된 이메일 주소와 임직원 이름은 추후 **스피어 피싱(Spear Phishing)이나 크리덴셜 스터핑(Credential Stuffing) 등 사회공학적(Social Engineering) 공격**을 기획할 때 핵심 타겟 리스트로 활용된다.

### theHarvester 설치 및 기본 사용법

#### 설치 방법
칼리 리눅스(Kali Linux)에는 기본적으로 내장되어 있어 터미널에서 `theHarvester`를 치면 바로 실행된다. 윈도우나 우분투 등 다른 환경에서는 깃허브에서 직접 클론하여 사용할 수 있다.
```bash
git clone https://github.com/laramies/theHarvester.git
cd theHarvester
pip install -r requirements.txt
python3 theHarvester.py -h
```

#### 필수 옵션(Flag) 요약
| 옵션(Flag) | 설명 |
|---|---|
| **`-d`** | 타겟 도메인 또는 회사 이름을 지정한다. (예: `example.com`) |
| **`-b`** | 검색할 데이터 소스(Source)를 지정한다. (예: `google`, `bing`, `linkedin`, `all` 등) |
| **`-l`** | 검색 엔진에서 파싱할 결과의 최대 개수를 제한한다. (기본값은 500) |
| **`-f`** | 결과를 XML 또는 HTML 파일로 저장한다. |
| **`-p`** | 수집된 호스트(IP)를 대상으로 간단한 포트 스캔을 수행한다. |
| **`-v`** | DNS 리졸빙을 통해 호스트네임을 검증하고 가상 호스트(Virtual Host)를 검색한다. |
| **`-c`** | 타겟 도메인에 대해 DNS 브루트포싱(Brute-forcing)을 수행한다. |
| **`-t`** | DNS 최상위 도메인(TLD) 확장을 통해 추가적인 연관 도메인을 탐색한다. |
| **`-n`** | DNS 서버 역방향 조회 및 Shodan 검색을 활성화하여 더 상세한 호스트 정보를 수집한다. |
| **`-s`** | 검색 엔진의 파싱 시작 위치(인덱스)를 지정한다. (기본값: 0) |

### 실무 활용 시나리오

#### 기본 자산 수집 (검색 엔진 활용)
타겟 기업(`example.com`)에 대한 기초적인 정보를 검색 엔진(Google, Bing 등)을 통해 빠르게 파싱한다. 가장 흔하게 쓰이는 기본 형태이다.

```bash
# 타겟: example.com, 소스: 구글과 빙(모든 소스는 all), 최대 검색 개수: 500개
theHarvester -d example.com -l 500 -b all
```

#### 임직원 프로필 타겟팅 (LinkedIn 활용)
링크드인(LinkedIn) 소스를 지정하면 타겟 기업에 다니고 있는 직원들의 이름과 직무(Title)를 추출할 수 있다.

```bash
# 소스를 linkedin으로 지정하여 임직원 정보 추출
theHarvester -d "Example Corporation" -l 300 -b linkedin
```
* **결과 분석**: 직원 리스트가 출력된다. 만약 타겟 기업의 이메일 규칙이 `이름.성@example.com`이라는 것을 파악했다면, 이 이름들을 바탕으로 거대한 스피어 피싱 이메일 타겟 리스트를 생성해 낼 수 있다.

#### 유료 API 연동으로 수집력 극대화 (`api-keys.yaml`)
theHarvester 폴더 내에 있는 `api-keys.yaml` 파일에 Shodan, Censys, Hunter.io, Github 등의 API 키를 입력해 두면 딥웹과 상용 인텔리전스 데이터까지 백그라운드에서 한 번에 조사하기 때문에 수집력이 극대화된다.

```bash
theHarvester -d example.com -b shodan,hunter,github
```

---

## 2. OWASP Amass

**OWASP Amass(아마스)** 프로젝트는 정보 수집(Reconnaissance) 단계에서 타겟의 **DNS 인프라 정보와 서브도메인을 깊이 있게 추적하고 자산을 매핑(Asset Mapping)**하는 데 특화된 오픈소스 도구이다. 

단순한 브루트포싱(Brute-forcing)을 넘어, 인증서 투명성(Certificate Transparency) 로그, 각종 검색 엔진, 라우팅 데이터(BGP, ASN) 등 인터넷에 널려 있는 공개 출처 정보(OSINT)를 수집하여 숨겨진 공격 표면(Attack Surface)을 찾아낸다.

### Amass 핵심 명령어

Amass는 여러 가지 하위 명령어(Subcommand)를 제공한다. 그중 실무에서 가장 많이 쓰이는 핵심 명령어들은 다음과 같다.

| 명령어 | 설명 |
|---|---|
| **`intel`** | 타겟 기업의 타겟팅 범위를 좁히기 위해 ASN, IP 대역, 관련 루트 도메인들을 먼저 수집할 때 사용한다. |
| **`enum`** | (가장 많이 쓰임) 특정 도메인을 기준으로 서브도메인을 폭발적으로 수집한다. |
| **`track`** | 이전에 스캔했던 결과와 현재 결과를 비교하여 새롭게 추가되거나 삭제된 도메인(변경 사항)을 추적한다. |
| **`viz`** | 수집된 자산과 도메인들의 연관 관계를 시각화(Visualization)하여 그래프 형태로 출력한다. (HTML, D3.js, Maltego 등 지원) |
| **`db`** | Amass가 스캔 후 저장한 내부 그래프 데이터베이스(Graph Database)에 직접 쿼리를 날리거나 데이터를 관리할 때 사용한다. |
| **`dns`** | 대규모 도메인 리스트를 바탕으로 고성능 DNS 리졸빙(Resolving)을 수행하여 실제 살아있는 자산인지 빠르게 검증한다. |

### 실무 활용 시나리오

#### 스텔스 정보 수집: 패시브(Passive) 모드
레드팀 작전 시 타겟 기업의 방화벽이나 IDS/IPS 장비에 알람을 울리게 해서는 안 된다. 이때 타겟 서버에 단 하나의 패킷도 직접 보내지 않고, 오직 제3자의 OSINT 소스만 긁어모으는 것이 패시브 모드이다.

```bash
# -passive: 타겟에 직접 패킷을 보내지 않음
# -d: 타겟 도메인 지정
amass enum -passive -d example.com
```
* **결과**: 구글, 쇼단, VirusTotal, Censys 등 다양한 외부 소스에 기록된 `example.com`의 서브도메인(예: `dev.example.com`, `vpn.example.com`) 목록이 주르륵 출력된다. 흔적을 남기지 않고 광범위한 자산을 찾을 때 매우 유용하다.

#### 공격적인 정보 수집: 액티브(Active) 모드
타겟으로부터의 탐지를 크게 신경 쓰지 않거나, 허가된 모의해킹(화이트박스) 환경이라면 액티브 모드를 통해 훨씬 딥한 정보를 수집할 수 있다.

```bash
# -active: 타겟의 DNS 서버로 직접 쿼리를 날려 인증서 정보를 뽑아옴
# -brute: 딕셔너리(사전) 파일을 이용해 서브도메인을 브루트포싱함
# -src: 해당 서브도메인을 어느 소스에서 찾았는지 출처를 함께 표기함
amass enum -active -brute -src -d example.com -o amass_results.txt
```
* **결과**: 패시브 모드보다 훨씬 많은 양의 서브도메인과 함께 각 호스트의 IP 주소까지 정확하게 검증(Resolve)하여 반환한다. 

#### 기업의 IP 대역 및 루트 도메인 찾기 (Intel)
모의해킹 시작 전, 타겟 회사가 가진 다른 도메인 이름(예: `example.com` 외에 `example.net`, `example.kr` 등)이나 IP 대역(ASN)을 찾을 때 사용한다.

```bash
# 타겟 회사의 이름(Organization)으로 ASN 및 IP 대역 정보 검색
amass intel -org "Example Corporation"

# 특정 IP 대역에서 운영 중인 도메인들 역추적 검색
amass intel -cidr 192.168.1.0/24
```

### 💡 Amass API 연동 (config.yaml)

Amass가 강력한 진짜 이유는 **수십 개의 유료/무료 위협 인텔리전스 API와 연동**할 수 있다는 점이다. 
Github, Shodan, VirusTotal, Censys, SecurityTrails 등의 API 키를 발급받아 Amass의 설정 파일(`config.yaml`)에 등록해 두면, 명령어를 칠 때마다 해당 서비스들을 백그라운드에서 전부 스크래핑해 오기 때문에 수집력이 매우 좋아진다.

* **설정 파일 위치(리눅스 기준)**: `~/.config/amass/config.yaml`
* **사용법**: 
```bash
# 설정 파일을 적용하여 스캔
amass enum -config ~/.config/amass/config.yaml -passive -d example.com
```

**주의사항**: Amass의 `enum` 명령어(특히 브루트포싱 옵션 적용 시)는 네트워크 트래픽을 상당히 많이 발생시키며 시간이 꽤 오래 걸릴 수 있다. 타겟 서버뿐만 아니라 자신이 속한 네트워크(예: 회사 내부망)의 대역폭에도 영향을 줄 수 있으므로 실습 시 유의해야 한다.

---

## 3. Shodan

구글(Google)이 전 세계 웹사이트의 '텍스트와 컨텐츠'를 긁어모아 검색할 수 있게 해 준다면, **Shodan(쇼단)**은 전 세계에 **인터넷이 연결된 '기기(Device)' 그 자체**를 스캔하고 검색할 수 있게 해 주는 검색 엔진이다.

웹 서버, 데이터베이스, 라우터, 스위치, 방범용 웹캠, 심지어 공장의 산업제어시스템(SCADA)이나 신호등까지 IP가 할당되어 외부망에 연결되어 있다면 모두 쇼단의 수집 대상이 된다. 

### 특징 및 원리: Banner Grabbing
쇼단은 전 세계의 모든 IPv4 주소를 대상으로 365일 24시간 내내 특정 포트(예: 80, 443, 22, 3389 등)로 패킷을 보내는 **포트 스캔(Port Scan)** 기반으로 동작한다. 응답 헤더(Banner)를 읽어 들여 아래 정보들을 데이터베이스에 인덱싱한다.
- 어떤 포트가 열려 있는지?
- 어떤 운영체제(OS)를 사용하는지?
- 실행 중인 서비스와 버전은 무엇인지?
- 기기가 위치한 국가와 도시는 어디인지?

> [!TIP]
> 쇼단의 기본 무료 계정은 조회 결과 수가 제한되며, 많은 결과를 보려면 유료 결제가 필요하다. 키워드가 잘 맞지 않아 결과가 부족할 경우, 대안으로 **Censys**를 활용하는 것이 좋다.

### Shodan CLI 활용
웹 인터페이스 외에도 파이썬 라이브러리 기반의 CLI 도구를 제공하여 터미널에서 빠르게 검색할 수 있다.
```bash
# 특정 IP에 대한 호스트 정보 요약 출력
shodan --api-key [KEY] host [IP]
```

### 기본 검색 명령어

| 옵션 | 설명 | 검색어 예시 |
|---|---|---|
| **Country** | 특정 국가 도메인만 검색 | `country:KR` |
| **City** | 특정 도시명으로 검색 | `city:seoul` |
| **Net** | 네트워크 IP 주소 대역 기준으로 검색 | `net:8.8.8.8` |
| **Product** | 특정 소프트웨어 이름 기준으로 검색 | `product:MySQL` |
| **OS** | 운영체제 기준으로 검색 | `os:linux` |

### 실무 검색 시나리오 (Shodan Dorks)

쇼단의 진정한 위력은 특정 조건만 걸러내는 필터(Dork)를 조합할 때 발휘된다. 실무에서 자주 사용되는 11가지 검색 예시는 다음과 같다.

1. **"국가코드 / Product / OS / 버전" 기준 검색**
   - 검색어: `country:"[국가코드]" product:"[MySQL]" os:"[운영체제]" version:"[버전정보]"`
2. **"국가코드 / 지역명" 기준 (데이터센터 위치 확인용)**
   - 검색어: `country:KR city:seoul`
3. **Product & Port 조건식** (예: Docker 서비스 디폴트 포트 2375)
   - 검색어: `product:docker country:"KR" port:"2375"`
4. **네트워크 대역과 국가코드**
   - 검색어: `net:"[IP 대역]" country:"[국가코드]"`
   - *주의사항*: 검색 대상 IP 대역이 북한이라고 해서 100% 북한 소속 자산은 아니며, 반대로 북한 IP 대역이 아니어도 북한 해커의 소행일 수 있다. 이들은 종종 VPN을 사용하여 IP를 지속적으로 바꾸기 때문에, 식별 시 반드시 `country:kp` 키워드를 병행해서 사용하여 분석의 정확도를 높여야 한다.
5. **단일 네트워크 IP & Port 별로 검색**
   - 검색어: `net:[IP Addr] port:[Port num]`
6. **해킹/위변조된 웹 사이트 검색**
   - 검색어: `http.title:"Hacked by"`
7. **해킹된 NAS 스토리지 (QNAP NAS, Synology NAS, DVR) 정보 검색**
   - 검색어: `port:3260 "x00AuthMethod=None\x00"`
8. **Windows OS 사용하는 POST 정보 검색**
   - 검색어: `"Welcome to Microsoft Telnet Service"`
9. **폴리콤(Polycom) 디버깅 정보 노출 검색**
   - 검색어: `"Polycom command shell" country:"KR"`
10. **서버 랙 위협 정보 (KVM 스위치 노출)**
    - 원격 접속이 가능한 KVM(Raritan KVM, Aten KVM 등) 검색
    - 검색어: `product:raritan`
11. **Exploit 공격 코드 검색**
    - [exploits.shodan.io](https://exploits.shodan.io)를 통해 특정 취약점에 대한 공격 코드 및 엑스플로잇 정보를 검색할 수 있다.

---

## 4. Censys

**Censys(센시스)**는 쇼단과 마찬가지로 인터넷에 연결된 기기와 사이버 위협 정보를 실시간으로 수집하는 서비스 플랫폼이다. 일정 쿼리 횟수까지는 무료로 사용할 수 있다.

### 특징 및 원리
쇼단이 포트 스캔 기반에 강력하다면, 센시스는 **IP 기반 스캔**뿐만 아니라 **인증서(Certificate) 기반 점검**에 매우 특화되어 있다는 점이 핵심이다. 쇼단 대비 직관성은 다소 떨어질 수 있으나, 더 깊고 디테일한 정보(예: 내부망 인증서 정보 등)를 파헤칠 때 유리하다.
특히 특정 **핑거프린팅(Fingerprinting)** 값을 이용해 검색하면 동일한 특징을 공유하는 타겟 인프라들을 묶어서 찾아낼 수 있다.

### Censys CLI 활용
센시스 역시 강력한 CLI 도구를 지원하여 자동화된 쉘 스크립트 작성 등에 용이하다.
```bash
# 특정 호스트(IP)에 대한 상세 정보 검색
censys search "ip: 8.8.8.8"
```

### 기본 검색 방법
센시스는 크게 두 가지 기준의 검색 모드를 제공한다.
- **Search IPv4**: IP 주소 기반 검색
- **Search Certificates**: 인증서 기반 검색 (예: `parsed.issuer.organization.raw:"Symantec Corporation"`)

인증서 체인(Certificate Chain)을 분석하면 해당 IP에 할당된 네트워크 ASN 번호, Whois 정보뿐만 아니라 인증서 서명 내역을 통해 타겟의 **소속 기관이나 부서명**까지 알아낼 수 있다.

### 실무 검색 시나리오 (Censys Dorks)

센시스를 실무 모의해킹 및 위협 헌팅에서 활용하는 핵심적이고 현실적인 6가지 사례는 다음과 같다.

1. **특정 기업의 숨겨진 서브도메인 및 서버 찾기 (인증서 기반)**
   - 클라우드나 방화벽 뒤에 숨어있는 스테이징(Staging)이나 개발(Dev) 서버를 인증서 발급자 기준으로 찾아낸다.
   - 검색어: `parsed.names: "dev.example.com"` 또는 `parsed.subject_dn: "O=Example Corporation"`
2. **외부에 노출된 사내 관리자 페이지 찾기**
   - 설정 실수로 열려있는 Jenkins, Tomcat, Kibana 등의 사내 관리자 패널을 찾는다.
   - 검색어: `services.http.response.html_title: "Jenkins"` AND `location.country_code: KR`
3. **인증이 없는 데이터베이스 노출 검색**
   - 비밀번호 설정 없이 외부에 오픈된 Elasticsearch나 MongoDB 등 치명적인 타겟을 검색한다.
   - 검색어: `services.service_name: ELASTICSEARCH` AND `services.elasticsearch.cluster_name: *`
4. **특정 취약점(CVE)에 노출된 레거시 서버 탐색**
   - 패치가 안 된 구형 버전의 웹 서버(예: IIS 7.5, 오래된 Apache 등)를 구동 중인 타겟을 특정하여 검색한다.
   - 검색어: `services.http.response.headers.server: "Microsoft-IIS/7.5"`
5. **사내 임직원용 VPN 게이트웨이 식별**
   - 원격 근무를 위해 열어둔 타겟 기업의 특정 VPN(Pulse Secure, Fortinet 등) 엔드포인트를 찾는다.
   - 검색어: `services.tls.certificates.leaf_data.subject.organization: "Target Company"` AND `services.port: 443`
6. **ICS / SCADA 산업제어시스템 노출 검색**
   - 보안이 취약한 상태로 외부에 오픈된 공장 등 산업 제어 장비를 찾는다.
   - 검색어: `tags:scada AND metadata.manufactory:siemens`

---

## 5. Maltego

**Maltego(말테고)**는 흩어진 OSINT 데이터를 그러모아 **시각화(Visualization)와 관계도 매핑(Mapping)**을 수행하는 데 있어 강점이 있다. 무료 버전(CE)과 상용 버전(XL/Classic)이 나뉘어 있으며, 무료 버전은 변환(Transform) 수행 시 제약이 일부 있다.

### 특징 및 원리
수사기관이나 영화에서 범죄자를 추적하기 위해 화이트보드에 관련 인물 사진과 단서들을 압정으로 꽂고 붉은 선으로 연결해 나가는 장면을 떠올려 보자. 말테고는 바로 그 작업을 디지털 환경에서 **클라이언트-서버 구조**로 수행해 주는 프로그램이다.

단 한 번의 검색(Transform) 쿼리를 통해 타겟 서버, 연관된 인물 이름, 회사 정보, IP 주소, DNS, 서브도메인, 이메일 주소 등을 하나의 거대한 마인드맵 또는 노드(Node) 그래프 형태로 시각화하여 뿌려준다. 예를 들어, **[특정 도메인]** 엔티티에서 시작해 **[연결된 IP 주소]**들로 확장한 뒤, 다시 그 IP들의 **[소유 기관(Organization) 정보]**로 연결해 나가는 식의 점진적인 공격 표면 매핑 시나리오가 가능하다.

### Maltego 3대 핵심 구성 요소

| 구성 요소 | 설명 |
|---|---|
| **개체 (Entity)** | 그래프 상에 하나의 점(Node)으로 표시되는 독립된 데이터 항목. DNS, MX 레코드, 이메일 주소, 전화번호, 사람 이름 등 약 20여 종의 템플릿이 기본 제공된다. |
| **변환 (Transform)** | 하나의 Entity를 입력값으로 받아 연관된 다른 부가 정보를 추출해 내는 일련의 스크립트나 쿼리. (예: `도메인(Entity)`에 Transform을 걸면 연결된 `IP 주소(Entity)`들을 찾아 그려줌) |
| **머신 (Machine)** | 여러 단계에 걸쳐 수동으로 클릭하며 수행해야 할 Transform 작업들을 한 번에 자동으로 쭉 실행하도록 만들어 둔 매크로 성격의 자동화 집합 툴. |
