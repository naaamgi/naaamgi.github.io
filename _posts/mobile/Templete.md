알겠어. 아래는 앞으로 모바일 모의해킹/리버싱 블로그 글 쓸 때 기준으로 삼을 **하이브리드 템플릿 v1**이야.
네가 오늘 쓴 문서의 “실제 실습 흐름”을 중심으로 두고, 내가 제안했던 “반복 가능한 분석 노트/보고서 구조”를 합친 형태로 만들었어.

```
---
title: "실습명: 핵심 도구와 분석 목표"
excerpt: "대상 앱을 정적·동적 분석하여 어떤 흐름을 확인했는지 한 문장으로 요약"
categories: ['mobile']
published: false
date: YYYY-MM-DD
tags: [mobile, pentesting, android, owasp, jadx, frida, static-analysis, dynamic-analysis, reverse-engineering]
---

이번 글에서는 **대상 앱 이름**을 분석한다.

이 앱은 실서비스 앱이 아니라 학습 목적으로 제공되는 연습용 앱이다. 따라서 목표는 단순히 "성공 화면을 띄우는 것"이 아니라, **정적 분석에서 세운 가설을 동적 분석으로 확인하고, 앱이 어떤 방식으로 보호/검증 로직을 수행하는지 이해하는 것**이다.

> Spoiler Warning  
> 이 글은 분석 과정과 최종 확인값/우회 방법을 포함할 수 있다. 먼저 직접 풀어보고 싶다면 핵심 검증/우회 섹션부터는 나중에 읽는 것을 권장한다.

---

## 0. 요약

| 항목 | 내용 |
| --- | --- |
| 대상 | 앱 이름 / 레벨 / 버전 |
| APK | 파일명 또는 다운로드 출처 |
| Package Name | `패키지명` |
| Main Activity | `시작 Activity` |
| 핵심 목표 | 예: root 탐지 흐름 확인, secret 검증 로직 분석, Frida 후킹 |
| 사용 도구 | JADX, adb, Frida, Burp, Ghidra 등 |
| 최종 결과 | 예: 복호화 결과 확인, Success 다이얼로그 검증 |
| Spoiler 포함 여부 | 포함 / 일부 포함 / 미포함 |

이번 실습에서 진행한 흐름은 다음과 같다.

```text
APK 준비
→ Manifest 확인
→ 시작 Activity와 실행 흐름 확인
→ 보호/검증 로직 후보 찾기
→ Frida/Burp 등 동적 분석 환경 준비
→ 함수 호출과 반환값 관찰
→ 필요 시 후킹/패치/트래픽 조작
→ 앱 화면 또는 서버 응답으로 최종 검증
→ 정적·동적 분석 결과 비교
```

------

## 1. 실습 환경

이번 실습은 다음 환경에서 진행했다.

| 항목            | 값                         |
| --------------- | -------------------------- |
| Host OS         | Windows / macOS / Linux    |
| Shell           | PowerShell / bash / zsh    |
| Android 환경    | Emulator / Physical Device |
| Android Version | API Level / Android 버전   |
| ABI             | `x86_64`, `arm64-v8a` 등   |
| Frida Tools     | `버전`                     |
| Frida Server    | `버전 및 ABI`              |
| 대상 APK        | `파일명`                   |
| APK SHA256      | `해시값`                   |

분석 폴더는 다음처럼 나누었다.

```
lab-name/
├── original/     원본 APK
├── extracted/    디컴파일/추출 결과
├── scripts/      Frida, helper script
├── notes/        분석 메모
├── traffic/      Burp/ZAP 캡처, 요청/응답
└── work/         frida-server, 임시 파일
```

------

## 2. 대상 앱 개요

대상 앱은 어떤 목적으로 만들어졌는지 간단히 설명한다.

- 앱 이름:
- 제공처:
- 학습 목적:
- 주요 기능:
- 이번 글에서 다룰 범위:

이번 글에서는 모든 취약점을 다루지 않고, 다음 범위에 집중한다.

```
예:
- Manifest와 시작 Activity 확인
- 루팅/디버그 탐지 흐름 분석
- 입력값 검증 로직 추적
- Frida로 런타임 값 관찰
```

------

## 3. APK 기본 정보 확인

먼저 APK의 기본 정보를 확인한다.

```
adb devices
adb install .\target.apk
adb shell pm list packages | Select-String "keyword"
adb shell dumpsys package 패키지명
```

확인 결과:

| 확인 항목      | 결과                          |
| -------------- | ----------------------------- |
| Package Name   | `패키지명`                    |
| Version        | `versionName / versionCode`   |
| 설치 여부      | 성공 / 실패                   |
| 실행 가능 여부 | 정상 실행 / 오류              |
| 특이사항       | 예: 서버 필요, 루팅 탐지 발생 |

------

## 4. Manifest 확인

JADX 또는 apktool로 `AndroidManifest.xml`을 확인한다.

중점적으로 볼 항목은 다음과 같다.

| 확인 항목                | 확인 결과 | 분석 메모 |
| ------------------------ | --------- | --------- |
| Package Name             |           |           |
| Main Activity            |           |           |
| `android:debuggable`     |           |           |
| `android:allowBackup`    |           |           |
| 요청 권한                |           |           |
| Exported Activity        |           |           |
| Exported Service         |           |           |
| Exported Receiver        |           |           |
| Exported Provider        |           |           |
| Deep Link / App Link     |           |           |
| Native Library 사용 흔적 |           |           |

여기서는 설정값을 바로 취약점으로 단정하지 않는다.
먼저 앱의 시작 지점, 외부 노출면, 분석 우선순위를 정하는 데 사용한다.

------

## 5. 정적 분석: 실행 흐름 추적

Manifest에서 확인한 시작 지점부터 코드를 따라간다.

```
MainActivity
→ onCreate()
→ 보안 체크 함수
→ UI 이벤트 핸들러
→ 검증/암호화/네트워크 함수
```

정적 분석으로 세운 1차 가설:

| 코드 위치              | 역할 추정          | 확인 필요 사항       |
| ---------------------- | ------------------ | -------------------- |
| `Class.method()`       | 예: root 탐지 후보 | 반환값, 호출 시점    |
| `Class.method(String)` | 예: 입력 검증 후보 | 입력값 전달 여부     |
| `Crypto.decrypt()`     | 예: 복호화 후보    | key/cipher/plaintext |
| `ApiClient.request()`  | 예: 서버 요청 후보 | 파라미터/토큰/서명   |

이 단계에서는 우회나 조작보다 **관찰 지점 선정**을 우선한다.

------

## 6. 동적 분석 환경 준비

Frida 사용 시 버전과 ABI를 맞춘다.

```
frida --version
adb shell getprop ro.product.cpu.abi
adb shell getprop ro.product.cpu.abilist
adb push .\frida-server /data/local/tmp/frida-server
adb shell chmod 755 /data/local/tmp/frida-server
adb shell "/data/local/tmp/frida-server >/dev/null 2>&1 &"
frida-ps -U
```

Burp/ZAP이 필요한 경우:

```
1. 에뮬레이터 프록시 설정
2. CA 인증서 설치
3. 앱 트래픽 발생
4. 요청/응답 확인
5. TLS pinning 여부 확인
```

환경 준비 중 발생한 문제는 나중을 위해 반드시 기록한다.

| 문제                 | 원인                      | 해결                               |
| -------------------- | ------------------------- | ---------------------------------- |
| Frida attach 실패    | 버전 불일치               | tools/server 버전 맞춤             |
| hook 로그 누락       | ART 인라이닝 가능성       | `Java.deoptimizeEverything()` 시도 |
| Burp에 트래픽 미노출 | pinning 또는 proxy 미설정 | 설정/후킹 확인                     |
| adb path 문제        | Shell 경로 변환           | PowerShell 또는 pathconv 비활성화  |

------

## 7. 동적 분석: 관찰 먼저

처음부터 반환값을 바꾸지 않는다.
먼저 정적 분석에서 찾은 함수가 실제로 호출되는지 확인한다.

```
Java.perform(function () {
    Java.deoptimizeEverything();

    const Target = Java.use('패키지.클래스');

    const method = Target.methodName.overload('java.lang.String');

    method.implementation = function (arg) {
        console.log('[CALL] methodName');
        console.log('  arg = ' + arg);

        const result = method.call(this, arg);

        console.log('  return = ' + result);
        return result;
    };

    console.log('[*] Observation hooks installed');
});
```

관찰 결과:

```
[CALL] ...
[RET] ...
```

분석 메모:

| 관찰 대상      | 예상                 | 실제 결과       | 판단             |
| -------------- | -------------------- | --------------- | ---------------- |
| 함수 호출 여부 | 호출될 것으로 예상   | 호출됨 / 미호출 | 가설 확인 / 수정 |
| 입력값         | UI 입력값 전달 예상  | 값 확인         | 확인             |
| 반환값         | true/false 예상      | 값 확인         | 확인             |
| 부수 효과      | 다이얼로그/요청 발생 | 확인            | 확인             |

------

## 8. 핵심 로직 분석

앱의 핵심 검증, 암호화, 인증, 거래, 탐지 로직을 분석한다.

예시 관점:

| 유형              | 확인할 내용                            |
| ----------------- | -------------------------------------- |
| Root/Debug 탐지   | 어떤 파일/API/속성을 확인하는가        |
| 입력 검증         | 사용자 입력이 어디서 비교되는가        |
| 암호화            | key, IV, mode, padding, hardcoded 여부 |
| API 요청          | endpoint, parameter, token, signature  |
| 권한 검증         | 클라이언트 검증인지 서버 검증인지      |
| Android Component | 외부 앱에서 호출 가능한지              |
| WebView           | URL 검증, JavaScript, file access 설정 |
| 로컬 저장소       | SharedPreferences, SQLite, files, logs |

정적 분석 결과를 동적 분석으로 검증한다.

```
정적 분석:
- 어떤 코드가 어떤 역할로 보였는가?

