package com.oss.techradar.crawler

import com.oss.techradar.domain.LibraryUsage
import com.oss.techradar.repository.LibraryUsageRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.YearMonth

/**
 * 이번 크롤링 회차에서 수집한 "레포 → 라이브러리 목록"을 라이브러리별 사용 레포 수로 집계하고,
 * 전월 대비 증감률과 함께 [LibraryUsage]로 upsert한다.
 */
@Service
class LibraryAggregationService(
    private val libraryUsageRepository: LibraryUsageRepository,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun aggregate(domain: String, month: YearMonth, repoToLibraries: Map<Long, List<String>>) {
        val usageCounts: Map<String, Int> = repoToLibraries.values
            .flatMap { it.distinct() }
            .groupingBy { it }
            .eachCount()

        val prevMonth = month.minusMonths(1)

        usageCounts.forEach { (libraryName, usageCount) ->
            val prevMonthCount = libraryUsageRepository
                .findByDomainAndLibraryNameAndCollectedMonth(domain, libraryName, prevMonth.atDay(1))
                ?.usageCount ?: 0

            val growthRate = when {
                prevMonthCount == 0 && usageCount > 0 -> 100.0
                prevMonthCount == 0 -> 0.0
                else -> (usageCount - prevMonthCount).toDouble() / prevMonthCount * 100.0
            }

            val existing = libraryUsageRepository
                .findByDomainAndLibraryNameAndCollectedMonth(domain, libraryName, month.atDay(1))

            libraryUsageRepository.save(
                LibraryUsage(
                    id = existing?.id ?: 0,
                    libraryName = libraryName,
                    domain = domain,
                    collectedMonth = month,
                    usageCount = usageCount,
                    prevMonthCount = prevMonthCount,
                    growthRate = growthRate,
                ),
            )
        }

        log.info("[$domain] $month 라이브러리 집계 완료 (${usageCounts.size}개 라이브러리)")
    }
}
