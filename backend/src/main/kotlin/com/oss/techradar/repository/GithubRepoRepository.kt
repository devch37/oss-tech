package com.oss.techradar.repository

import com.oss.techradar.domain.GithubRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface GithubRepoRepository : JpaRepository<GithubRepository, Long> {

    fun findByOwnerAndName(owner: String, name: String): GithubRepository?

    fun findAllByDomain(domain: String, pageable: Pageable): Page<GithubRepository>

    /** domain 내 stars 내림차순 정렬 + 페이징 */
    @Query(
        value = "SELECT r FROM GithubRepository r WHERE r.domain = :domain ORDER BY r.stars DESC",
        countQuery = "SELECT COUNT(r) FROM GithubRepository r WHERE r.domain = :domain",
    )
    fun findTopByDomainOrderByStars(domain: String, pageable: Pageable): Page<GithubRepository>

    fun existsByOwnerAndName(owner: String, name: String): Boolean

    /** 도메인별 레포 수 집계 — GET /api/v1/domains 용 */
    @Query("SELECT r.domain AS domain, COUNT(r) AS repositoryCount FROM GithubRepository r GROUP BY r.domain ORDER BY COUNT(r) DESC")
    fun findDomainSummaries(): List<DomainSummaryProjection>
}

/** Spring Data Projection — findDomainSummaries() 반환 타입 */
interface DomainSummaryProjection {
    val domain: String
    val repositoryCount: Long
}
