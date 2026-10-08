# naaamgi.github.io

## 소개
현직 모의해킹(Penetration Testing) 전문가가 실무 경험을 바탕으로 운영하는 웹 보안 기술 블로그입니다.
취약점 분석·모의해킹 기법·보안 도구 리뷰 등 100개 이상의 전문 보안 콘텐츠를 오픈소스 형태로 공개하고 있으며,
AI 기반 보안 자동화 도구의 실증 테스트 결과도 함께 기록합니다.

## 주요 기능
- 웹 취약점 분석 (Apache, SQL Injection, XSS 등) 실전 가이드
- 모의해킹 기법 및 공격 시나리오·대응 방안 문서화
- AI 기반 보안 자동화 도구(Strix) 실증 분석 및 결과 공개
- Mermaid.js 다이어그램을 활용한 보안 개념 시각화

## 사용 방법
1. https://naaamgi.github.io 접속
2. 카테고리 또는 태그로 원하는 보안 주제 탐색
3. 포스트 내 코드·다이어그램·실습 가이드 참고

## 로컬 미리보기

Ruby와 Bundler가 설치된 환경에서 저장소 루트를 기준으로 실행합니다.

```powershell
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4000 --unpublished --disable-disk-cache
```

[로컬 블로그](http://127.0.0.1:4000/)에서 확인합니다. `--unpublished`는 `published: false`인 포스트도 로컬에 표시합니다. Markdown 파일을 저장하면 자동으로 다시 생성되며, 브라우저를 새로고침하면 변경을 볼 수 있습니다. 서버 종료는 실행한 터미널에서 `Ctrl+C`를 누릅니다.

Neo-reGeorg 초안: [로컬 글 보기](http://127.0.0.1:4000/pnt/neo-regeorg-concepts/)

전체 빌드만 확인하려면 다음을 실행합니다.

```powershell
bundle exec jekyll build --unpublished --disable-disk-cache
```

## 라이선스
MIT License
