---
title: "[최종 프로젝트]모바일 앱 보안 진단을 위한 기초 개념 정리"
excerpt: "모바일 앱 보안 진단을 처음 접하면서 알게 된 개념들을 정리했다. 메모리 보안, Android 저장소 구조, TLS/인증서 핀닝까지."
categories: project
tags: [Android, 모바일보안, JWT, TLS, 인증서핀닝, SharedPreferences, 메모리덤프, network_security_config]
date: 2026-03-12
last_modified_at: 2026-03-12
published: true
---

모바일 앱 보안 진단을 처음 해보면서, 진단 도구를 따라 쓰기 전에 먼저 "왜 이게 문제인지" 이해해야 했다. 그 과정에서 공부한 개념들을 정리한다.

---

## 메모리와 민감정보

### 앱이 실행되면 메모리에 무슨 일이 생기나

앱이 실행되면 화면에 표시되는 것들, 서버에서 받아온 데이터, 로그인 정보 등 모든 데이터가 RAM(메모리)에 올라간다. 이 데이터는 앱이 사용하고 난 뒤에도 명시적으로 지우지 않으면 메모리에 잔존한다.

즉, 앱이 로그인 처리를 완료한 뒤에도 로그인 요청 JSON(`{"username":"...", "password":"..."}`)이 메모리 어딘가에 남아있을 수 있다.

### 메모리 덤프란

메모리 덤프(Memory Dump)는 실행 중인 프로세스의 메모리 내용을 통째로 파일로 저장하는 것이다. 루팅된 기기에서는 다른 앱의 메모리도 덤프할 수 있다.

덤프 파일은 바이너리 형태지만, `strings` 명령어로 사람이 읽을 수 있는 문자열만 추출하면 그 안에 어떤 평문 데이터가 있는지 확인할 수 있다.

```bash
strings 덤프파일 | grep -i "password"
strings 덤프파일 | grep -i "eyJ"   # JWT 토큰은 eyJ로 시작함
```

### JWT 토큰이란

JWT(JSON Web Token)는 서버가 로그인한 사용자에게 발급하는 인증 토큰이다. 구조는 다음과 같다.

```
헤더.페이로드.서명
eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ1c2VyMSJ9.XXXXX
```

- **헤더:** 알고리즘 정보 (Base64 인코딩)
- **페이로드:** 사용자 정보, 만료시간 등 (Base64 인코딩)
- **서명:** 위변조 검증용

페이로드는 암호화가 아닌 **Base64 인코딩**이라 누구나 디코딩해서 내용을 읽을 수 있다. 서명 덕분에 위변조는 불가능하지만, 토큰 자체를 탈취하면 그대로 사용할 수 있다.

공격자가 JWT 토큰을 가져가면 비밀번호 없이도 해당 계정으로 인증된 API 요청을 보낼 수 있다. 따라서 토큰이 메모리에 평문으로 잔존하는 것은 보안 문제가 된다.

---

## Android 저장소 구조

### 내부 저장소 vs 외부 저장소

| | 내부 저장소 | 외부 저장소 |
|---|---|---|
| **경로** | `/data/data/패키지명/` | `/sdcard/` |
| **접근 주체** | 해당 앱만 (루팅 없이) | 권한 있으면 다른 앱도 가능 |
| **민감정보 저장** | 상대적으로 안전 | 위험 |

민감정보를 외부 저장소에 저장하면 다른 앱이나 악성 앱에서 읽어갈 수 있다. 민감정보는 반드시 내부 저장소에, 가능하면 암호화해서 저장해야 한다.

### SharedPreferences란

SharedPreferences는 Android에서 간단한 설정값을 키-값 쌍으로 저장하는 가장 기본적인 저장 방법이다. 내부적으로는 XML 파일로 저장된다.

```
/data/data/패키지명/shared_prefs/앱이름_prefs.xml
```

루팅된 기기에서는 이 파일을 바로 읽을 수 있다. 여기에 비밀번호나 토큰 같은 민감정보를 저장하면 안 된다.

### Base64는 암호화가 아니다

개발할 때 "그냥 Base64로 인코딩해서 저장하면 되지 않나?"라고 생각하기 쉬운데, Base64는 **암호화가 아니라 인코딩**이다.

```bash
echo "aaaaaa:A12341234" | base64
# YWFhYWFhOkExMjM0MTIzNAo=

echo "YWFhYWFhOkExMjM0MTIzNAo=" | base64 --decode
# aaaaaa:A12341234
```

