**Android Mobile Pentest Lab Roadmap**

목표는 `리버싱/후킹 기본기 → Android 취약점 진단 → 실무형 앱 공격면 → 금융앱 흐름` 순서로 감각을 쌓는 것입니다. 웹해킹 베이스가 있으니 서버 취약점보다 **APK 내부 분석, Android 컴포넌트, Frida 후킹, 로컬 저장소, 인증/거래 흐름 조작**에 더 비중을 둡니다.

**전체 순서**

| 단계 | 실습 대상            | 핵심 목표                                   |
| ---- | -------------------- | ------------------------------------------- |
| 1    | OWASP UnCrackable L1 | jadx, 문자열/로직 분석, root 탐지 우회 입문 |
| 2    | OWASP UnCrackable L2 | Frida 후킹, native library 맛보기           |
| 3    | OWASP UnCrackable L3 | 난독화/무결성/anti-debug 우회               |
| 4    | OWASP UnCrackable L4 | 실전형 crackme, r2/Ghidra/native 분석 강화  |
| 5    | AndroGoat            | Android 취약점 전반 학습                    |
| 6    | InsecureShop         | 실무형 Android appsec 공격면 학습           |
| 7    | InsecureBankv2       | 은행앱 구조, API/인증/거래 흐름 분석        |
| 8    | DodoVulnerableBank   | 금융앱 + REST API 복합 실습                 |

**준비 환경**

| 도구                                     | 용도                                 |
| ---------------------------------------- | ------------------------------------ |
| Android Studio Emulator 또는 테스트 단말 | APK 실행 환경                        |
| adb                                      | 설치, 로그, 파일 접근, activity 실행 |
| jadx-gui                                 | APK 디컴파일/소스 분석               |
| apktool                                  | 리소스/Manifest/Smali 분석 및 패치   |
| Frida + frida-tools                      | 런타임 후킹                          |
| Objection                                | Frida 기반 빠른 런타임 탐색          |
| Burp Suite 또는 ZAP                      | HTTP/HTTPS 프록시                    |
| Ghidra 또는 radare2/rizin                | native library 분석                  |
| MobSF                                    | 정적/동적 분석 보조                  |

**0단계: 공통 루틴**

각 앱마다 같은 방식으로 반복합니다.

```
1. APK 설치 및 정상 실행
2. package name 확인
3. AndroidManifest.xml 확인
4. jadx로 주요 Activity/Service/Receiver/Provider 파악
5. strings, native library, asset, res/raw 확인
6. logcat 관찰
7. Burp 프록시 연결
8. Frida attach/spawn 테스트
9. 취약점 재현
10. 원인 코드 정리
11. 방어 방법 정리
```

기록 템플릿: 'OWASP UnCrackable'의 경우 같은 디렉토리에 있는`Templete.md` 참조하여 작성. 

**1단계: OWASP UnCrackable L1**

목표:

- APK 구조 익히기
- jadx로 Java/Kotlin 코드 읽기
- root detection 로직 찾기
- secret 검증 로직 찾기
- Frida로 간단한 method return 조작

체크리스트:

- 

  APK 설치

- 

  package/activity 확인

- 

  root check 함수 찾기

- 

  secret 비교 함수 찾기

- 

  Frida로 root check 우회

- 

  secret 획득 또는 검증 우회

- 

  패치 방식과 후킹 방식 둘 다 비교

검색 키워드:

```
OWASP UnCrackable L1 Frida writeup
UnCrackable Level1 jadx
```

**2단계: OWASP UnCrackable L2**

목표:

- native library 로딩 흐름 이해
- JNI 호출 흐름 따라가기
- Java layer와 native layer 연결 보기
- Frida로 Java/native 함수 후킹

체크리스트:

- 

  ```
  System.loadLibrary
  ```

   위치 확인

- 

  native method 선언 확인

- 

  ```
  .so
  ```

   파일 추출

- 

  Ghidra/r2로 symbol 확인

- 

  Frida로 Java layer 우회

- 

  가능하면 native 함수 후킹 시도

핵심 질문:

```
검증 로직이 Java에 있는가, native에 있는가?
비밀값이 문자열로 남아 있는가?
입력값이 native로 어떻게 전달되는가?
```

**3단계: OWASP UnCrackable L3**

목표:

- anti-debug, anti-tamper, 난독화 대응
- 무결성 체크 로직 파악
- Frida script를 더 구조적으로 작성
- native 분석 난이도 올리기

체크리스트:

- 

  앱 종료/탐지 조건 확인

- 

  root/debug/tamper check 분리

- 

  Frida spawn 방식 사용

- 

  난독화된 클래스/함수 역할 이름 붙이기

- 

  native 코드에서 비교/복호화 루틴 추적

- 

  우회 스크립트 정리

**4단계: OWASP UnCrackable L4**

목표:

- 실전형 reverse engineering 흐름
- r2/Ghidra 사용 숙련
- 문자열이 바로 안 보일 때 분석하는 법
- 앱 로직, native, crypto, anti-analysis를 함께 보기

체크리스트:

- 

  APK 구조 확인

- 

  native library 목록화

