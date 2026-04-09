---
title: "[최종 프로젝트]모바일 모의해킹 환경 구축 - M1 MacBook에서 Frida + AVD 루팅하는 방법"
excerpt: "왜 루팅이 필요한지, Frida가 뭔지, Burp CA 인증서 문제가 왜 생길까?"
categories: project
tags: [Android, Frida, AVD, Burp Suite, 루팅, Magisk, apktool, jadx, 모바일해킹]
date: 2026-03-12
last_modified_at: 2026-03-12
published: true
---

모바일 모의해킹은 처음이라 개념이 하나도 없는 상태에서 시작했다.
환경 구축하면서 왜 이런 과정이 필요한지 이해한 내용을 공부 노트 형식으로 정리한다.

---

## 전체 흐름 먼저 파악하기

모바일 앱을 진단하려면 크게 두 가지 분석이 필요하다.

| 분석 유형 | 설명 | 주요 도구 |
|-----------|------|-----------|
| **정적 분석** | 앱을 실행하지 않고 코드/설정 파일 분석 | apktool, jadx |
| **동적 분석** | 앱을 직접 실행하면서 런타임 동작 분석 | Frida, objection, Burp Suite |

동적 분석을 하려면 앱을 내 맘대로 조작할 수 있는 환경, 즉 **루팅된 기기**가 필요하다.

---

## 왜 에뮬레이터(AVD)를 쓰는가

실제 안드로이드 기기를 루팅하면 기기 보증이 날아가고 벽돌이 될 수도 있다.
Android Studio의 **AVD(Android Virtual Device)** 는 가상 안드로이드 기기라 마음껏 루팅하고 실험할 수 있다.

---

## 왜 루팅이 필요한가

모바일 앱은 기본적으로 **앱 샌드박스**로 격리되어 있다.
루팅되지 않은 기기에서는:
- 다른 앱의 메모리를 들여다볼 수 없다
- `/data/data/앱패키지명/` 경로에 접근할 수 없다
- 앱 내부 프로세스에 코드를 주입할 수 없다

Frida 같은 동적 분석 도구가 앱 내부에 접근하려면 **루트 권한**이 필요하다.

### Google Play vs Google APIs 이미지

AVD를 만들 때 System Image를 선택하는 화면이 나온다.

| 이미지 종류 | 루팅 가능 여부 |
|------------|--------------|
| **Google Play** | ❌ 불가 (`su` 바이너리 없음) |
| **Google APIs** | ✅ 가능 |

반드시 **Google APIs** 이미지를 선택해야 한다. Google Play 이미지는 `su`가 없어서 루트 권한 자체를 얻을 수 없다.

### Android 13은 왜 rootAVD가 필요한가

예전 방식인 `adb root` 로는 Android 13을 루팅할 수 없다.
Android 13부터 `/system` 파티션이 **read-only**로 강제되어서, 기존 방식으로는 루트 권한을 얻어도 시스템 파일을 수정할 수가 없다.

**rootAVD + Magisk** 방식을 쓰면 ramdisk를 패치해서 시스템 레벨 루팅이 가능해진다.
Magisk는 안드로이드 루팅 프레임워크로, 단순 루팅 외에도 모듈 설치를 지원한다.

---

## Frida란 무엇인가

**Frida**는 **동적 계측(Dynamic Instrumentation) 프레임워크**다.
쉽게 말하면, 실행 중인 앱에 JavaScript 코드를 주입해서 앱의 동작을 실시간으로 가로채거나 변경할 수 있는 도구다.

### Frida 구성

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| **frida (CLI)** | Mac(호스트) | 조작 명령을 내리는 쪽 |
| **frida-server** | 에뮬레이터(타겟) | 에뮬레이터에서 실행되며 명령을 받아 처리 |

frida-server는 `/data/local/tmp`에 올려두고 루트 권한으로 실행한다.
에뮬레이터를 재부팅하면 frida-server가 꺼지므로 매번 다시 실행해야 한다.

### Frida로 할 수 있는 것

