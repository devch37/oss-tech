package com.oss.techradar.repository

import com.oss.techradar.domain.ActiveLevelScore
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ActiveLevelScoreRepository : JpaRepository<ActiveLevelScore, Long> {

    /** 레포지토리의 가장 최근 점수 1건 */
    fun findFirstByRepositoryIdOrderByCalculatedAtDesc(repositoryId: Long): ActiveLevelScore?

    /** domain 내 레포들의 최신 점수 TOP N (score DESC) */
    @Query(
        """
        SELECT a FROM ActiveLevelScore a
        WHERE a.repository.domain = :domain
          AND a.calculatedAt = (
              SELECT MAX(a2.calculatedAt)
              FROM ActiveLevelScore a2
              WHERE a2.repository.id = a.repository.id
          )
        ORDER BY a.score DESC
        """,
    )
    fun findLatestTopByDomain(domain: String, pageable: Pageable): List<ActiveLevelScore>

    fun findAllByRepositoryId(repositoryId: Long): List<ActiveLevelScore>
}