동적 분석:
- 실제 호출되었는가?
- 어떤 값이 들어오고 나갔는가?
- 앱 화면/서버 응답이 어떻게 변했는가?
```

------

## 9. 우회 또는 조작 실습

관찰이 끝난 뒤 필요한 경우에만 우회/조작을 수행한다.

```
Java.perform(function () {
    const Target = Java.use('패키지.클래스');

    Target.check.overload('java.lang.String').implementation = function (input) {
        console.log('[BYPASS] check("' + input + '") => true');
        return true;
    };
});
```

조작 전후 비교:

| 항목        | 조작 전 | 조작 후 |
| ----------- | ------- | ------- |
| 함수 반환값 |         |         |
| 앱 화면     |         |         |
| 서버 응답   |         |         |
| 로그        |         |         |
| 보안 영향   |         |         |

주의할 점:

- 우회 성공 자체보다 **왜 가능한지**를 설명한다.
- 클라이언트 우회인지, 서버 권한 우회인지 구분한다.
- 실서비스에 적용 가능한 공격처럼 과장하지 않는다.
- 학습용 앱 범위 안에서만 설명한다.

------

## 10. 최종 검증

최종적으로 앱 화면, 로그, 서버 응답, 파일 변화 등으로 결과를 확인한다.

```
예:
- Success 다이얼로그 표시
- API 응답 변경
- 보호 로직 우회 확인
- 민감정보 노출 확인
- 파일/DB에서 값 확인
```

검증 결과:

| 검증 항목     | 결과 |
| ------------- | ---- |
| 앱 화면       |      |
| Frida 로그    |      |
| Burp/ZAP 요청 |      |
| 로컬 파일/DB  |      |
| 최종 판단     |      |

------

## 11. 정적·동적 분석 결과 비교

이 섹션은 반드시 넣는다.
글의 핵심은 “풀이”가 아니라 **가설 검증 과정**이다.

| 분석 질문                        | 정적 분석에서 예상한 내용 | 동적 분석에서 확인한 내용 | 최종 판단 |
| -------------------------------- | ------------------------- | ------------------------- | --------- |
| 앱 시작 시 무엇이 실행되는가?    |                           |                           |           |
| 보호 로직은 어디에 있는가?       |                           |                           |           |
| 입력값은 어디로 전달되는가?      |                           |                           |           |
| 중요한 값은 어디서 만들어지는가? |                           |                           |           |
| 우회가 가능한 이유는 무엇인가?   |                           |                           |           |
| 서버 검증이 있었는가?            |                           |                           |           |

------

## 12. 보안 영향과 대응 방안

학습용 앱이라도 실무 관점으로 정리한다.

| 발견 사항                | 영향                    | 대응 방안                        |
| ------------------------ | ----------------------- | -------------------------------- |
| Hardcoded Secret         | 앱 디컴파일로 노출 가능 | 서버 측 검증, 안전한 key 관리    |
| Root Detection 우회 가능 | 보호 로직 신뢰도 낮음   | 다중 탐지, 서버 리스크 기반 판단 |
| TLS Pinning 우회 가능    | 트래픽 분석 가능        | pinning + 탐지 + 서버 검증       |
| 클라이언트 권한 검증     | 조작 가능               | 서버에서 권한 재검증             |
| 민감정보 로컬 저장       | 탈취 가능               | Keystore, 암호화, 최소 저장      |

과장하지 말고 다음처럼 쓴다.

```
이 결과는 학습용 앱에서 확인한 것이다.
실서비스에서는 서버 검증, 탐지 로직, 무결성 검증, 난독화, 정책 통제가 함께 적용될 수 있으므로 동일하게 일반화하면 안 된다.
```

------

## 13. 트러블슈팅

실습 중 겪은 문제는 별도 섹션으로 모은다.

| 문제                    | 증상                | 원인                   | 해결                          |
| ----------------------- | ------------------- | ---------------------- | ----------------------------- |
| Frida server 실행 안 됨 | `unable to connect` | ABI/버전 불일치        | 동일 버전 server 사용         |
| 일부 hook 미출력        | 일부 함수 로그 없음 | ART 최적화/인라이닝    | `Java.deoptimizeEverything()` |
| 앱 입력이 안 됨         | Frida 콘솔에 입력   | 앱 UI 입력과 콘솔 혼동 | 에뮬레이터 입력창 사용        |
| Burp 트래픽 안 보임     | 요청 미표시         | 프록시/CA/pinning 문제 | 단계별 확인                   |
| adb push/chmod 실패     | 경로 오류           | Git Bash path 변환     | PowerShell 사용               |

------

## 14. 빠른 명령어 참조

글을 다시 볼 때 가장 유용한 섹션이다.

```
# Device
adb devices
adb shell getprop ro.product.cpu.abi
adb shell pm list packages | Select-String "keyword"

