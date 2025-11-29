/**
 * Category Page Pagination
 * 카테고리 페이지에서 게시글을 페이지네이션하여 표시합니다.
 */

(function() {
  'use strict';

  const POSTS_PER_PAGE = 7; // 페이지당 게시글 수 (_config.yml의 paginate와 동일하게 설정)

  /**
   * 카테고리 페이지 체크 및 페이지네이션 적용
   */
  function initCategoryPagination() {
    // 카테고리 페이지인지 확인 (URL에 /categories/가 포함되어 있는지)
    if (!window.location.pathname.includes('/categories/')) {
      return; // 카테고리 페이지가 아니면 종료
    }

    // archive__item을 포함하는 요소들 찾기 (더 넓은 범위로 검색)
    const archiveItems = document.querySelectorAll('.archive__item');
    
    console.log('Found archive items:', archiveItems.length);
    
    if (archiveItems.length === 0) {
      return; // 게시글이 없으면 종료
    }

    // 페이지네이션이 필요 없는 경우 (게시글이 POSTS_PER_PAGE 이하)
    if (archiveItems.length <= POSTS_PER_PAGE) {
      console.log('Not enough posts for pagination');
      return;
    }

    let currentPage = 1;
    const totalPages = Math.ceil(archiveItems.length / POSTS_PER_PAGE);

    // 각 archive__item의 부모 요소를 가져옴 (.list__item 또는 다른 컨테이너)
    const itemContainers = Array.from(archiveItems).map(item => {
      // .list__item, .grid__item 등의 부모 찾기
      let parent = item.parentElement;
      while (parent && !parent.classList.contains('list__item') && 
             !parent.classList.contains('grid__item') && 
             parent !== document.body) {
        parent = parent.parentElement;
      }
      return parent && parent !== document.body ? parent : item;
    });

    /**
     * 특정 페이지의 게시글만 표시
     */
    function showPage(page) {
      const start = (page - 1) * POSTS_PER_PAGE;
      const end = start + POSTS_PER_PAGE;

      itemContainers.forEach((item, index) => {
        if (index >= start && index < end) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });

      currentPage = page;
      updatePaginationUI();
      
      // 페이지 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 페이지네이션 UI 생성
     */
    function createPaginationUI() {
      const paginationContainer = document.createElement('nav');
      paginationContainer.className = 'pagination';
      paginationContainer.id = 'category-pagination';
      
      // archive 요소 또는 main 요소 찾기
      const archiveElement = document.querySelector('.archive') || document.querySelector('main');
      if (archiveElement) {
        archiveElement.appendChild(paginationContainer);
        console.log('Pagination UI created');
      } else {
        console.error('Could not find container for pagination');
      }
    }

    /**
     * 페이지네이션 UI 업데이트
     */
    function updatePaginationUI() {
      const paginationContainer = document.getElementById('category-pagination');
      if (!paginationContainer) return;

      let html = '<ul>';

      // 이전 버튼
      if (currentPage > 1) {
        html += `<li><a href="#" data-page="${currentPage - 1}">이전</a></li>`;
      } else {
        html += '<li><a href="#" class="disabled">이전</a></li>';
      }

      // 첫 페이지
      if (currentPage === 1) {
        html += '<li><a href="#" class="disabled current">1</a></li>';
      } else {
        html += '<li><a href="#" data-page="1">1</a></li>';
      }

      // 페이지 번호들
      let pageStart = 2;
      if (currentPage > 4) {
        pageStart = currentPage - 2;
        html += '<li><a href="#" class="disabled">&hellip;</a></li>';
      }

      let pageEnd = totalPages - 1;
      const pagesToEnd = totalPages - currentPage;
      if (pagesToEnd > 4) {
        pageEnd = currentPage + 2;
      }

      for (let i = pageStart; i <= pageEnd; i++) {
        if (i === currentPage) {
          html += `<li><a href="#" class="disabled current">${i}</a></li>`;
        } else {
          html += `<li><a href="#" data-page="${i}">${i}</a></li>`;
        }
      }

      // 끝 생략 부호
      if (pagesToEnd > 3) {
        html += '<li><a href="#" class="disabled">&hellip;</a></li>';
      }

      // 마지막 페이지
      if (totalPages > 1) {
        if (currentPage === totalPages) {
          html += `<li><a href="#" class="disabled current">${totalPages}</a></li>`;
        } else {
          html += `<li><a href="#" data-page="${totalPages}">${totalPages}</a></li>`;
        }
      }

      // 다음 버튼
      if (currentPage < totalPages) {
        html += `<li><a href="#" data-page="${currentPage + 1}">다음</a></li>`;
      } else {
        html += '<li><a href="#" class="disabled">다음</a></li>';
      }

      html += '</ul>';
      paginationContainer.innerHTML = html;

      // 클릭 이벤트 추가
      paginationContainer.querySelectorAll('a:not(.disabled)').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(e.target.dataset.page);
          if (page) {
            showPage(page);
          }
        });
      });
    }

    // 초기화
    console.log('Initializing category pagination');
    createPaginationUI();
    showPage(1);
  }

  // DOM 로드 완료 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoryPagination);
  } else {
    initCategoryPagination();
  }

})();
