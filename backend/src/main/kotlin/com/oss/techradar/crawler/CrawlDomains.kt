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
}
