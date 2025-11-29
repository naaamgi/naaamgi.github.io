/**
 * Utterances Comment Count
 * GitHub Issues API를 통해 각 게시글의 댓글 개수를 가져와서 표시합니다.
 */

(function() {
  'use strict';

  // GitHub 설정
  const GITHUB_REPO = 'naaamgi/naaamgi.github.io'; // _config.yml의 repository
  const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/issues`;
  
  /**
   * GitHub API를 통해 특정 pathname에 해당하는 Issue의 댓글 개수 가져오기
   */
  async function getCommentCount(pathname) {
    try {
      console.log('확인하는 pathname:', pathname);
      
      // utterances는 issue_term이 pathname이므로, Issue 제목이 pathname과 일치
      const response = await fetch(`${GITHUB_API}?state=all&per_page=100`);
      
      if (!response.ok) {
        console.warn('GitHub API 호출 실패:', response.status);
        return null;
      }
      
      const issues = await response.json();
      console.log('가져온 Issues 총 개수:', issues.length);
      console.log('Issue 제목들:', issues.map(i => i.title));
      
      // pathname과 일치하는 Issue 찾기
      const issue = issues.find(issue => issue.title === pathname);
      
      if (issue) {
        console.log('찾은 Issue:', issue.title, '댓글 개수:', issue.comments);
        return issue.comments;
      }
      
      console.log('pathname과 일치하는 Issue를 찾지 못함:', pathname);
      return 0; // Issue가 없으면 댓글도 0개
      
    } catch (error) {
      console.error('댓글 개수 가져오기 실패:', error);
      return null;
    }
  }
  
  /**
   * 모든 게시글 링크에 댓글 개수 추가
   */
  async function addCommentCounts() {
    // .archive__item-title 안의 모든 링크 찾기
    const postLinks = document.querySelectorAll('.archive__item-title a[rel="permalink"]');
    
    if (postLinks.length === 0) {
      return; // 게시글 목록이 없으면 종료
    }
    
    // 각 링크에 대해 댓글 개수 가져오기
    for (const link of postLinks) {
      const url = new URL(link.href);
      const pathname = url.pathname;
      
      // 댓글 개수 표시용 span 생성
      const commentSpan = document.createElement('span');
      commentSpan.className = 'comment-count';
      commentSpan.innerHTML = ' <i class="far fa-comment"></i> ...'; // 로딩 중 표시
      
      // 제목 뒤에 추가
      link.parentNode.appendChild(commentSpan);
      
      // API 호출해서 실제 댓글 개수 가져오기
      const count = await getCommentCount(pathname);
      
      if (count !== null) {
        if (count > 0) {
          commentSpan.innerHTML = ` <i class="far fa-comment"></i> (${count})`;
        } else {
          commentSpan.innerHTML = ` <i class="far fa-comment"></i> (0)`;
        }
      } else {
        commentSpan.remove(); // API 호출 실패시 제거
      }
      
      // API Rate Limit 방지를 위해 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // DOM 로드 완료 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCommentCounts);
  } else {
    addCommentCounts();
  }
  
})();
