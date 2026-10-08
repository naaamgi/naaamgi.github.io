---
title: "RustScan 소개: 전체 포트를 빠르게 찾고 Nmap으로 확인하기"
excerpt: "RustScan의 역할, Nmap과의 차이, 바로 쓸 수 있는 명령과 권장 설정을 정리한다."

categories: tools
tags:
  - [rustscan, nmap, portscan]

typora-root-url: ../../

date: 2025-08-25
last_modified_at: 2026-10-08
---

# RustScan

**RustScan**은 포트를 빠르게 찾고, 필요한 분석을 Nmap으로 연동해주는 도구입니다. **RustScan**은 기본적으로 TCP 포트 1~65535를 검사하고 발견한 열린 포트를 Nmap에 넘깁니다. 서비스가 어느 포트에서 실행 중인지 먼저 확인할 때 유용합니다. 

**즉, 전체 TCP 포트에서 열린 곳을 먼저 찾을 때는 RustScan**이 **포트 상태나 서비스를 자세히 확인할 때는 Nmap**이 적합합니다. 

공식 페이지에서 RustScan은 Nmap과 비교했을 때 17분 걸리는 Nmap 스캔을 **단 19초 만에** 해낸다'라고 소개하고 있으며, 전체 포트를 대략 7-8초 만에 스캔할 수 있는 **빠른 검색을 보장하는 도구'**라고 소개되어 있지만 네트워크 환경과 서버 응답 방식에 따라 차이가 날 수 있습니다. 

사용 체감상 속도가 확실히 더 빨랐습니다.



## 설치

Rust/Cargo가 준비되어 있다면 다음 명령으로 설치합니다.

```bash
cargo install rustscan
```

운영체제별 설치 방법은 [RustScan Releases](https://github.com/bee-san/RustScan/releases)에서 확인할 수 있습니다. 기본 Nmap 연동을 사용하려면 Nmap도 설치하고 `nmap` 명령을 실행할 수 있어야 합니다. 자세한 설치 방법은 [공식 설치 안내](https://github.com/bee-san/RustScan/wiki/Installation-Guide)를 참고하세요.

## 처음 실행할 명령

```bash
rustscan -a 192.168.1.10
```

이 명령은 대상의 TCP 포트 1~65535를 검사합니다. 열린 포트가 발견되면 RustScan이 해당 포트만 Nmap으로 넘겨 후속 검사를 실행합니다. **Nmap의 후속 검사는 발견한 포트에 집중**합니다.

자주 쓰는 명령은 다음과 같습니다.

```bash
# 포트 결과만 확인하고 Nmap은 실행하지 않음
rustscan -a 192.168.1.10 -g

# 확인할 포트가 정해져 있을 때
rustscan -a 192.168.1.10 -p 22,80,443
rustscan -a 192.168.1.10 -r 1-1000

# 발견한 포트의 서비스 버전을 Nmap으로 확인하고 결과 저장
rustscan -a 192.168.1.10 -- -sV -oA scan_result
```

`--` 뒤에는 Nmap에 전달할 옵션을 적습니다. 마지막 명령의 `-sV`는 서비스 버전 탐지, `-oA scan_result`는 Nmap 결과 파일 저장을 뜻합니다.

## 옵션값 추천

속도에 큰 영향을 주는 값은 **동시에 검사할 포트 수(`-b`)**입니다. `-t`는 응답을 기다리는 시간(ms), `--tries`는 포트당 총 시도 횟수입니다. `-b`를 높이고 `-t`를 낮추면 빨라질 수 있지만, 느리게 응답하는 포트를 놓칠 가능성도 커집니다.

| 상황 | 시작값 |
|---|---|
| 1. 빠른 실습·안정적인 로컬망 | `-b 4500 -t 1500 --tries 1` |
| 2. 일반적인 내부망·원격 호스트 | `-b 1000 -t 3000 --tries 2` |
| 3. 느리거나 부하에 민감한 호스트 | `-b 200 -t 4000 --tries 2` |

첫 번째는 RustScan의 기본값입니다. 나머지는 공식 권장값이 아닌 **조정용 시작값**입니다. 포트 누락이 의심되거나 대상 부하를 줄여야 한다면 `-b`를 낮추고 `-t`를 늘리면 됩니다.

```bash
# 일반적인 시작값으로 전체 포트를 찾은 뒤 서비스 버전 확인
rustscan -a 192.168.1.10 -b 1000 -t 3000 --tries 2 -- -sV
```

## 결과를 해석할 때

RustScan의 결과는 **빠르게 찾은 열린 포트 목록**으로 보는 것이 좋습니다. 포트가 빠진 것 같다면 설정을 조정해 다시 검사합니다. OS 탐지에는 열린 포트뿐 아니라 닫힌 포트 정보도 중요하므로, 필요한 경우 Nmap을 별도로 실행합니다.

두 도구의 **포트 탐색 시간만** 비교할 때는 RustScan의 Nmap 실행을 끄고, Nmap을 전체 TCP 연결 스캔으로 맞춘 상태로 비교합니다.

```bash
rustscan -a 192.168.1.10 --scripts none
nmap -sT -p- -n -Pn 192.168.1.10
```

RustScan으로 포트를 찾고 Nmap으로 서비스를 확인하면 빠르게 조사 범위를 좁힐 수 있습니다. 포트 상태 구분, UDP, OS 탐지가 필요하다면 목적에 맞는 Nmap 스캔을 추가하여 진단하면 됩니다.

## 참고 자료

- [RustScan 공식 저장소](https://github.com/bee-san/RustScan) · [사용 예시](https://github.com/bee-san/RustScan/wiki/Things-you-may-want-to-do-with-RustScan-but-don%27t-understand-how)
- [Nmap 포트 선택](https://nmap.org/book/man-port-specification.html) · [병렬 스캔 방식](https://nmap.org/book/port-scanning-algorithms.html)