- 

  entry point, JNI 함수, crypto 함수 확인

- 

  dynamic tracing 시도

- 

  Frida native hook 시도

- 

  최종 풀이 과정을 write-up 형태로 정리

여기까지 완료하면 “모바일 앱이 막아도 어떻게 뚫고 관찰할지” 기본기가 생깁니다.

**5단계: AndroGoat**

목표:

- Android 취약점 전반을 카테고리별로 학습
- 웹해킹 지식을 Android 컨텍스트에 매핑
- MASTG 항목과 연결

우선순위:

```
1. Insecure Logging
2. Insecure Data Storage
3. SQLi / XSS / WebView
4. Activity / Service / Broadcast Receiver / Content Provider
5. HTTP/HTTPS Intercept
6. Certificate Pinning
7. Custom URL Scheme
8. Broken Cryptography
9. Firebase Misconfiguration
10. Binary Patching
11. Biometric Authentication
```

결과물:

- 취약점별 `재현 명령어`
- 취약 코드 위치
- 영향 설명
- 안전한 구현 방식

**6단계: InsecureShop**

목표:

- 실무형 모바일 앱 공격면 학습
- 외부 앱에서 타깃 앱을 공격하는 관점 익히기
- Deep Link, Intent, FileProvider, ContentProvider 집중

우선순위:

```
1. Hardcoded Credentials
2. Deep Link URL Validation
3. Weak Host Validation
4. Intent Redirection
5. Access to Protected Components
6. Insecure Broadcast Receiver
7. Insecure Content Provider
8. FileProvider Misconfiguration
9. SSL Certificate Validation
10. WebView Properties
11. Local Storage
```

실습 포인트:

- `adb shell am start ...`로 deeplink/activity 호출
- 악성 보조 앱 없이 adb로 intent 재현
- 가능하면 간단한 attacker APK 만들어보기
- WebView와 파일 탈취 흐름 이해

**7단계: InsecureBankv2**

목표:

- 은행앱 스타일 모바일-서버 구조 분석
- 인증/권한/거래 흐름 조작
- API 보안과 모바일 보안을 함께 보기

우선순위:

```
1. 로그인/API 트래픽 프록시
2. 하드코딩 계정/시크릿
3. 취약한 인증/인가
4. 계좌/사용자 파라미터 변조
5. 취약한 비밀번호 변경
6. username enumeration
7. insecure HTTP
8. root/emulator detection bypass
9. insecure content provider
10. local encryption/weak crypto
11. memory/log/pasteboard leakage
12. app patching/runtime manipulation
```

금융앱 관점 질문:

```
서버가 권한을 검증하는가?
거래 금액/수신자/계좌번호를 클라이언트가 조작할 수 있는가?
PIN/비밀번호/토큰이 로컬에 남는가?
재인증이 필요한 작업에 재인증이 있는가?
거래 요청에 서명/nonce/timestamp가 있는가?
루팅/후킹 탐지는 우회 가능한가?
```

**8단계: DodoVulnerableBank**

목표:

- 다른 은행앱 구조로 복습
- REST API + Android client 흐름 재점검
- InsecureBankv2에서 익힌 방법론 재사용

체크리스트:

- 

  서버 실행

- 

  앱-서버 연결

- 

  로그인/세션 흐름 확인

- 

  API 파라미터 변조

- 

  로컬 저장소 확인

- 

  인증/인가 취약점 확인

- 

  네트워크 암호화 확인

**최종 산출물**

각 앱마다 최소 하나씩 write-up을 남깁니다.

```
UnCrackable L1~L4:
- 풀이 과정
- 사용한 Frida script
- 분석한 함수
- 우회 포인트

AndroGoat/InsecureShop:
- 취약점별 재현 절차
- Android 컴포넌트 관점 원인
- 대응 방법

InsecureBankv2/DodoVulnerableBank:
- 인증/거래 흐름 다이어그램
- API 요청/응답 분석
- 조작 가능한 파라미터
- 모바일 보호기법 우회 여부
```

**권장 페이스**

```
Week 1: UnCrackable L1
Week 2: UnCrackable L2
Week 3: UnCrackable L3
Week 4: UnCrackable L4
Week 5-6: AndroGoat
Week 7-8: InsecureShop
Week 9-10: InsecureBankv2
Week 11: DodoVulnerableBank
Week 12: 전체 정리 + 개인 체크리스트 작성
```

**최종 목표 체크리스트**

- 

  APK를 보면 분석 순서를 스스로 정할 수 있다.

- 

  Manifest에서 공격면을 뽑을 수 있다.

- 

  jadx로 민감 로직을 찾을 수 있다.

- 

  Frida로 root/debug/pinning/check 함수를 우회할 수 있다.

- 

  Burp로 모바일 API 흐름을 분석할 수 있다.

- 

  Android 컴포넌트 취약점을 재현할 수 있다.

- 

  로컬 저장소/로그/메모리 노출을 확인할 수 있다.

- 

  은행앱형 인증/인가/거래 흐름을 위협 모델링할 수 있다.

- 

  발견 사항을 MASTG/MASVS 기준으로 정리할 수 있다.