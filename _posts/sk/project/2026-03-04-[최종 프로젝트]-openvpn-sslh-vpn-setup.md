---
title: "[최종 프로젝트]OpenVPN + SSLH로 방화벽 우회 VPN 구성하기"
excerpt: "학교 네트워크 환경에서 UDP가 전면 차단된 상황에서 TCP 22 포트 하나로 SSH와 OpenVPN을 동시에 운영하는 방법 정리"
categories: project
tags: [OpenVPN, SSLH, VPN, AWS, Bastion, Terraform, 방화벽우회]
date: 2026-03-04
last_modified_at: 2026-03-04
published: true
---

## 배경

파이널 프로젝트에서 AWS에서 서비스 내부망(VMware)에 접근하기 위해 VPN이 필요했다.
처음에는 WireGuard를 시도했지만 학교 네트워크 환경에서 막혀버렸다..

학교 망의 제약 조건:
- **UDP 전면 차단** → WireGuard(UDP), OpenVPN(UDP) 모두 불가
- **TCP 443도 차단** → AWS IP 대역으로 나가는 443 포트 차단
- **TCP 22만 통과** → SSH만 허용

즉, OpenVPN을 TCP 모드로 올려도 일반적인 포트(1194, 443)는 막혀있어서 **포트 22에서 SSH와 OpenVPN 트래픽을 동시에 처리**해야 했다.

이걸 해결해준 게 **SSLH**다.

---

## 전체 아키텍처

```
GW VM (로컬) ──TCP 22──▶ [SSLH on Bastion] ──▶ OpenVPN (127.0.0.1:1194) ──▶ tun0 ──▶ AWS VPC
                                              └─▶ SSH    (127.0.0.1:2222)
```

| 구성 요소 | 위치 | 역할 |
|-----------|------|------|
| SSLH | Bastion (0.0.0.0:22) | 포트 22 멀티플렉서 (SSH / OpenVPN 분기) |
| sshd | Bastion (127.0.0.1:2222) | 관리용 SSH 접속 |
| OpenVPN Server | Bastion (127.0.0.1:1194) | VPN 서버 (TCP 모드) |
| OpenVPN Client | GW VM (로컬) | VPN 클라이언트 |

포트 22로 들어온 트래픽을 SSLH가 프로토콜을 판별해서 SSH면 `127.0.0.1:2222`로, OpenVPN이면 `127.0.0.1:1194`로 자동으로 넘겨준다.

### VPN 터널 정보

| 항목 | 값 |
|------|-----|
| 터널 대역 | 10.8.0.0/24 |
| Bastion VPN IP | 10.8.0.1 |
| GW VM VPN IP | 10.8.0.2 |
| Push 라우트 | 10.0.0.0/16 (AWS VPC), 192.168.10.0/24 (내부망) |

---

## SSLH란?

SSLH(SSL/SSH multiplexer)는 하나의 포트로 들어오는 여러 프로토콜을 구분해서 각각의 데몬으로 포워딩해주는 프록시다.
원래는 포트 443에서 HTTPS와 SSH를 같이 받기 위해 쓰이지만, 이 경우에는 포트 22에서 **SSH와 OpenVPN**을 분기하는 데 사용했다.

핵심은 SSLH가 포트 22를 점유하고, sshd는 루프백의 2222번으로 옮겨야 한다는 것이다.

---

## Bastion 설정

### 1. SSH 포트 이전 (22 → 127.0.0.1:2222)

SSLH가 포트 22를 가져가야 하므로 sshd를 루프백으로 옮긴다.

```bash
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo sed -i 's/#ListenAddress 0.0.0.0/ListenAddress 127.0.0.1/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> **주의:** 이 작업 전에 반드시 백업 SSH 세션을 열어두어야한다. 잘못되면 접속이 끊길 수 있음

### 2. OpenVPN 설치 및 설정

`openvpn-install.sh` 스크립트로 설치할 때 옵션:
- Protocol: **TCP**
- Port: **1194**
- DNS: Google

설치 후 `server.conf`에서 수정이 필요한 부분:

```bash
# SSLH를 통해 받으므로 루프백에서만 리슨
sudo sed -i 's/^local .*/local 127.0.0.1/' /etc/openvpn/server/server.conf

# 기본 게이트웨이 변경 방지 (특정 대역만 라우팅)
sudo sed -i 's/^push "redirect-gateway/#push "redirect-gateway/' /etc/openvpn/server/server.conf
sudo sed -i 's/^push "block-outside-dns/#push "block-outside-dns/' /etc/openvpn/server/server.conf