- 특정 함수 호출을 가로채기 (hook)
- 함수 인자/반환값 변경
- **SSL 피닝 우회** — 앱이 특정 인증서만 신뢰하도록 설정돼 있어도 우회 가능
- 메모리 덤프 (objection과 함께)

### 왜 Python 버전에 신경써야 하는가

M1 Mac에는 시스템 Python, Homebrew Python이 혼재한다.
frida 16.6.6은 Python 3.14와 호환이 안 될 수 있어서, Conda로 **Python 3.11** 가상환경을 따로 만들어 사용했다.

```bash
conda create -n frida-env python=3.11 -y
conda activate frida-env
pip install frida==16.6.6 frida-tools==13.5.0
```

`frida` 명령어가 안 된다면 `conda activate frida-env`를 먼저 확인하자.

---

## Burp Suite + CA 인증서 문제

### 왜 CA 인증서 설치가 필요한가

Burp Suite는 중간자(MITM) 프록시다.
앱과 서버 사이에 끼어서 HTTPS 트래픽을 복호화해 보는 원리인데,
이 과정에서 Burp Suite가 자신의 CA로 서명한 인증서를 앱에게 제시한다.

앱이 "이 CA는 믿을 수 없는 CA야"라고 거부하면 트래픽을 볼 수 없다.

### Android 7+ 인증서 신뢰 정책 변경

Android 7 이전에는 사용자가 설치한 인증서(사용자 CA)도 앱이 신뢰했다.
Android 7 이후부터는 앱이 **시스템 CA만 신뢰**하도록 기본 정책이 바뀌었다.

즉, Burp CA를 그냥 설치하면 "사용자 CA"로만 등록되어서 앱이 무시한다.

### 해결: AlwaysTrustUserCerts (Magisk 모듈)

**AlwaysTrustUserCerts** 모듈은 사용자 CA 인증서를 자동으로 **시스템 CA**로 승격시켜준다.
Magisk가 루팅 프레임워크이기도 하지만, 이런 모듈을 설치할 수 있는 플랫폼이기도 하다.

```
Burp CA 인증서 다운로드
  → AlwaysTrustUserCerts 모듈 설치 (Magisk)
  → 인증서 설치 후 Cold Boot 재시작
  → Settings → Trusted credentials → System 탭에서 PortSwigger 확인
```

---

## 정적 분석 도구: apktool vs jadx

| 도구 | 출력 | 용도 |
|------|------|------|
| **apktool** | smali 코드 + 리소스 파일 | AndroidManifest.xml, res/ 분석 |
| **jadx** | Java 소스코드 수준 | 앱 로직 분석, 하드코딩된 키/URL 찾기 |

smali는 안드로이드 달빅 VM의 어셈블리 언어로, 가독성이 낮다.
jadx는 smali를 다시 Java로 역컴파일해서 훨씬 읽기 쉽다.

실제로 AndroidManifest.xml이나 res/xml/ 파일을 볼 때는 apktool,
앱 코드 로직을 분석할 때는 jadx를 쓴다.

---

## 환경 구축 요약

```
[Mac 호스트]
  conda(frida-env) → frida CLI 16.6.6
  Burp Suite       → 프록시 리스너 :8081
  apktool 3.0.1    → 정적 분석
  jadx 1.5.5       → 정적 분석

[AVD: Pixel 6 Pro, Android 13, arm64]
  Magisk 루팅 (rootAVD)
  frida-server 16.6.6 → /data/local/tmp/
  AlwaysTrustUserCerts → Burp CA를 시스템 CA로 승격
  Wi-Fi 프록시 → Mac IP:8081
```

---

## 트러블슈팅 메모

| 증상 | 원인 | 해결 |
|------|------|------|
| `frida: command not found` | conda 가상환경 미활성화 | `conda activate frida-env` |
| frida-server 연결 안 됨 | 재부팅 후 서버 미실행 | `adb root` 후 frida-server 재실행 |
| `/system` read-only | Android 13 정책 | rootAVD 방식으로 루팅 |
| Burp 인증서 신뢰 안 됨 | 사용자 CA만 등록됨 | AlwaysTrustUserCerts 모듈 설치 |
| 에뮬레이터 이상 동작 | 스냅샷 문제 | Cold Boot Now |
