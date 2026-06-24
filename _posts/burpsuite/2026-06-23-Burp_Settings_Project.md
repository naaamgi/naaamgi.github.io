---
title: "Burp Suite 기본 완벽 가이드: 설정창(Settings) 해부하기 - 2편 (Project 설정)"
excerpt: "Burp Suite 프로젝트 설정 완벽 가이드: Scope, Collaborator, Logging 등 실무 핵심 세팅"
categories: ['burpsuite']
published: false
date: 2026-06-23
tags: [burpsuite, settings, project, 모의해킹, 웹해킹, 기본기]
---

설정창 백과사전 2편에서는 앞선 포스팅에서 다루었던 `Proxy` 탭 바로 아래에 위치한 **Project** 카테고리를 아주 디테일하게 살펴본다. 

Project 설정은 '현재 열려있는 프로젝트 파일'에만 적용되는 세팅으로, 타겟을 정의하고 백그라운드 작업을 관리하는 모의해킹의 필수 기반 시설이다.

> **[여기에 Settings 좌측 트리의 Project 카테고리가 확장된 캡처 첨부]**

---

## 1. Scope (타겟 범위 설정)
Proxy 인터셉트 규칙이나 Scanner 등 Burp Suite의 모든 기능이 '어느 도메인을 대상으로 동작할 것인지'를 결정하는 가장 중요한 기준점이다.

- **Out-of-scope requests**: 스코프에 포함되지 않은 도메인으로 가는 트래픽을 아예 메모리에 저장하지 않고 버리도록(Drop) 설정할 수 있다. (프로젝트 용량 관리와 램(RAM) 절약에 큰 도움이 된다.)
- **Advanced scope control**: 정규표현식을 사용하여 `*.target.com`처럼 와일드카드 형태로 스코프를 유연하게 지정하는 고급 설정이다. 실무에서는 이 기능을 켜두고 정규식으로 타겟을 세팅하는 것이 기본이다.

## 2. Collaborator (OOB 취약점 탐지 서버)
Burp Collaborator는 SSRF(Server-Side Request Forgery)나 Blind SQL Injection처럼, 화면에 결과가 뜨지 않고 서버 내부에서 외부로 패킷이 나가는 취약점(Out-of-Band)을 잡기 위해 사용하는 일종의 '미끼 서버'다.

- **Server location**: 기본값인 `Default public server`를 쓰면 PortSwigger가 운영하는 공개 서버로 미끼 주소를 생성한다. 하지만 금융권 등 망분리 환경이거나 보안이 빡빡한 실무 환경에서는 외부 인터넷이 막혀있을 수 있으므로, 별도의 사내 `Private Collaborator server` 주소를 여기에 직접 입력하여 사용해야 한다.

## 3. Tasks (백그라운드 작업 관리)
Burp Suite 우측 상단 대시보드(Dashboard)에서 돌아가고 있는 Live audit(자동 취약점 스캔), Passive crawl(수동 크롤링) 등의 작업 설정을 관리한다.

- 특정 에러(Network errors)가 연속으로 발생할 때 자동으로 스캔 태스크를 일시 정지(Pause)시킬 것인지, 에러 횟수 기준은 몇 번으로 할 것인지를 디테일하게 조정할 수 있다. 타겟 서버가 불안정할 때 이 수치를 조절해 주면 좋다.

## 4. Automatic Backup (자동 백업)
해킹 진단 중 툴이 갑자기 튕기거나 컴퓨터가 꺼졌을 때, 수십 시간 동안 잡은 패킷과 취약점 로그를 날리지 않도록 지켜주는 생명줄이다.

- 기본적으로 체크되어 있으며, 몇 분 주기로 백그라운드 저장을 할지 설정할 수 있다. 프로젝트 용량이 기가바이트(GB) 단위로 커지면 백업할 때마다 툴이 렉이 걸릴 수 있는데, 이때 저장 주기를 늘리거나 임시 파일로 저장하도록 세팅을 변경한다.

## 5. Logging (전체 트래픽 기록)
Burp를 통해 지나가는 모든 Request와 Response 패킷을 텍스트(.txt) 파일 형태로 내 PC에 전부 기록하는 기능이다.

- **실무 활용도 100%**: 고객사에서 "어제 오후 2시쯤 서버에 부하가 발생했는데, 진단팀에서 무슨 패킷을 쏘셨나요?"라고 물어볼 때를 대비한 '면피용(증거용)' 로깅이다. All traffic 옵션을 체크하여 매일매일 날짜별로 텍스트 파일을 남겨두는 꼼꼼한 실무자들이 많다.

## 6. Sessions (세션 및 매크로)
이전 1편에서 강조했던 바로 그 탭이다. 세션이 끊기지 않도록 백그라운드에서 자동 로그인을 해주거나 CSRF 토큰을 갱신해 주는 Session Handling Rules와 Macros 설정이 바로 이곳 Project 카테고리 안에 속해 있다.