누구나 디코딩할 수 있어서 난독화 수준에 불과하다. 민감정보는 Android Keystore를 통해 암호화해서 저장해야 한다.

---

## 통신 보안

### HTTPS와 TLS

HTTPS는 HTTP에 TLS(Transport Layer Security)를 씌운 것이다. TLS가 데이터를 암호화해서 전송 구간에서 도청이나 변조를 막는다.

TLS는 버전에 따라 보안 수준이 다르다.

| TLS 버전 | 상태 |
|---------|------|
| SSL 3.0, TLS 1.0, TLS 1.1 | ❌ 취약 (폐기됨) |
| TLS 1.2 | ✅ 안전 |
| TLS 1.3 | ✅ 안전 (현재 최신) |

TLS 1.0/1.1에는 POODLE, BEAST 같은 알려진 취약점이 있어서 현재는 사용하면 안 된다.

### 취약한 암호 알고리즘

TLS가 데이터를 암호화할 때 어떤 알고리즘을 쓰는지도 중요하다.

| 알고리즘 | 상태 |
|---------|------|
| RC4 | ❌ 취약 (통계적 편향) |
| DES, 3DES | ❌ 취약 (키 길이 부족, SWEET32 취약점) |
| AES-GCM | ✅ 안전 |
| ChaCha20-Poly1305 | ✅ 안전 |

### PFS(전방향 비밀성, Perfect Forward Secrecy)

PFS가 없는 경우: 서버의 개인키가 나중에 유출되면, 과거에 녹화해 뒀던 트래픽을 전부 복호화할 수 있다.

PFS가 있는 경우: 매 세션마다 임시 키(Ephemeral Key)를 새로 생성해서 세션 키를 만든다. 서버 개인키가 유출돼도 임시 키는 별도로 존재하므로 과거 트래픽을 복호화할 수 없다.

ECDHE(Elliptic Curve Diffie-Hellman Ephemeral) 키 교환을 쓰면 PFS가 보장된다.

---

## 인증서 핀닝(Certificate Pinning)

### 기본 HTTPS 인증서 검증의 한계

일반적인 HTTPS 통신에서 앱은 "신뢰할 수 있는 CA(Certificate Authority)가 서명한 인증서면 OK"라고 판단한다.

문제는 공격자가 자신의 CA를 기기에 등록하고 그 CA로 서명한 가짜 인증서를 제시하면, 앱이 그것도 신뢰한다는 것이다. 이 방법으로 MITM(중간자 공격)이 가능하다.

### 핀닝이란

인증서 핀닝은 "신뢰하는 CA의 인증서" 대신 **특정 인증서(또는 공개키)의 해시값을 앱 안에 고정**해두는 방식이다.

```
앱: "서버 인증서의 SHA-256 해시가 dscUaZx...여야 해"
서버: (핀닝된 인증서 제시)
앱: 해시 일치 → 통신 허용
공격자: (다른 CA가 서명한 인증서 제시)
앱: 해시 불일치 → 연결 거부
```

핀닝이 적용된 앱은 Burp Suite 같은 프록시 도구로 트래픽을 잡기가 훨씬 어렵다.

### network_security_config.xml

Android 앱의 네트워크 보안 설정을 선언하는 파일이다. APK를 디컴파일하면 `res/xml/` 경로에서 볼 수 있다.

```xml
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.example.com</domain>
        <trust-anchors>
            <certificates src="system" />  <!-- 시스템 CA만 신뢰 -->
        </trust-anchors>
        <pin-set expiration="2026-12-31">
            <pin digest="SHA-256">공개키 해시값</pin>  <!-- 인증서 핀닝 -->
        </pin-set>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">  <!-- 전체 HTTP 차단 -->
        ...
    </base-config>
</network-security-config>
```

| 설정 | 의미 |
|------|------|
| `cleartextTrafficPermitted="false"` | HTTP 평문 통신 앱 레벨에서 차단 |
| `certificates src="system"` | 시스템 CA만 신뢰 (사용자가 설치한 CA 불신) |
| `pin-set` | 특정 인증서 고정 (핀닝) |

`certificates src="system"`이 설정되어 있으면 Burp CA를 설치해도 앱이 신뢰하지 않는다. 그래서 Magisk 모듈(AlwaysTrustUserCerts)로 사용자 CA를 시스템 CA로 승격시키는 작업이 필요했다.
