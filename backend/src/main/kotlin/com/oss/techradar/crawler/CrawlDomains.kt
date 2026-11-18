package com.oss.techradar.crawler

/**
 * 프론트엔드 DomainSelector(frontend/backend/devops/mobile/data/security)와
 * 1:1로 대응하는 도메인 → GitHub topic 매핑.
 *
 * 크롤러는 도메인마다 `topic:{value}` 검색 쿼리로 GitHub Search API를 호출해
 * 해당 생태계의 인기 레포지토리를 수집한다.
 */
object CrawlDomains {
    val TOPIC_BY_DOMAIN: Map<String, String> = linkedMapOf(
        "frontend" to "frontend",
        "backend" to "backend",
        "devops" to "devops",
        "mobile" to "mobile",
        "data" to "data-science",
        "security" to "security",
    )

    /**
     * 소프트웨어가 아니라 링크·글을 모아 둔 "목록/문서형" 레포인지 이름으로 가려낸다.
     * 이런 레포는 스타가 많고 커밋(링크 추가)도 잦아 "가장 활발한 프로젝트"를 왜곡한다.
     * 이름 규칙이라 완벽하지 않으며, 일부 진짜 프로젝트가 걸릴 수 있어 범위를 좁게 잡았다.
     */
    private val CURATED_LIST_NAME = Regex(
        "(^awesome[-_]|[-_]awesome$|internship|interview|roadmap|cheat-?sheet|free-programming|free-for-dev|public-apis|(^|-)books?$)",
        RegexOption.IGNORE_CASE,
    )

    fun isCuratedList(repoName: String): Boolean = CURATED_LIST_NAME.containsMatchIn(repoName)
}
