package com.oss.techradar.repository

import com.oss.techradar.domain.LibraryUsage
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface LibraryUsageRepository : JpaRepository<LibraryUsage, Long> {

    /**
     * 특정 도메인의 월별 라이브러리 순위 (usage_count DESC).
     * YearMonthConverter가 collectedMonth를 LocalDate로 변환하므로 파라미터도 LocalDate 사용.
     */
    @Query(
        """
        SELECT l FROM LibraryUsage l
        WHERE l.domain = :domain AND l.collectedMonth = :collectedMonth
        ORDER BY l.usageCount DESC
        """,
    )
    fun findRankByDomainAndMonth(
        domain: String,
        collectedMonth: LocalDate,
        pageable: Pageable,
    ): List<LibraryUsage>

    /**
     * 라이브러리 시계열 트렌드 (전체 월, 오래된 순).
     */
    @Query(
        """
        SELECT l FROM LibraryUsage l
        WHERE l.libraryName = :libraryName AND l.domain = :domain
        ORDER BY l.collectedMonth ASC
        """,
    )
    fun findTrendByLibraryAndDomain(
        libraryName: String,
        domain: String,
    ): List<LibraryUsage>

    fun findByDomainAndLibraryNameAndCollectedMonth(
        domain: String,
        libraryName: String,
        collectedMonth: LocalDate,
    ): LibraryUsage?
}
