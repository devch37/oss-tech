package com.oss.techradar.repository

import com.oss.techradar.domain.LibraryUsage
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.YearMonth

interface LibraryUsageRepository : JpaRepository<LibraryUsage, Long> {

    /**
     * 특정 도메인의 월별 라이브러리 순위 (usage_count DESC).
     * 파라미터는 엔티티 필드와 같은 YearMonth 를 사용 (LocalDate 를 넘기면 QueryArgumentException).
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
        collectedMonth: YearMonth,
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

    /**
     * 도메인에 집계 데이터가 존재하는 월 목록 (최신순).
     * 프론트엔드가 "데이터가 있는 가장 최근 월"을 기본값으로 쓰기 위해 사용한다.
     */
    @Query(
        """
        SELECT DISTINCT l.collectedMonth FROM LibraryUsage l
        WHERE l.domain = :domain
        ORDER BY l.collectedMonth DESC
        """,
    )
    fun findAvailableMonthsByDomain(domain: String): List<YearMonth>

    fun findByDomainAndLibraryNameAndCollectedMonth(
        domain: String,
        libraryName: String,
        collectedMonth: YearMonth,
    ): LibraryUsage?
}
