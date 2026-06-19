source "https://rubygems.org"

# GitHub Pages의 핵심 Jekyll dependency를 명시적으로 나열합니다.
# GitHub Pages 환경을 맞추면서, jekyll-sitemap과 jekyll-feed는 제외합니다.
gem "jekyll"
gem "jekyll-seo-tag" # Minimal Mistakes에서 자주 사용
gem "jekyll-paginate" # Minimal Mistakes에서 자주 사용
# Minimal Mistakes 테마 젬 (사용하고 계시다면 추가)
gem "minimal-mistakes-jekyll" 

# sitemap과 feed를 수동으로 만들 것이므로, 이들은 목록에서 제외합니다.

# Windows 환경에서 시간대 정보를 처리하기 위한 패키지 추가
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# Windows 환경에서 파일 변경 감지 성능을 향상시키기 위한 패키지 추가 (경고 메시지 해결)
gem "wdm", ">= 0.1.0" if Gem.win_platform?