# AWS VPC 및 내부망 라우팅 추가
echo 'push "route 10.0.0.0 255.255.0.0"' | sudo tee -a /etc/openvpn/server/server.conf
echo 'push "route 192.168.10.0 255.255.255.0"' | sudo tee -a /etc/openvpn/server/server.conf
echo 'route 192.168.10.0 255.255.255.0' | sudo tee -a /etc/openvpn/server/server.conf
```

`redirect-gateway`를 주석처리하지 않으면 VPN 연결 시 모든 트래픽이 터널로 빨려 들어가서 인터넷이 안 된다. AWS VPC와 내부망 대역만 라우팅하도록 split tunneling 방식으로 설정했다.

### 3. SSLH 설정

```bash
sudo apt install -y sslh

sudo bash -c 'cat > /etc/default/sslh << EOF
RUN=yes
DAEMON=/usr/sbin/sslh
DAEMON_OPTS="--user sslh --listen 0.0.0.0:22 --ssh 127.0.0.1:2222 --openvpn 127.0.0.1:1194 --pidfile /var/run/sslh/sslh.pid"
EOF'

sudo systemctl enable --now sslh
```

### 4. IP 포워딩 및 iptables

내부망에 있는 VPN 클라이언트가 AWS Private Subnet에 접근하려면 Bastion이 패킷을 포워딩해줘야 한다.

```bash
# IP 포워딩 활성화
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-openvpn-forward.conf
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# NAT 설정 (VPN 클라이언트 트래픽을 Bastion의 Private IP로 SNAT)
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
INTERFACE=$(ip -4 route show default | awk '{print $5}')
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 ! -d 10.8.0.0/24 -j SNAT --to $PRIVATE_IP
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -I FORWARD -s 10.8.0.0/24 -j ACCEPT
sudo iptables -I FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
```

> Terraform으로 Bastion을 생성할 때 반드시 `source_dest_check = false` 설정이 필요하다. 이걸 안 하면 AWS가 자신의 IP가 아닌 패킷을 드롭해버린다.

### 5. 설정 확인

```bash
sudo ss -tlnp | grep -E '22|1194|2222'
# 기대 결과:
# 0.0.0.0:22      → sslh
# 127.0.0.1:2222  → sshd
# 127.0.0.1:1194  → openvpn
```

---

## GW VM (클라이언트) 설정

Bastion에서 생성된 `.ovpn` 파일을 GW VM으로 가져온 뒤:

```bash
# /etc/openvpn/client.conf 로 저장
# remote 줄을 포트 22로 수정 (SSLH로 들어가야 하므로)
sudo sed -i 's/remote .* 1194/remote Bastion공인IP 22/' /etc/openvpn/client.conf

sudo systemctl enable --now openvpn@client
```

연결 확인:

```bash
sleep 5
ip addr show tun0          # 10.8.0.2 할당 확인
ip route | grep tun0       # 라우팅 확인
ping 10.8.0.1 -c 3         # Bastion VPN IP ping
```

---

## Terraform 환경에서 OpenVPN 유지하기

프로젝트에서는 비용 절감을 위해 **매일 Terraform으로 인프라를 생성하고 종료**했다.
문제는 Bastion이 새로 생성될 때마다 OpenVPN PKI(인증서/키)가 사라진다는 것.
매번 PKI를 재생성하면 GW VM의 `.ovpn` 파일도 매번 바꿔야 해서 불편하다.

### 해결: S3 백업 + User Data 자동 복원

최초 1회 OpenVPN 설정을 완료한 뒤, 설정 파일 전체를 S3에 백업한다.

```bash
# Bastion에서 실행 (최초 1회)
aws s3 cp /etc/openvpn/server/ s3://프로젝트-버킷/openvpn-backup/ --recursive
aws s3 cp /etc/default/sslh s3://프로젝트-버킷/openvpn-backup/sslh-config
```

백업 대상:
```
/etc/openvpn/server/server.conf
/etc/openvpn/server/ca.crt  ca.key  server.crt  server.key
/etc/openvpn/server/tc.key  dh.pem  crl.pem  ipp.txt
/etc/openvpn/server/easy-rsa/   ← PKI 전체
/etc/default/sslh
```

이후 Terraform `user_data`에 S3 복원 스크립트를 넣으면 Bastion이 새로 뜰 때 자동으로 설정이 복원된다.

```bash
#!/bin/bash
set -e

