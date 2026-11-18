package com.oss.techradar.api

import com.oss.techradar.api.dto.OverviewDto
import com.oss.techradar.api.dto.RepositoryWithScoreDto
import com.oss.techradar.api.dto.TopLibraryDto
import com.oss.techradar.common.ApiResponse
import com.oss.techradar.crawler.CrawlDomains
import com.oss.techradar.repository.ActiveLevelScoreRepository
import com.oss.techradar.repository.LibraryUsageRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.YearMonth

@Tag(name = "Overview", description = "전 도메인 대시보드 요약")
@RestController
@RequestMapping("/api/v1/overview")
class OverviewController(
    private val activeLevelScoreRepository: ActiveLevelScoreRepository,
    private val libraryUsageRepository: LibraryUsageRepository,
) {

    @Operation(
        summary = "전체 대시보드 요약",
        description = "모든 도메인의 레포 수·스타·활동량, 활동 등급 분포, 언어 분포, 상위/숨은 레포, 도메인별 대표 라이브러리를 한 번에 반환합니다.",
    )
    @Transactional(readOnly = true) // ActiveLevelScore.repository 지연 로딩
    @GetMapping
    fun getOverview(): ApiResponse<OverviewDto> {
        val repositories = activeLevelScoreRepository.findAllLatest().map { RepositoryWithScoreDto.from(it) }
        val domains = CrawlDomains.TOPIC_BY_DOMAIN.keys.toList()

        // 이번 달 집계가 하나도 없으면(월초) 지난달 데이터를 쓴다
        val now = YearMonth.now()
        val month = listOf(now, now.minusMonths(1)).firstOrNull { m ->
            domains.any { libraryUsageRepository.countByDomainAndCollectedMonth(it, m) > 0 }
        }

        val libraries = if (month == null) emptyMap() else domains.associateWith { domain ->
            val top = libraryUsageRepository.findRankByDomainAndMonth(domain, month, PageRequest.of(0, 1)).firstOrNull()
            DomainLibraries(
                count = libraryUsageRepository.countByDomainAndCollectedMonth(domain, month).toInt(),
                top = top?.let { TopLibraryDto(it.libraryName, it.usageCount) },
            )
        }

        return ApiResponse.ok(OverviewCalculator.build(repositories, libraries, domains, month?.toString()))
    }
}
