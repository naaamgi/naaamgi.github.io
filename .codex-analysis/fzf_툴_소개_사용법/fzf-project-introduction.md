# 터미널 파일 탐색/히스토리 검색 개선

이 문서는 Windows PowerShell과 Kali WSL에서 `fzf`, `fd`, `bat`를 조합해 파일 탐색과 명령어 재사용을 빠르게 만드는 터미널 생산성 개선 작업을 소개하는 문서입니다.

## 왜 만들었나

보안 진단 환경에서는 같은 명령을 반복해서 조금씩 바꾸거나, 여러 스크립트/워드리스트/설정 파일을 빠르게 찾아야 할 때가 많습니다.

기존 방식은 가능하지만 손이 많이 갑니다.

```powershell
Get-ChildItem -Recurse
find . -type f
history | Select-String ...
cat file
```

이 프로젝트의 목표는 단순합니다.

- 히스토리 검색은 `fh` 하나로 끝낸다.
- 파일 검색은 `ff` 하나로 끝낸다.
- hidden 파일까지 보고 싶을 때만 `ffh`를 쓴다.
- 파일 목록과 미리보기를 한 화면에서 본다.
- Windows와 Kali WSL에서 최대한 같은 사용감을 유지한다.

## 최종 명령어

```bash
fh      # 히스토리 검색
ff      # 현재 디렉터리 파일 검색, hidden 제외
ffh     # 현재 디렉터리 파일 검색, hidden 포함
```

경로를 지정할 수도 있습니다.

```bash
ff /usr/share/wordlists
ffh ~/.config
ff C:\Pentest
```

## 사용 예시

### 1. `fh` 히스토리 검색

이전 명령을 다시 찾고, 바로 실행하지 않고 입력줄에 올릴 수 있음

```powershell
fh
# > 검색어 입력
```

![image-20260727151114227](fzf-guide-assets/usage-screenshot-01.png)

### 2. `ff` 일반 파일 검색

현재 디렉터리 기준으로 파일 목록과 preview를 한 화면에서 볼 수 있음

```powershell
cd C:\Users\SECREZEN\
ff
```

또는 Kali에서:

```bash
cd ~
ff
```

![image-20260727153527912](fzf-guide-assets/usage-screenshot-02.png)


### 3. `ffh` hidden 포함 검색

목적: 기본 `ff`는 가볍게 쓰고, hidden까지 필요할 때만 `ffh`를 씀

```powershell
ffh
```

### 4. 워드리스트/보안 도구 경로 탐색

Kali:

```bash
ff /usr/share/wordlists
```

![image-20260727154054866](fzf-guide-assets/usage-screenshot-03.png)

Windows:

```powershell
ff C:\Pentest\02_Tools\Wordlists
```

![image-20260727153957545](fzf-guide-assets/usage-screenshot-04.png)



#### preview 창에서 스크롤 가능합니다.



## 설계 기준

### 현재 디렉터리 기준 검색

`ff`와 `ffh`는 전체 디스크를 뒤지지 않습니다. 현재 위치 기준으로만 찾습니다.

```bash
ff
ffh
```

필요할 때만 경로를 지정합니다.

```bash
ff C:\Pentest
ff /usr/share/wordlists
```

### hidden은 명시적으로만 포함

일반적으로 hidden 폴더에는 캐시, 확장, 빌드 산출물이 많습니다. 그래서 기본 명령인 `ff`는 hidden을 제외하고, 필요할 때만 `ffh`를 사용합니다.

```bash
ff      # hidden 제외
ffh     # hidden 포함
```


### 검색 팁

fzf 검색창 안에서:

```text
'정확한문자열
^시작문자열
!제외문자열
```

### 반응성 우선

이미지/PDF/압축파일을 파일 타입별로 예쁘게 preview할 수도 있지만, 그만큼 preview가 느려질 수 있습니다. 이 프로젝트에서는 자주 쓰는 텍스트/스크립트 파일 preview를 빠르게 보는 쪽에 우선순위를 둡니다.

### bat 우선, 없으면 기본 도구 fallback

Windows:

```text
bat 있으면 bat
bat 없으면 type
```

Kali:

```text
bat 있으면 bat
bat 없으면 cat
```

## 설치 가이드

실제 설치/설정 절차는 아래 파일에 정리되어 있습니다.

[fzf-setup-guide.md](fzf-setup-guide.md)