# Frida
frida --version
adb push .\frida-server /data/local/tmp/frida-server
adb shell chmod 755 /data/local/tmp/frida-server
adb shell "/data/local/tmp/frida-server >/dev/null 2>&1 &"
frida-ps -U
frida -U -f 패키지명 -l .\scripts\observe.js

# App
adb shell am start -n 패키지명/Activity명
adb logcat
```

------

## 15. 이번 실습에서 배운 점

도구 사용법보다 분석 사고 과정을 중심으로 정리한다.

- Manifest는 앱의 시작 지점과 외부 노출면을 찾는 첫 번째 지도다.
- 정적 분석은 후킹 지점을 찾기 위한 준비 과정이다.
- Frida는 값을 바꾸기 전에 호출 흐름과 반환값을 관찰하는 데 먼저 사용한다.
- 디컴파일 결과는 원본 코드가 아니라 분석 힌트로 봐야 한다.
- 모바일 앱 보호 로직은 클라이언트 안에 있으므로 우회 가능성을 항상 고려해야 한다.
- 중요한 검증은 서버에서 다시 수행되어야 한다.
- 실습 결과는 학습용 앱의 맥락 안에서 해석해야 한다.

------

## 16. 다음 단계

이번 실습 다음에 이어서 할 내용을 적는다.

```
예:
- 반환값 강제 조작 실습
- 동일 앱에서 패치 방식 비교
- L2로 넘어가 native library 분석
- Burp로 네트워크 흐름 확인
- 동일 취약점을 MASTG 항목과 매핑
```

다음 글에서 다룰 예정:

\- 

\- 

------

## 참고자료

- [OWASP MAS Crackmes](https://mas.owasp.org/crackmes/)
- [OWASP MASTG](https://mas.owasp.org/MASTG/)
- [Frida Android 문서](https://frida.re/docs/android/)
- [Frida JavaScript API](https://frida.re/docs/javascript-api/)
- [jadx GitHub](https://github.com/skylot/jadx)
- 기타 write-up 또는 공식 문서