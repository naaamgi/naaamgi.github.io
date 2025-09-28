---
title: "Proving grounds Practice: Compromised 문제풀이"

excerpt: "Offsec proving grounds practice windows machine writeup"

categories: pg_practice

tags:

- CTF

- Offsec labs

- OSCP

- Writeup

- Windows

- pg-practice

typora-root-url: ../../

date: 2025-09-25

last_modified_at: 2025-09-25


---

 

## Enumeration

### RustScan + Nmap

```bash	
└─$ rustscan -a 192.168.114.152 -- nmap -sV -sC -Pn -n --open
Open 192.168.114.152:80                                                                                                         
Open 192.168.114.152:135                                                                                                        
Open 192.168.114.152:139                                                                                                        
Open 192.168.114.152:443                                                                                                        
Open 192.168.114.152:445                                                                                                        
Open 192.168.114.152:5985                                                                                                       
Open 192.168.114.152:49666  

[ . . . ]

PORT      STATE SERVICE       REASON          VERSION                                                         16:18:35 [38/1426]
80/tcp    open  http          syn-ack ttl 125 Microsoft IIS httpd 10.0
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server 
|_http-server-header: Microsoft-IIS/10.0
135/tcp   open  msrpc         syn-ack ttl 125 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 125 Microsoft Windows netbios-ssn
443/tcp   open  ssl/http      syn-ack ttl 125 Microsoft IIS httpd 10.0
| tls-alpn: 
|_  http/1.1
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
| ssl-cert: Subject: commonName=PowerShellWebAccessTestWebSite
| Issuer: commonName=PowerShellWebAccessTestWebSite
| Public Key type: rsa
| Public Key bits: 1024
| Signature Algorithm: sha1WithRSAEncryption
| Not valid before: 2021-06-01T08:00:08
| Not valid after:  2021-08-30T08:00:08
| MD5:   b7f6:d9ee:88ed:8557:836c:5955:9ace:0128
| SHA-1: 85a3:b573:101e:d137:0acf:e7fd:3838:ca07:22ed:c211
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server 
|_ssl-date: 2025-09-25T07:18:36+00:00; 0s from scanner time.
445/tcp   open  microsoft-ds? syn-ack ttl 125
5985/tcp  open  http          syn-ack ttl 125 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49666/tcp open  msrpc         syn-ack ttl 125 Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| p2p-conficker: 
|   Checking for Conficker.C or higher...
|   Check 1 (port 63154/tcp): CLEAN (Timeout)
|   Check 2 (port 50164/tcp): CLEAN (Timeout)
|   Check 3 (port 30338/udp): CLEAN (Timeout)
|   Check 4 (port 60430/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2025-09-25T07:17:57
|_  start_date: N/A
|_clock-skew: mean: 0s, deviation: 0s, median: 0s


```



### SMB

smb 목록 조회
```bash
└─$ smbclient -U '' -L \\\\192.168.114.152                                                                                      
Password for [WORKGROUP\]:                                                                                                      
                                                                                                                                
        Sharename       Type      Comment                                                                                       
        ---------       ----      -------                                                                                       
        ADMIN$          Disk      Remote Admin                                                                                  
        C$              Disk      Default share                                                                                 
        IPC$            IPC       Remote IPC                                                                                    
        Scripts$        Disk                                                                                                    
        Users$          Disk                   
```


Scripts$ 에 존재하는 내 칼리로 다운로드
```bash
└─$ smbclient -U username //192.168.114.152/Scripts$
Password for [WORKGROUP\username]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Tue Jun  1 23:57:45 2021
  ..                                  D        0  Tue Jun  1 23:57:45 2021
  defrag.ps1                          A       49  Tue Jun  1 23:57:45 2021
  fix-printservers.ps1                A      283  Tue Jun  1 23:57:45 2021
  install-features.ps1                A       81  Tue Jun  1 23:57:45 2021
  purge-temp.ps1                      A      105  Tue Jun  1 23:57:45 2021

                7706623 blocks of size 4096. 4052403 blocks available
smb: \> prompt off
smb: \> recurse
smb: \> mget *
getting file \defrag.ps1 of size 49 as defrag.ps1 (0.2 KiloBytes/sec) (average 0.2 KiloBytes/sec)
getting file \fix-printservers.ps1 of size 283 as fix-printservers.ps1 (0.9 KiloBytes/sec) (average 0.5 KiloBytes/sec)
getting file \install-features.ps1 of size 81 as install-features.ps1 (0.3 KiloBytes/sec) (average 0.4 KiloBytes/sec)
getting file \purge-temp.ps1 of size 105 as purge-temp.ps1 (0.3 KiloBytes/sec) (average 0.4 KiloBytes/sec)
smb: \> ll                                                       
[0] 0:sudo  1:zsh- 2:[tmux]*                                      
```

```text
# 위 smb 명령어 설명
- `prompt off`
  - 파일 전송시 사용자에게 매번 확인을 받지 않도록 설정
  - 여러 파일을 다운로드할 때 속도를 높이기 위해 사용
  
- `recurse`
  - 하위 디렉토리까지 재귀적으로 접근하여 파일을 전송하도록 설정
  - 폴더 내 폴더들까지 모두 가져오고 싶을 때 사용
  
- `mget *`
  - 현재 디렉토리 내 있는 모든 파일(와일드카드 `*` 사용)을 다운로드
  - 각각의 파일을 로컬에 같은 파일명으로 저장
```