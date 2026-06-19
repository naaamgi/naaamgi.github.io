# 프로젝트 카테고리 관리 규칙 (naaamgi.github.io)

이 프로젝트는 보안/모의해킹 실무 타겟 구조인 `Web / DB / Infra / Cloud / CTF` 5대 분류 체계를 따릅니다.
새로운 하위 카테고리를 생성하거나 관리할 때는 반드시 아래의 4가지 단계를 거쳐야 합니다.

## 카테고리 추가 시 4단계 필수 작업

1. **디렉토리 생성**
   - 경로: `_posts/[카테고리명]`
   - 예시: `_posts/burpsuite`

2. **카테고리 목록 페이지 생성**
   - 경로: `_pages/categories/categories-[카테고리명].md`
   - 양식 (기존 파일 포맷 엄수):
     ```markdown
     ---
     title: "[화면에 표시될 카테고리명]"
     layout: archive
     permalink: categories/[카테고리명]
     author_profile: true
     sidebar_main: true
     ---
     
     {% assign posts = site.categories.[카테고리명] %}
     {% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}
     ```

3. **데이터 설정 (`_data/categories.yml`)**
   - 파일의 맨 아래에 다음 양식으로 추가:
     ```yaml
     - name: [카테고리명]
       display_name: "[화면에 표시될 카테고리명]"
       url: "/categories/[카테고리명]"
     ```

4. **사이드바 메뉴 추가 (`_includes/nav_list_main`)**
   - 해당 카테고리가 소속될 5대 대분류(`Web`, `DB`, `Infra`, `Cloud`, `CTF`) 영역의 `<ul>` 태그 내부에 아래 스니펫 추가:
     ```html
     {% comment %} [카테고리명] 카테고리 {% endcomment %}
     {% for category in site.data.categories %}
       {% if category.name == "[카테고리명]" %}
         <li>
           <a href="{{ category.url }}">
             {{ category.display_name }} ({{ site.categories[category.name] | size | default: 0 }})
           </a>
         </li>
       {% endif %}
     {% endfor %}
     ```

## 주의 사항
- `_includes/nav_list_main`의 기존 `SK Shielders Rookies`와 `유용한 툴 & 정보` 카테고리 구조는 수정하거나 훼손하지 않습니다.
- 포스트 마크다운 파일 작성 시 Frontmatter의 `categories` 리스트에 이 규칙에서 정의한 `[카테고리명]`을 정확히 기재해야 사이드바 목록에 올바르게 연동됩니다.