apt-get update
apt-get install -y openvpn sslh easy-rsa awscli

# S3에서 OpenVPN 설정 복원
aws s3 cp s3://프로젝트-버킷/openvpn-backup/ /etc/openvpn/server/ --recursive

# IP 포워딩
echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/99-openvpn-forward.conf
echo 1 > /proc/sys/net/ipv4/ip_forward

# server.conf local 지시어를 루프백으로 고정
sed -i "s/^local .*/local 127.0.0.1/" /etc/openvpn/server/server.conf

# iptables
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
iptables -t nat -A POSTROUTING -s 10.8.0.0/24 ! -d 10.8.0.0/24 -j SNAT --to $PRIVATE_IP
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
iptables -I FORWARD -s 10.8.0.0/24 -j ACCEPT
iptables -I FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT

# SSH를 루프백 2222로 이전
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sed -i 's/#ListenAddress 0.0.0.0/ListenAddress 127.0.0.1/' /etc/ssh/sshd_config
systemctl restart ssh

# SSLH 설정
cat > /etc/default/sslh << 'EOF'
RUN=yes
DAEMON=/usr/sbin/sslh
DAEMON_OPTS="--user sslh --listen 0.0.0.0:22 --ssh 127.0.0.1:2222 --openvpn 127.0.0.1:1194 --pidfile /var/run/sslh/sslh.pid"
EOF

# 서비스 시작
systemctl enable --now openvpn-server@server.service
systemctl enable --now sslh
```

### Elastic IP로 Bastion IP 고정

Bastion이 새로 생성될 때마다 공인 IP가 바뀌면 GW VM의 `client.conf`에서 `remote` 주소를 매번 수정해야 한다. Terraform에서 EIP를 별도 리소스로 관리하면 IP가 유지된다.

```hcl
resource "aws_eip" "bastion" {
  lifecycle {
    prevent_destroy = true  # terraform destroy 시에도 EIP는 유지
  }
}

resource "aws_eip_association" "bastion" {
  instance_id   = aws_instance.bastion.id
  allocation_id = aws_eip.bastion.id
}
```

EIP + S3 백업 조합으로 매일 인프라를 재생성해도 GW VM 측에서는 아무것도 건드릴 필요 없이 `sudo systemctl restart openvpn@client` 한 줄로 VPN이 연결된다.

---

## 트러블슈팅

### tun0가 안 올라올 때

```bash
# OpenVPN 로그 확인
sudo journalctl -u openvpn@client -f

# 또는 직접 실행해서 에러 확인
sudo openvpn --config /etc/openvpn/client.conf
```

### VPN은 되는데 Private Subnet 접근 안 될 때

```bash
# GW VM 라우팅 테이블 확인
ip route | grep tun0
# "10.0.0.0/16 via 10.8.0.1 dev tun0" 가 있어야 함

# Bastion IP 포워딩 확인
cat /proc/sys/net/ipv4/ip_forward  # 1이어야 함

# Bastion iptables SNAT 확인
sudo iptables -t nat -L POSTROUTING -n
```

### SSLH가 시작 안 될 때 (Address already in use)

sshd가 포트 22를 아직 점유하고 있는 경우다.

```bash
sudo ss -tlnp | grep :22
grep -E "^Port|^ListenAddress" /etc/ssh/sshd_config
# sshd가 127.0.0.1:2222 에서만 리슨하고 있어야 함
```

### WireGuard 충돌

기존에 WireGuard를 쓰다가 전환한 경우 충돌이 날 수 있다.

```bash
sudo wg-quick down wg0
sudo systemctl disable wg-quick@wg0
sudo systemctl restart openvpn@client
```

---

## 최종 설정 요약

```
0.0.0.0:22      → SSLH (외부 진입점)
127.0.0.1:2222  → sshd (SSLH가 SSH 트래픽 전달)
127.0.0.1:1194  → openvpn (SSLH가 OpenVPN 트래픽 전달)
```

Security Group 규칙도 단순해졌다. 기존에 있던 UDP 51820(WireGuard), UDP/TCP 443 규칙 전부 필요 없고 **TCP 22 하나**만 열면 된다.

UDP가 막혀있는 환경에서 OpenVPN을 TCP로 올리고 SSLH로 포트를 공유하는 방식이 생각보다 안정적으로 동작했다. Terraform과 S3 백업을 조합하면 매일 인프라를 재생성하는 환경에서도 VPN 운영 부담이 거의 없어진다.
